import { DocCtx, MarkSpec } from "../markEngine/type";

interface EditorOptions {
  placeholder: string;
}

interface SelectionResult {
  selection: Selection;
  range: Range;
}

interface SplitTextResult {
  before: string;
  selected: string;
  after: string;
  node: Text;
}

interface FormatCheckResult {
  has: boolean;
  element: Node | null;
}

export class Editor {
  ctx: DocCtx;
  element: HTMLElement;
  options: EditorOptions;
  _history: string[];
  _historyIndex: number;
  _selectionChangeCallbacks: ((selection: Selection) => void)[];
  _isUndoRedo: boolean;
  _savedRange: Range | null;

  constructor(ctx: DocCtx, options: EditorOptions) {
    this.ctx = ctx;
    this.options = options;
    this.element = ctx.document.body;
    this._history = [];
    this._selectionChangeCallbacks = [];
    this._historyIndex = -1;
    this._isUndoRedo = false;
    this._savedRange = null;
    this._init();
  }

  _init(): void {
    this._setupPlaceholder();
    this._setupSelectionListener();
    this._setupHistory();
    console.log('editor init successfully');
  }

  _setupHistory(): void {
    this._history = [];
    this._historyIndex = -1;
    this._isUndoRedo = false;
    
    // 保存初始状态
    this._saveHistory();
    
    // 监听输入变化，保存历史
    this.element.addEventListener('input', () => {
      if (!this._isUndoRedo) {
        this._saveHistory();
      }
    });
  }

  _saveHistory(): void {
    const html = this.element.innerHTML;
    
    // 如果和当前状态相同，不保存
    if (this._history[this._historyIndex] === html) return;
    
    // 删除当前位置之后的历史
    this._history = this._history.slice(0, this._historyIndex + 1);
    
    // 添加新状态
    this._history.push(html);
    this._historyIndex = this._history.length - 1;
    
    // 限制历史记录数量
    if (this._history.length > 100) {
      this._history.shift();
      this._historyIndex--;
    }
  }

  undo(): void {
    if (this._historyIndex > 0) {
      this._isUndoRedo = true;
      this._historyIndex--;
      this.element.innerHTML = this._history[this._historyIndex];
      this._isUndoRedo = false;
    }
  }

  redo(): void {
    if (this._historyIndex < this._history.length - 1) {
      this._isUndoRedo = true;
      this._historyIndex++;
      this.element.innerHTML = this._history[this._historyIndex];
      this._isUndoRedo = false;
    }
  }

  canUndo(): boolean {
    return this._historyIndex > 0;
  }

  canRedo(): boolean {
    return this._historyIndex < this._history.length - 1;
  }

  _setupPlaceholder(): void {
    const checkPlaceholder = () => {
      if (!this.element.textContent?.trim()) {
        this.element.setAttribute('data-placeholder', this.options.placeholder);
      } else {
        this.element.removeAttribute('data-placeholder');
      }
    };
    
    this.element.addEventListener('input', checkPlaceholder);
    this.element.addEventListener('focus', checkPlaceholder);
    this.element.addEventListener('blur', checkPlaceholder);
    checkPlaceholder();
  }

  _setupSelectionListener(): void {
    this._selectionChangeCallbacks = [];
    
    this.ctx.document.addEventListener('selectionchange', () => {
      const selection = this.ctx.view.getSelection();
      if (selection && selection.anchorNode && this.element.contains(selection.anchorNode)) {
        this._selectionChangeCallbacks.forEach(cb => cb(selection));
      }
    });
  }

  onSelectionChange(callback: (selection: Selection) => void): void {
    this._selectionChangeCallbacks.push(callback);
  }

  /**
   * 获取当前选区
   */
  getSelection(): SelectionResult | null {
    const selection = this.ctx.view.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    
    if (!this.element.contains(range.commonAncestorContainer)) {
      return null;
    }
    
    return { selection, range };
  }

  /**
   * 保存当前选区
   */
  saveSelection(): Range | null {
    const sel = this.getSelection();
    if (sel) {
      this._savedRange = sel.range.cloneRange();
    }
    return this._savedRange;
  }

  /**
   * 恢复保存的选区
   */
  restoreSelection(): void {
    if (this._savedRange) {
      const selection = this.ctx.view.getSelection();
      if (!selection) return;
      selection.removeAllRanges();
      selection.addRange(this._savedRange);
    }
  }

  /**
   * 获取选区内的所有文本节点
   */
  _getTextNodesInRange(range: Range): Node[] {
    const textNodes: Node[] = [];
    const walker = this.ctx.document.createTreeWalker(
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
        ? range.commonAncestorContainer.parentNode as Node
        : range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (range.intersectsNode(node)) {
        textNodes.push(node);
      }
    }
    return textNodes;
  }

  /**
   * 切割文本节点，只包裹选中部分
   */
  _splitTextNode(textNode: Text, range: Range): SplitTextResult {
    const text = textNode.textContent || '';
    const startOffset = textNode === range.startContainer ? range.startOffset : 0;
    const endOffset = textNode === range.endContainer ? range.endOffset : text.length;

    const before = text.slice(0, startOffset);
    const selected = text.slice(startOffset, endOffset);
    const after = text.slice(endOffset);

    return { before, selected, after, node: textNode };
  }

  /**
   * 检查节点是否已经有指定的格式
   */
  _hasFormat(
    node: Node,
    tagName: string | null,
    styleProp: keyof CSSStyleDeclaration | null,
    styleValue: string | null
  ): FormatCheckResult {
    let current: Node | null = node;
    while (current && current !== this.element) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = current as HTMLElement;
        // 检查标签名
        if (tagName && element.tagName === tagName.toUpperCase()) {
          return { has: true, element: current };
        }
        // 检查样式
        if (styleProp && element.style && element.style[styleProp]) {
          if (!styleValue || element.style[styleProp] === styleValue) {
            return { has: true, element: current };
          }
        }
      }
      current = current.parentNode;
    }
    return { has: false, element: null };
  }

  /**
   * 用指定标签包裹选中文本（支持切换）
   */
  _wrapWithTag(tagName: string, styles: Partial<CSSStyleDeclaration> = {}): boolean {
    const sel = this.getSelection();
    if (!sel || sel.range.collapsed) return false;

    const { range } = sel;
    const textNodes = this._getTextNodesInRange(range);
    
    if (textNodes.length === 0) return false;

    // 检查是否所有节点都已有此格式
    const allHaveFormat = textNodes.every(node => 
      this._hasFormat(node, tagName, null, null).has
    );

    const newNodes: Node[] = [];

    textNodes.forEach(textNode => {
      const { before, selected, after } = this._splitTextNode(textNode as Text, range);
      const parent = textNode.parentNode;

      if (!selected || !parent) return;

      const fragment = this.ctx.document.createDocumentFragment();

      // 前面未选中的部分
      if (before) {
        fragment.appendChild(this.ctx.document.createTextNode(before));
      }

      // 选中的部分
      if (allHaveFormat) {
        // 移除格式：直接插入文本
        const textOnly = this.ctx.document.createTextNode(selected);
        fragment.appendChild(textOnly);
        newNodes.push(textOnly);
      } else {
        // 添加格式：用标签包裹
        const wrapper = this.ctx.document.createElement(tagName);
        Object.assign(wrapper.style, styles);
        wrapper.textContent = selected;
        fragment.appendChild(wrapper);
        newNodes.push(wrapper);
      }

      // 后面未选中的部分
      if (after) {
        fragment.appendChild(this.ctx.document.createTextNode(after));
      }

      parent.replaceChild(fragment, textNode);
    });

    // 如果是移除格式，需要解除父级标签包裹
    if (allHaveFormat) {
      newNodes.forEach(node => {
        this._unwrapFromTag(node, tagName);
      });
    }

    // 重新选中处理后的内容
    this._selectNodes(newNodes);
    return true;
  }

  /**
   * 从指定标签中解除包裹
   */
  _unwrapFromTag(node: Node, tagName: string): void {
    let current: Node | null = node.parentNode;
    while (current && current !== this.element) {
      if (current.nodeType === Node.ELEMENT_NODE && (current as HTMLElement).tagName === tagName.toUpperCase()) {
        const parent = current.parentNode;
        if (!parent) return;
        while (current.firstChild) {
          parent.insertBefore(current.firstChild, current);
        }
        parent.removeChild(current);
        return;
      }
      current = current.parentNode;
    }
  }

  /**
   * 用样式包裹选中文本
   */
  _wrapWithStyle(styleProp: keyof CSSStyleDeclaration, styleValue: string): boolean {
    const sel = this.getSelection();
    if (!sel || sel.range.collapsed) return false;

    const { range } = sel;
    const textNodes = this._getTextNodesInRange(range);
    
    if (textNodes.length === 0) return false;

    const newNodes: Node[] = [];

    textNodes.forEach(textNode => {
      const { before, selected, after } = this._splitTextNode(textNode as Text, range);
      const parent = textNode.parentNode;

      if (!selected || !parent) return;

      const fragment = this.ctx.document.createDocumentFragment();

      if (before) {
        fragment.appendChild(this.ctx.document.createTextNode(before));
      }

      const wrapper = this.ctx.document.createElement('span');
      (wrapper.style as any)[styleProp] = styleValue;
      wrapper.textContent = selected;
      fragment.appendChild(wrapper);
      newNodes.push(wrapper);

      if (after) {
        fragment.appendChild(this.ctx.document.createTextNode(after));
      }

      parent.replaceChild(fragment, textNode);
    });

    this._selectNodes(newNodes);
    return true;
  }

  /**
   * 重新选中多个节点
   */
  _selectNodes(nodes: Node[]): void {
    if (nodes.length === 0) return;

    const selection = this.ctx.view.getSelection();
    if (!selection) return;
    
    const range = this.ctx.document.createRange();

    const firstNode = nodes[0];
    const lastNode = nodes[nodes.length - 1];

    // 找到实际的文本节点
    const getFirstTextNode = (node: Node): Node => {
      if (node.nodeType === Node.TEXT_NODE) return node;
      return node.firstChild ? getFirstTextNode(node.firstChild) : node;
    };

    const getLastTextNode = (node: Node): Node => {
      if (node.nodeType === Node.TEXT_NODE) return node;
      return node.lastChild ? getLastTextNode(node.lastChild) : node;
    };

    const startNode = getFirstTextNode(firstNode);
    const endNode = getLastTextNode(lastNode);

    range.setStart(startNode, 0);
    range.setEnd(endNode, endNode.textContent?.length || 0);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * 加粗
   */
  bold(): void {
    this._wrapWithTag('strong');
  }

  /**
   * 斜体
   */
  italic(): void {
    this._wrapWithTag('em');
  }

  /**
   * 下划线
   */
  underline(): void {
    this._wrapWithTag('u');
  }

  /**
   * 删除线
   */
  strikethrough(): void {
    this._wrapWithTag('s');
  }

  /**
   * 设置文字颜色
   */
  setForeColor(color: string): void {
    this._wrapWithStyle('color', color);
  }

  /**
   * 设置背景色
   */
  setBackColor(color: string): void {
    this._wrapWithStyle('backgroundColor', color);
  }

  /**
   * 设置字体大小
   */
  setFontSize(size: string): void {
    this._wrapWithStyle('fontSize', size);
  }

  toggle(spec: MarkSpec): boolean {
    console.log('runing:11111');
    switch (spec.type) {
      case 'bold':
        return this._wrapWithTag('strong');
      case 'italic':
        return this._wrapWithTag('em');
      case 'underline':
        return this._wrapWithTag('u');
      case 'strike':
        return this._wrapWithTag('s');
      case 'color':
        return this._wrapWithStyle('color', spec.value!);
      case 'background':
        return this._wrapWithStyle('backgroundColor', spec.value!);
      case 'fontSize':
        return this._wrapWithStyle('fontSize', spec.value!);
    }
    return true
  }

  /**
   * 清除格式
   */
  removeFormat(): void {
    const sel = this.getSelection();
    if (!sel || sel.range.collapsed) return;

    const { range } = sel;
    const textNodes = this._getTextNodesInRange(range);
    
    const newTextNodes: Node[] = [];

    textNodes.forEach(textNode => {
      const { before, selected, after } = this._splitTextNode(textNode as Text, range);
      const parent = textNode.parentNode;

      if (!selected || !parent) return;

      // 创建纯文本节点
      const plainText = this.ctx.document.createTextNode(selected);
      
      // 找到最近的块级父元素
      let blockParent: Node | null = parent;
      while (blockParent && blockParent !== this.element) {
        if (blockParent.nodeType === Node.ELEMENT_NODE) {
          const display = this.ctx.view.getComputedStyle(blockParent as Element).display;
          if (display === 'block' || display === 'list-item') break;
        }
        blockParent = blockParent.parentNode;
      }

      const fragment = this.ctx.document.createDocumentFragment();
      if (before) fragment.appendChild(this.ctx.document.createTextNode(before));
      fragment.appendChild(plainText);
      if (after) fragment.appendChild(this.ctx.document.createTextNode(after));

      parent.replaceChild(fragment, textNode);
      newTextNodes.push(plainText);

      // 清理空的行内元素
      this._cleanEmptyInlineElements((blockParent || this.element) as HTMLElement);
    });

    this._selectNodes(newTextNodes);
  }

  /**
   * 清理空的行内元素
   */
  _cleanEmptyInlineElements(container: HTMLElement): void {
    const inlineTags = ['SPAN', 'STRONG', 'EM', 'U', 'S', 'B', 'I', 'FONT'];
    inlineTags.forEach(tag => {
      const elements = container.querySelectorAll(tag);
      elements.forEach(el => {
        if (!el.textContent?.trim()) {
          el.parentNode?.removeChild(el);
        }
      });
    });
  }

  /**
   * 插入有序列表
   */
  insertOrderedList(): void {
    this._insertList('ol');
  }

  /**
   * 插入无序列表
   */
  insertUnorderedList(): void {
    this._insertList('ul');
  }

  /**
   * 插入列表
   */
  _insertList(listType: 'ol' | 'ul'): void {
    const sel = this.getSelection();
    if (!sel) return;

    const { range } = sel;
    
    // 获取当前块级元素
    let block: Node | null = range.commonAncestorContainer;
    while (block && block !== this.element && block.nodeType !== Node.ELEMENT_NODE) {
      block = block.parentNode;
    }

    // 检查是否已经在列表中
    let existingList: Node | null = block;
    while (existingList && existingList !== this.element) {
      if (existingList.nodeType === Node.ELEMENT_NODE) {
        const element = existingList as HTMLElement;
        if (element.tagName === 'UL' || element.tagName === 'OL') {
          // 移除列表
          const items = element.querySelectorAll('li');
          const fragment = this.ctx.document.createDocumentFragment();
          items.forEach(item => {
            const p = this.ctx.document.createElement('p');
            p.innerHTML = item.innerHTML;
            fragment.appendChild(p);
          });
          existingList.parentNode?.replaceChild(fragment, existingList);
          return;
        }
      }
      existingList = existingList.parentNode;
    }

    // 创建新列表
    const list = this.ctx.document.createElement(listType);
    const li = this.ctx.document.createElement('li');
    
    if (range.collapsed) {
      li.innerHTML = '<br>';
    } else {
      li.appendChild(range.extractContents());
    }
    
    list.appendChild(li);
    range.insertNode(list);

    // 光标移到列表项内
    const newRange = this.ctx.document.createRange();
    newRange.selectNodeContents(li);
    newRange.collapse(false);
    const selection = this.ctx.view.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
   * 对齐方式
   */
  align(alignment: string): void {
    const sel = this.getSelection();
    if (!sel) return;

    let block: Node | null = sel.range.commonAncestorContainer;
    while (block && block !== this.element) {
      if (block.nodeType === Node.ELEMENT_NODE) {
        const element = block as HTMLElement;
        const display = this.ctx.view.getComputedStyle(element).display;
        if (display === 'block' || display === 'list-item') {
          element.style.textAlign = alignment.toLowerCase();
          return;
        }
      }
      block = block.parentNode;
    }

    // 如果没有块级元素，包裹在 div 中
    const div = this.ctx.document.createElement('div');
    div.style.textAlign = alignment.toLowerCase();
    
    const { range } = sel;
    if (!range.collapsed) {
      div.appendChild(range.extractContents());
      range.insertNode(div);
    }
  }

  /**
   * 插入链接
   */
  insertLink(url: string): void {
    const sel = this.getSelection();
    if (!sel || sel.range.collapsed) return;

    const { range } = sel;
    const a = this.ctx.document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.appendChild(range.extractContents());
    range.insertNode(a);

    // 选中链接
    const newRange = this.ctx.document.createRange();
    newRange.selectNodeContents(a);
    const selection = this.ctx.view.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
   * 移除链接
   */
  removeLink(): void {
    const sel = this.getSelection();
    if (!sel) return;

    let node: Node | null = sel.range.commonAncestorContainer;
    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'A') {
        const parent = node.parentNode;
        if (!parent) return;
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
        return;
      }
      node = node.parentNode;
    }
  }

  /**
   * 检查当前选区是否有某个格式
   */
  queryFormat(tagName: string): boolean {
    const sel = this.getSelection();
    if (!sel) return false;

    let node: Node | null = sel.range.commonAncestorContainer;
    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === tagName.toUpperCase()) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  /**
   * 获取编辑器HTML内容
   */
  getHTML(): string {
    return this.element.innerHTML;
  }

  /**
   * 设置编辑器HTML内容
   */
  setHTML(html: string): void {
    this.element.innerHTML = html;
  }

  /**
   * 获取纯文本内容
   */
  getText(): string {
    return this.element.textContent || '';
  }

  /**
   * 清空内容
   */
  clear(): void {
    this.element.innerHTML = '';
  }

  /**
   * 聚焦编辑器
   */
  focus(): void {
    this.element.focus();
  }

  /**
   * 销毁编辑器
   */
  destroy(): void {
    (this.element as any).contentEditable = 'false';
    this._selectionChangeCallbacks = [];
  }
}