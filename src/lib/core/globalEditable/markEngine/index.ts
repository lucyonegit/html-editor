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
   * 新逻辑：只有当选区内所有文本都有该格式时才移除，否则全部添加格式
   */
  _wrapWithTag(tagName: string, styles: Partial<CSSStyleDeclaration> = {}): boolean {
    const sel = this.getSelection();
    if (!sel || sel.range.collapsed) return false;

    const { range } = sel;
    const textNodes = this._getTextNodesInRange(range);

    if (textNodes.length === 0) return false;

    // 首先检查是否所有文本节点都有该格式
    const formatCheckResults = textNodes.map(textNode => {
      const { selected } = this._splitTextNode(textNode as Text, range);
      if (!selected) return { hasFormat: true, textNode, formatElement: null }; // 空节点视为已有格式
      const formatCheck = this._hasFormat(textNode, tagName, null, null);
      return {
        hasFormat: formatCheck.has,
        textNode,
        formatElement: formatCheck.element as HTMLElement | null
      };
    });

    // 只有当所有节点都有格式时才移除格式，否则全部添加格式
    const allHaveFormat = formatCheckResults.every(r => r.hasFormat);
    const shouldRemove = allHaveFormat;

    const newNodes: Node[] = [];

    textNodes.forEach(textNode => {
      const { before, selected, after } = this._splitTextNode(textNode as Text, range);
      const parent = textNode.parentNode;

      if (!selected || !parent) return;

      const formatCheck = this._hasFormat(textNode, tagName, null, null);
      const isInFormatTag = formatCheck.has;
      const formatElement = formatCheck.element as HTMLElement | null;

      if (shouldRemove && isInFormatTag && formatElement) {
        // 移除格式模式：只有在节点确实有格式时才移除
        this._splitFormattedElement(formatElement, textNode as Text, before, selected, after, newNodes);
      } else if (!shouldRemove && !isInFormatTag) {
        // 添加格式模式：只有在节点没有格式时才添加
        const fragment = this.ctx.document.createDocumentFragment();

        if (before) {
          fragment.appendChild(this.ctx.document.createTextNode(before));
        }

        const wrapper = this.ctx.document.createElement(tagName);
        Object.assign(wrapper.style, styles);
        wrapper.textContent = selected;
        fragment.appendChild(wrapper);
        newNodes.push(wrapper);

        if (after) {
          fragment.appendChild(this.ctx.document.createTextNode(after));
        }

        parent.replaceChild(fragment, textNode);
      } else if (!shouldRemove && isInFormatTag && formatElement) {
        // 添加格式模式，但节点已有格式：保持原样，只处理选区边界
        const { before: b, selected: s, after: a } = this._splitTextNode(textNode as Text, range);
        if (b || a) {
          // 需要处理选区边界：保持格式标签但分割文本
          this._keepFormatButSplitBoundary(formatElement, textNode as Text, b, s, a, newNodes);
        } else {
          // 整个节点都被选中且已有格式，保持原样
          newNodes.push(formatElement);
        }
      }
    });

    // 重新选中处理后的内容
    this._selectNodes(newNodes);
    return true;
  }

  /**
   * 保持格式标签但在选区边界分割文本（不移除格式）
   */
  _keepFormatButSplitBoundary(
    formatElement: HTMLElement,
    textNode: Text,
    before: string,
    selected: string,
    after: string,
    newNodes: Node[]
  ): void {
    const parent = formatElement.parentNode;
    if (!parent) return;

    const fragment = this.ctx.document.createDocumentFragment();

    // 收集格式元素中的所有内容
    const allContent: Node[] = Array.from(formatElement.childNodes);
    const textNodeIndex = allContent.indexOf(textNode);

    if (textNodeIndex === -1) return;

    // 创建before部分（保持格式，但不包含在选区内）
    if (before) {
      const beforeNodes: Node[] = [];
      for (let i = 0; i < textNodeIndex; i++) {
        beforeNodes.push(allContent[i].cloneNode(true));
      }
      beforeNodes.push(this.ctx.document.createTextNode(before));

      if (beforeNodes.length > 0) {
        const beforeElement = formatElement.cloneNode(false) as HTMLElement;
        beforeNodes.forEach(node => beforeElement.appendChild(node));
        fragment.appendChild(beforeElement);
      }
    } else {
      // 没有before文本，但可能有之前的节点
      for (let i = 0; i < textNodeIndex; i++) {
        const nodeClone = allContent[i].cloneNode(true);
        const wrapper = formatElement.cloneNode(false) as HTMLElement;
        wrapper.appendChild(nodeClone);
        fragment.appendChild(wrapper);
      }
    }

    // 创建selected部分（保持格式，包含在选区内）
    const selectedElement = formatElement.cloneNode(false) as HTMLElement;
    selectedElement.textContent = selected;
    fragment.appendChild(selectedElement);
    newNodes.push(selectedElement);

    // 创建after部分（保持格式，但不包含在选区内）
    if (after) {
      const afterNodes: Node[] = [this.ctx.document.createTextNode(after)];
      for (let i = textNodeIndex + 1; i < allContent.length; i++) {
        afterNodes.push(allContent[i].cloneNode(true));
      }

      if (afterNodes.length > 0) {
        const afterElement = formatElement.cloneNode(false) as HTMLElement;
        afterNodes.forEach(node => afterElement.appendChild(node));
        fragment.appendChild(afterElement);
      }
    } else {
      // 没有after文本，但可能有之后的节点
      for (let i = textNodeIndex + 1; i < allContent.length; i++) {
        const nodeClone = allContent[i].cloneNode(true);
        const wrapper = formatElement.cloneNode(false) as HTMLElement;
        wrapper.appendChild(nodeClone);
        fragment.appendChild(wrapper);
      }
    }

    // 替换原格式元素
    parent.replaceChild(fragment, formatElement);
  }

  /**
   * 在元素的直接子节点中查找包含目标节点的子节点
   */
  _findDirectChildContaining(parent: HTMLElement, target: Node): Node | null {
    for (const child of Array.from(parent.childNodes)) {
      if (child === target) return child;
      if (child.contains(target)) return child;
    }
    return null;
  }

  /**
   * 递归克隆节点，但对包含目标文本节点的分支进行分割处理
   * 返回三个部分：before、selected、after
   */
  _cloneAndSplitNode(
    node: Node,
    textNode: Text,
    before: string,
    selected: string,
    after: string
  ): { beforePart: Node | null; selectedPart: Node | null; afterPart: Node | null } {
    // 如果当前节点就是目标文本节点
    if (node === textNode) {
      return {
        beforePart: before ? this.ctx.document.createTextNode(before) : null,
        selectedPart: this.ctx.document.createTextNode(selected),
        afterPart: after ? this.ctx.document.createTextNode(after) : null
      };
    }

    // 如果是文本节点但不是目标，完整保留
    if (node.nodeType === Node.TEXT_NODE) {
      return {
        beforePart: node.cloneNode(true),
        selectedPart: null,
        afterPart: null
      };
    }

    // 如果不包含目标节点，完整保留
    if (!node.contains(textNode)) {
      return {
        beforePart: node.cloneNode(true),
        selectedPart: null,
        afterPart: null
      };
    }

    // 元素节点且包含目标节点：需要递归处理
    const element = node as HTMLElement;
    const beforeChildren: Node[] = [];
    const selectedChildren: Node[] = [];
    const afterChildren: Node[] = [];
    let foundTarget = false;
    let passedTarget = false;

    for (const child of Array.from(element.childNodes)) {
      if (child === textNode || child.contains(textNode)) {
        foundTarget = true;
        const result = this._cloneAndSplitNode(child, textNode, before, selected, after);
        if (result.beforePart) beforeChildren.push(result.beforePart);
        if (result.selectedPart) selectedChildren.push(result.selectedPart);
        if (result.afterPart) afterChildren.push(result.afterPart);
        passedTarget = true;
      } else if (!foundTarget) {
        // 目标之前的节点归入 before
        beforeChildren.push(child.cloneNode(true));
      } else if (passedTarget) {
        // 目标之后的节点归入 after
        afterChildren.push(child.cloneNode(true));
      }
    }

    // 构建三个部分的元素
    const createElementWithChildren = (children: Node[]): HTMLElement | null => {
      if (children.length === 0) return null;
      const el = element.cloneNode(false) as HTMLElement;
      children.forEach(c => el.appendChild(c));
      return el;
    };

    return {
      beforePart: createElementWithChildren(beforeChildren),
      selectedPart: createElementWithChildren(selectedChildren),
      afterPart: createElementWithChildren(afterChildren)
    };
  }

  /**
   * 拆分格式化元素，移除选中部分的格式
   * 支持复杂嵌套格式和多子节点的情况
   */
  _splitFormattedElement(
    formatElement: HTMLElement,
    textNode: Text,
    before: string,
    selected: string,
    after: string,
    newNodes: Node[]
  ): void {
    const parent = formatElement.parentNode;
    if (!parent) return;

    const finalFragment = this.ctx.document.createDocumentFragment();
    const allContent: Node[] = Array.from(formatElement.childNodes);

    // 找到包含 textNode 的直接子节点的索引
    let targetChildIndex = -1;
    let targetChild: Node | null = null;

    for (let i = 0; i < allContent.length; i++) {
      const child = allContent[i];
      if (child === textNode || child.contains(textNode)) {
        targetChildIndex = i;
        targetChild = child;
        break;
      }
    }

    if (targetChildIndex === -1 || !targetChild) return;

    // 收集目标子节点之前的所有节点（保持外层格式）
    const beforeNodes: Node[] = [];
    for (let i = 0; i < targetChildIndex; i++) {
      beforeNodes.push(allContent[i].cloneNode(true));
    }

    // 处理目标子节点
    let selectedContent: Node;

    if (targetChild === textNode) {
      // 目标就是文本节点本身
      if (before) {
        beforeNodes.push(this.ctx.document.createTextNode(before));
      }
      selectedContent = this.ctx.document.createTextNode(selected);
    } else if (targetChild.nodeType === Node.ELEMENT_NODE) {
      // 目标在某个元素节点内部，需要递归处理
      const result = this._cloneAndSplitNode(targetChild, textNode, before, selected, after);

      if (result.beforePart) {
        beforeNodes.push(result.beforePart);
      }

      // 这里的 selectedPart 保留了内部格式，但需要移除外层格式
      selectedContent = result.selectedPart || this.ctx.document.createTextNode(selected);

      // after 部分单独处理
      if (result.afterPart) {
        // 将在后面添加到 afterNodes
      }
    } else {
      // 其他情况，安全退出
      return;
    }

    // 收集目标子节点之后的所有节点（保持外层格式）
    const afterNodes: Node[] = [];

    // 处理来自递归分割的 after 部分
    if (targetChild !== textNode && targetChild.nodeType === Node.ELEMENT_NODE) {
      const result = this._cloneAndSplitNode(targetChild, textNode, before, selected, after);
      if (result.afterPart) {
        afterNodes.push(result.afterPart);
      }
    } else if (after) {
      afterNodes.push(this.ctx.document.createTextNode(after));
    }

    for (let i = targetChildIndex + 1; i < allContent.length; i++) {
      afterNodes.push(allContent[i].cloneNode(true));
    }

    // 构建最终的 DOM 结构
    // 1. before 部分（保持外层格式）
    if (beforeNodes.length > 0) {
      const beforeElement = formatElement.cloneNode(false) as HTMLElement;
      beforeNodes.forEach(node => beforeElement.appendChild(node));
      finalFragment.appendChild(beforeElement);
    }

    // 2. selected 部分（移除外层格式）
    finalFragment.appendChild(selectedContent);
    newNodes.push(selectedContent);

    // 3. after 部分（保持外层格式）
    if (afterNodes.length > 0) {
      const afterElement = formatElement.cloneNode(false) as HTMLElement;
      afterNodes.forEach(node => afterElement.appendChild(node));
      finalFragment.appendChild(afterElement);
    }

    // 替换原格式元素
    parent.replaceChild(finalFragment, formatElement);
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
   * 对齐方式类型
   */
  static readonly ALIGN_LEFT = 'left';
  static readonly ALIGN_CENTER = 'center';
  static readonly ALIGN_RIGHT = 'right';

  /**
   * 查找选区最近的可对齐父元素
   */
  _findNearestAlignableElement(node: Node): HTMLElement | null {
    let current: Node | null = node;

    while (current && current !== this.element) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = current as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        // 匹配常见的段落级元素和行内元素
        if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'td', 'th',
          'span', 'a', 'strong', 'em', 'u', 's', 'b', 'i'].includes(tagName)) {
          return element;
        }
      }
      current = current.parentNode;
    }

    return null;
  }

  /**
   * 设置文本对齐方式
   * 策略：
   * 1. 找到选区最近的父元素，直接设置其 textAlign 样式
   * 2. 如果选区全是文本节点，用 span 包裹整个文本节点并设置对齐
   * @param alignment - 'left' | 'center' | 'right'
   */
  align(alignment: 'left' | 'center' | 'right'): void {
    const sel = this.getSelection();
    if (!sel) return;

    const { range } = sel;

    // 找到选区最近的可对齐元素
    const targetElement = this._findNearestAlignableElement(range.commonAncestorContainer);

    if (targetElement) {
      const display = this.ctx.view.getComputedStyle(targetElement).display;

      // 如果是行内元素，需要先转换为块级才能应用 text-align
      if (display === 'inline' || display === 'inline-block') {
        targetElement.style.display = 'block';
      }

      // 直接设置对齐方式，不做任何 DOM 操作
      targetElement.style.textAlign = alignment;
      this._saveHistory();
      return;
    }

    // 没有找到合适的元素，检查是否是纯文本节点
    // 如果 commonAncestorContainer 是文本节点，用 span 包裹整个文本节点
    const ancestor = range.commonAncestorContainer;

    if (ancestor.nodeType === Node.TEXT_NODE) {
      // 获取整个文本节点
      const textNode = ancestor as Text;
      const parent = textNode.parentNode;

      if (parent) {
        // 创建 span 包裹整个文本节点
        const wrapper = this.ctx.document.createElement('span');
        wrapper.style.display = 'block';
        wrapper.style.textAlign = alignment;

        // 用 wrapper 替换文本节点
        parent.insertBefore(wrapper, textNode);
        wrapper.appendChild(textNode);

        this._saveHistory();
      }
    }
  }

  /**
   * 左对齐
   */
  alignLeft(): void {
    this.align('left');
  }

  /**
   * 居中对齐
   */
  alignCenter(): void {
    this.align('center');
  }

  /**
   * 右对齐
   */
  alignRight(): void {
    this.align('right');
  }

  /**
   * 查询当前段落的对齐方式
   * @returns 'left' | 'center' | 'right' | null
   */
  queryAlign(): 'left' | 'center' | 'right' | null {
    const sel = this.getSelection();
    if (!sel) return null;

    let block: Node | null = sel.range.commonAncestorContainer;
    while (block && block !== this.element) {
      if (block.nodeType === Node.ELEMENT_NODE) {
        const element = block as HTMLElement;
        const display = this.ctx.view.getComputedStyle(element).display;
        if (display === 'block' || display === 'list-item') {
          const textAlign = element.style.textAlign ||
            this.ctx.view.getComputedStyle(element).textAlign;
          if (textAlign === 'center') return 'center';
          if (textAlign === 'right') return 'right';
          return 'left'; // 默认左对齐
        }
      }
      block = block.parentNode;
    }
    return 'left';
  }

  /**
   * 标题类型
   */
  static readonly HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'] as const;

  /**
   * 设置标题级别
   * @param level - 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' (普通段落)
   */
  setHeading(level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'): void {
    const sel = this.getSelection();
    if (!sel) return;

    const { range } = sel;

    // 查找当前所在的块级元素
    let currentBlock: HTMLElement | null = null;
    let node: Node | null = range.commonAncestorContainer;

    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        // 查找可以转换的块级元素
        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'].includes(tagName)) {
          currentBlock = element;
          break;
        }
      }
      node = node.parentNode;
    }

    if (currentBlock) {
      // 已有块级元素，替换为新的标题/段落
      const newElement = this.ctx.document.createElement(level);

      // 复制内容和样式
      newElement.innerHTML = currentBlock.innerHTML;
      if (currentBlock.style.textAlign) {
        newElement.style.textAlign = currentBlock.style.textAlign;
      }

      // 替换元素
      currentBlock.parentNode?.replaceChild(newElement, currentBlock);

      // 重新选中
      const newRange = this.ctx.document.createRange();
      newRange.selectNodeContents(newElement);
      const selection = this.ctx.view.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } else {
      // 没有找到块级元素
      // 检查光标是否在 <br> 附近
      let brElement: HTMLElement | null = null;
      let checkNode: Node | null = range.commonAncestorContainer;

      // 检查当前节点或其子节点是否是 <br>
      if (checkNode.nodeType === Node.ELEMENT_NODE) {
        const el = checkNode as HTMLElement;
        if (el.tagName.toLowerCase() === 'br') {
          brElement = el;
        }
      }

      // 检查相邻节点
      if (!brElement && range.startContainer.nodeType === Node.ELEMENT_NODE) {
        const container = range.startContainer as HTMLElement;
        const childAtOffset = container.childNodes[range.startOffset];
        if (childAtOffset && childAtOffset.nodeType === Node.ELEMENT_NODE) {
          const el = childAtOffset as HTMLElement;
          if (el.tagName.toLowerCase() === 'br') {
            brElement = el;
          }
        }
        // 也检查前一个节点
        const prevChild = container.childNodes[range.startOffset - 1];
        if (!brElement && prevChild && prevChild.nodeType === Node.ELEMENT_NODE) {
          const el = prevChild as HTMLElement;
          if (el.tagName.toLowerCase() === 'br') {
            brElement = el;
          }
        }
      }

      if (brElement) {
        // 找到 <br>，用 heading 替换它
        const newElement = this.ctx.document.createElement(level);
        newElement.innerHTML = '<br>';
        brElement.parentNode?.replaceChild(newElement, brElement);

        // 将光标移到新元素内
        const newRange = this.ctx.document.createRange();
        newRange.setStart(newElement, 0);
        newRange.collapse(true);
        const selection = this.ctx.view.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else if (range.collapsed) {
        // 光标位置但没有找到 br：创建空标题
        const newElement = this.ctx.document.createElement(level);
        newElement.innerHTML = '<br>';
        range.insertNode(newElement);

        const newRange = this.ctx.document.createRange();
        newRange.setStart(newElement, 0);
        newRange.collapse(true);
        const selection = this.ctx.view.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        // 有选中内容：包裹为标题
        const contents = range.extractContents();
        const newElement = this.ctx.document.createElement(level);
        newElement.appendChild(contents);
        range.insertNode(newElement);

        const newRange = this.ctx.document.createRange();
        newRange.selectNodeContents(newElement);
        const selection = this.ctx.view.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }

    this._saveHistory();
  }

  /**
   * 查询当前标题级别
   * @returns 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | null
   */
  queryHeading(): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | null {
    const sel = this.getSelection();
    if (!sel) return null;

    let node: Node | null = sel.range.commonAncestorContainer;
    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = (node as HTMLElement).tagName.toLowerCase();
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          return tagName as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        }
        if (tagName === 'p') {
          return 'p';
        }
      }
      node = node.parentNode;
    }
    return 'p'; // 默认为普通段落
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