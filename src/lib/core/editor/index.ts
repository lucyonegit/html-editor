/**
 * HTML Visual Editor Core Class
 * 核心编辑器类，提供基础的编辑功能
 */
import { EventManager } from '../eventManager'
import StyleManager from '../styleManager';
import { MoveableManager } from '../moveableManager';
import { HistoryManager } from '../historyManager';
import {
  createElementAddCommand,
  createElementDeleteCommand,
  createAttributeChangeCommand,
  createStyleChangeCommand,
  createContentChangeCommand
} from '../historyManager/commands';
import { defaultStyleConfig, generateEditorCSS } from '../../config/styles';
import type { HTMLEditorOptions, Position, EditorStyleConfig } from '../../types';
import { createElement, elementWatcher, getElementType, isImageElement, isInlineElement, isTableElement } from '../utils';
import EditorRegistry from '../editorRegistry';
import { HelperBoxManager } from '../helperBoxManager';
import GlobalEditable from '../globalEditable';



export class HTMLEditor {
  id: string;
  options: HTMLEditorOptions;
  selectedElement: HTMLElement | null;

  eventManager: EventManager | null;
  styleManager: StyleManager | null;
  moveableManager: MoveableManager | null;
  historyManager: HistoryManager | null;
  helperBoxManager: HelperBoxManager | null;
  container: HTMLElement | null;
  EditorRegistry: typeof EditorRegistry;
  elementWatcher: ReturnType<typeof elementWatcher>;
  globalEditable: GlobalEditable | null;

  // 操作状态
  isDragging: boolean = false;
  isResizing: boolean = false;
  isChangingBackground: boolean = false;
  isInsertMode: boolean = false;
  isChangingColor: boolean = false;
  isIframe: boolean;
  isGlobalContentEditable: boolean = false;
  __globalEditHandlers: { handleInput?: (e: Event) => void; handleKeyDown?: (e: KeyboardEvent) => void } | null = null;
  suppressBodyInputRecord: boolean = false;

  constructor(options: HTMLEditorOptions) {
    this.options = {
      container: null,
      theme: 'default',
      autoSave: false,
      styleConfig: defaultStyleConfig,
      enableContentEditable: true, // 默认启用
      enableMoveable: false, // 默认启用拖拽与缩放
      enableHistory: true, // 默认启用历史记录
      historyOptions: {
        maxHistorySize: 100,
        mergeInterval: 1000,
      },
      onElementSelect: null,
      onStyleChange: null,
      onContentChange: null,
      onReady: null,
      onHistoryChange: null,
      ignoreSelectTags: ['body', 'html'],
      enableGlobalContentEditable: false,
      ...options
    };

    // 合并用户自定义样式配置
    if (options.styleConfig) {
      this.options.styleConfig = {
        ...defaultStyleConfig,
        hover: { ...defaultStyleConfig.hover, ...options.styleConfig.hover },
        selected: { ...defaultStyleConfig.selected, ...options.styleConfig.selected },
        badge: { ...defaultStyleConfig.badge, ...options.styleConfig.badge },
      };
    }

    // 合并历史记录配置
    if (options.historyOptions) {
      this.options.historyOptions = {
        ...this.options.historyOptions,
        ...options.historyOptions,
      };
    }

    this.id = this.options.id;
    this.selectedElement = null;

    this.eventManager = null;
    this.styleManager = null;
    this.moveableManager = null;
    this.historyManager = null;
    this.helperBoxManager = null;
    this.container = null;
    this.EditorRegistry = EditorRegistry;
    this.isIframe = false;
    this.isGlobalContentEditable = false as any;
    this.__globalEditHandlers = null as any;
    this.globalEditable = null;
  }

  init(container?: HTMLElement | string): void {
    if (container) {
      this.options.container = container;
    }

    this.setupContainer();
    // 注册到全局编辑器注册表
    this.EditorRegistry.register(this);
    this.initializeManagers();
    this.globalEditable = new GlobalEditable(this);
    this.bindEvents();
    this.elementWatcher = elementWatcher(this);
    if (this.options.helperBox) {
      this.helperBoxManager?.init();
    }
    this.emit('ready');
  }

  setupContainer(): void {
    const container = typeof this.options.container === 'string'
      ? document.querySelector<HTMLElement>(this.options.container)
      : this.options.container;

    if (!container) {
      throw new Error('Container not found');
    }

    this.container = container;
    this.container.classList.add('html-visual-editor');
     // 检测container是否是iframe
    this.detectIframe();

    // 注入编辑器样式
    this.injectStyles();
  }

  // 获取当前的window/document
  getDoc() {
    const container = this.container;
    return {
      view: container ? container.ownerDocument.defaultView : window,
      document: container ? container.ownerDocument : document
    }
  }

  /**
   * 检查container是否是iframe中
   */
  detectIframe(): void {
    // 检查container是否在iframe中
    if (this.container && this.getDoc().document !== document) {
      this.isIframe = true;
    }
  }

  /**
   * 注入编辑器样式到文档中
   */
  injectStyles(): void {
    if (!this.container) return;

    const doc = this.getDoc().document;
    const styleId = 'html-editor-styles';

    // 检查是否已经注入过样式
    const oldStyleElement = doc.getElementById(styleId);
    if (oldStyleElement) {
      doc.head.removeChild(doc.getElementById(styleId) as Node);
    };

    const styleElement = doc.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = generateEditorCSS(this.options.styleConfig as EditorStyleConfig, this.options.enableMoveable, this.options.helperBox);
    doc.head.appendChild(styleElement);
  }

  initializeManagers(): void {
    this.eventManager = new EventManager(this);
    this.styleManager = new StyleManager(this);
    this.moveableManager = new MoveableManager(this, (this.options as any).moveableOptions ?? {});
    this.helperBoxManager = new HelperBoxManager(this);

    // 初始化历史管理器
    if (this.options.enableHistory !== false) {
      this.historyManager = new HistoryManager(this, this.options.historyOptions);
    }
  }

  bindEvents(): void {
    if (this.eventManager) {
      this.eventManager.bindAll();
    }
  }

  // 元素选择
  selectElement(element: HTMLElement): void {
    if (this.isInsertMode) return;
    const lastSelectedElement = this.selectedElement;
    // 清除上一个选择
    this.clearSelection();

    element.classList.add('selected-element');
    element.setAttribute('data-element-type', getElementType(element));
    if (isInlineElement(element)) {
      // 如果元素是内联元素，设置为 inline-block，解决moveable无法拖拽的问题
      element.style.display = 'inline-block';
      element.setAttribute('original-display', 'inline');
    }
    this.selectedElement = element;
    const isTable = isTableElement(element);
    // 启用 moveable
    if (this.options.enableMoveable && this.moveableManager) {
      const defaultMoveableOptions = (this.options as any).moveableOptions ?? {};
      const keepRatio = isImageElement(element) ? true : (defaultMoveableOptions.keepRatio ?? false);
      if (!isTable) {
        element.style.cursor = 'move';
        this.moveableManager.enableFor(element,{ keepRatio });
      }
    }

    // 如果元素不再是 contenteditable，重新启用编辑
    if (this.options.enableContentEditable && element.getAttribute('contenteditable') !== 'true') {
      if (isTable) {
        this.enableElementEditing(element);
      }
      // 如果是同一个元素，检查是否需要重新启用编辑
      if (element === lastSelectedElement) {
        this.enableElementEditing(element);
      }
    }
    
    const position = this.getBoundPostion(element);
    this.emit('elementSelect', element, position);
    this.elementWatcher.start(element, () => {
      this.emit('styleChange', element);
      this.moveableManager.update();
    });
    
    // 如果启用了 helperBox，则更新其位置
    if (this.options.helperBox && this.helperBoxManager) {
      this.helperBoxManager.updatePostion(position);
      this.helperBoxManager.visible(false);
    }
  }

  /**
   * 获取元素的边界相对位置
   */
  getBoundPostion(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const containerRect = this.container!.getBoundingClientRect();
    const position: Position = {
      top: this.isIframe ?  rect.top  : rect.top - containerRect.top,
      left: this.isIframe  ? rect.left : rect.left - containerRect.left,
      width: rect.width,
      height: rect.height,
      bottom: this.isIframe ? rect.bottom : rect.bottom - containerRect.top,
      right: this.isIframe ? rect.right : rect.right - containerRect.left
    };
    return position
  }

  /**
   * 启用元素编辑
   */
  enableElementEditing(element: HTMLElement): void {
    const existingHandlers = (element as any).__editHandlers;
    if (existingHandlers) {
      this.removeEditListeners(element);
    }

    // 保存原始的contenteditable状态
    if (!element.hasAttribute('data-original-contenteditable')) {
      const originalValue = element.getAttribute('contenteditable') || 'inherit';
      element.setAttribute('data-original-contenteditable', originalValue);
    }

    document.execCommand('defaultParagraphSeparator', false, 'br');
    // 设置为可编辑
    element.setAttribute('contenteditable', 'true');

    element.focus();

    const initialContent = element.innerHTML;
    let lastRecordedContent = initialContent;
    const handleInput = () => {
      const newContent = element.innerHTML;
      if (this.historyManager && newContent !== lastRecordedContent) {
        const cmd = createContentChangeCommand(element, lastRecordedContent, newContent);
        this.historyManager.push(cmd);
        lastRecordedContent = newContent;
      }
      this.emit('contentChange');
    };

    const handleBlur = () => {
      // 失去焦点时禁用contenteditable
      this.disableElementEditing(element);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const selection = this.isIframe ? this.getDoc().document.getSelection() : window.getSelection()
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        const br = document.createElement('br');
        range.insertNode(br);
        // 光标移动到 <br> 之后
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        const newContent = element.innerHTML;
        if (this.historyManager && newContent !== lastRecordedContent) {
          const cmd = createContentChangeCommand(element, lastRecordedContent, newContent);
          this.historyManager.push(cmd);
          lastRecordedContent = newContent;
        }
        this.emit('contentChange');
      }
    }

    element.addEventListener('input', handleInput);
    element.addEventListener('blur', handleBlur);
    element.addEventListener('keydown', handleKeyDown);

    // 保存事件处理器引用，便于后续清理
    (element as any).__editHandlers = { handleInput, handleBlur,handleKeyDown};
  }

  private removeEditListeners(element: HTMLElement): void {
    const handlers = (element as any).__editHandlers;
    if (!handlers) return;
    const pairs: Array<[string, EventListener | undefined]> = [
      ['input', handlers.handleInput],
      ['blur', handlers.handleBlur],
      ['keydown', handlers.handleKeyDown],
    ];
    for (const [type, fn] of pairs) {
      if (fn) element.removeEventListener(type, fn as EventListener);
    }
    delete (element as any).__editHandlers;
  }

  /**
   * 禁用元素编辑
   */
  disableElementEditing(element: HTMLElement): void {
    // 恢复原始的contenteditable状态
    const originalValue = element.getAttribute('data-original-contenteditable');
    if (originalValue) {
      if (originalValue === 'inherit') {
        element.removeAttribute('contenteditable');
      } else {
        element.setAttribute('contenteditable', originalValue);
      }
      element.removeAttribute('data-original-contenteditable');
    } else {
      element.removeAttribute('contenteditable');
    }

    this.removeEditListeners(element);
  }

  setInsertMode(value: boolean): void {
    this.isInsertMode = value;
    if (this.container) {
      if (value) {
        this.container.style.cursor = this.isIframe ? 'crosshair' : 'text';
      } else {
        this.container.style.cursor = '';
      }
      if (value) {
        const doc = this.getDoc().document;
        doc.querySelectorAll('.hover-highlight').forEach((el: Element) => {
          (el as HTMLElement).classList.remove('hover-highlight');
          (el as HTMLElement).removeAttribute('data-element-type');
        });
      }
    }
  }

  enableInsertMode(): void {
    this.EditorRegistry.enableInsertMode(this);
  }

  disableInsertMode(): void {
    this.EditorRegistry.disableAllInsertMode();
  }

  insertTextAtPosition(clientX: number, clientY: number): HTMLElement | null {
    if (!this.container) return null;
    const rect = this.container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const element = document.createElement('div');
    element.textContent = '请输入文字';
    element.style.position = 'absolute';
    element.style.left = `${Math.max(0, Math.round(x))}px`;
    element.style.top = `${Math.max(0, Math.round(y))}px`;
    element.style.fontSize = '32px';
    element.style.lineHeight = '1.2';
    element.style.backgroundColor = 'transparent';
    element.style.border = 'none';
    element.style.padding = '0';
    element.style.margin = '0';

    if (this.historyManager) {
      const command = createElementAddCommand(element, (this.selectedElement ?? this.container!) as HTMLElement, this.container!, null);
      command.execute();
      this.historyManager.push(command);
    } else {
      this.container.appendChild(element);
    }

    this.disableInsertMode();
    this.selectElement(element);
    // this.enableElementEditing(element);
    this.emit('contentChange');
    return element;
  }

  clearSelection(): void {
    if (this.selectedElement) {
      this.elementWatcher.stop(this.selectedElement);
      this.selectedElement.classList.remove('selected-element');
      this.selectedElement.removeAttribute('data-element-type');
      if (this.selectedElement.getAttribute('original-display') === 'inline') {
      // 如果元素是内联元素，设置为 inline-block，解决moveable无法拖拽的问题
      this.selectedElement.style.display = 'inline';
      this.selectedElement.removeAttribute('original-display');
    }
      // 禁用编辑功能
      if (this.options.enableContentEditable) {
        this.disableElementEditing(this.selectedElement);
      }
       // 销毁 moveable
      if (this.moveableManager) {
        this.moveableManager.destroy();
        this.selectedElement.style.cursor = '';
      }
      this.selectedElement = null;
      this.emit('elementSelect', null);
    }
    // 清除主文档中的hover样式
    document.querySelectorAll('.hover-highlight').forEach(el => {
      el.classList.remove('hover-highlight');
      el.removeAttribute('data-element-type');
    });
     // 如果在iframe中，也清除iframe文档中的样式
    if (this.container) {
      const ownerDoc = this.getDoc().document
      if (ownerDoc !== document) {
        ownerDoc.querySelectorAll('.hover-highlight').forEach(el => {
          el.classList.remove('hover-highlight');
          el.removeAttribute('data-element-type');
        });
        ownerDoc.querySelectorAll('.selected-element').forEach(el => {
          el.classList.remove('selected-element');
          el.removeAttribute('data-element-type');
        });
      }
    }
    // 如果启用了 helperBox，则隐藏
    if (this.options.helperBox && this.helperBoxManager) {
      this.helperBoxManager.visible(false);
    }
  }

  /**
   * 开启/关闭全局 contenteditable 模式
   */
  setGlobalContentEditableEnabled(enabled: boolean): void {
    this.globalEditable?.setEnabled(enabled);
  }

  // 样式应用
  applyTextStyle(property: string, value: string): boolean {
    if (!this.styleManager) return false;
    return this.styleManager.applyTextStyle(property, value);
  }

  applyBlockStyle(property: string, value: string): boolean {
    if (!this.styleManager) return false;
    return this.styleManager.applyBlockStyle(property, value);
  }

  // 元素操作
  addElement(selectedElement: HTMLElement, type: string, content: string = ''): HTMLElement {
    const element = createElement(type, content);
    if (this.container) {
      // 记录添加操作
      if (this.historyManager) {
        const command = createElementAddCommand(element, selectedElement, this.container, null);
        command.execute();
        this.historyManager.push(command);
      } else {
        this.container.appendChild(element);
      }
    }
    this.selectElement(element);
    this.emit('contentChange');
    return element;
  }

  deleteElement(element: HTMLElement | null = this.selectedElement): boolean {
    if (!element || element === this.container) return false;

    const parent = element.parentElement;
    const nextSibling = element.nextSibling as HTMLElement | null;

    if (!parent) return false;

    // 记录删除操作
    if (this.historyManager) {
      const command = createElementDeleteCommand(element, parent, nextSibling);
      command.execute();
      this.historyManager.push(command);
    } else {
      element.remove();
    }

    this.clearSelection();
    this.emit('contentChange');
    return true;
  }

  // 复制元素并插入到当前元素的同级下方
  copyElement(element: HTMLElement | null = this.selectedElement): HTMLElement | null {
    if (!element || element === this.container) return null;

    const parent = element.parentElement;
    const nextSibling = element.nextSibling as HTMLElement | null;
    if (!parent) return null;

    // 深拷贝节点，包括子元素与样式
    const cloned = element.cloneNode(true) as HTMLElement;

    // 清理编辑器相关状态类与属性
    cloned.classList.remove('selected-element', 'hover-highlight');
    cloned.removeAttribute('data-element-type');

    if (this.historyManager) {
      const command = createElementAddCommand(cloned, element, parent, nextSibling);
      command.execute();
      this.historyManager.push(command);
    } else {
      parent.insertBefore(cloned, nextSibling);
    }

    // 选中新复制的元素
    this.selectElement(cloned);
    this.emit('contentChange');
    return cloned;
  }

  /**
   * 替换图片/背景图为远程 URL
   */
  replaceImage(element: HTMLElement | null = this.selectedElement, url: string): boolean {
    if (!element || !url) return false;

    const tag = element.tagName.toLowerCase();
    if (tag === 'img') {
      const oldSrc = element.getAttribute('src');
      const newSrc = url;
      if (this.historyManager) {
        const cmd = createAttributeChangeCommand(element, 'src', oldSrc, newSrc);
        cmd.execute();
        this.historyManager.push(cmd);
      } else {
        element.setAttribute('src', newSrc);
      }
    } else {
      const oldBg = element.style.backgroundImage || '';
      const newBg = `url(${url})`;
      if (this.historyManager) {
        const cmd = createStyleChangeCommand(element, 'background-image', oldBg, newBg);
        cmd.execute();
        this.historyManager.push(cmd);
      } else {
        element.style.backgroundImage = newBg;
      }
    }

    this.emit('contentChange');
    return true;
  }

  // 事件系统
  emit(eventName: string, ...args: any[]): void {
    const callbackName = `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}` as keyof HTMLEditorOptions;
    const callback = this.options[callbackName];
    if (typeof callback === 'function') {
      (callback as Function).apply(this, args);
    }

    // 触发自定义事件
    const event = new CustomEvent(`htmleditor:${eventName}`, {
      detail: { editor: this, args }
    });
    if (this.container) {
      this.container.dispatchEvent(event);
    }
  }

  // 公共API
  getContent(): string {
    return this.container ? this.container.innerHTML : '';
  }

  setContent(html: string): void {
    if (this.container) {
      this.container.innerHTML = html;
      this.emit('contentChange');
    }
  }

  getSelectedElement(): HTMLElement | null {
    return this.selectedElement;
  }

  // 操作状态管理
  setDragging(value: boolean): void {
    this.isDragging = value;
  }

  setResizing(value: boolean): void {
    this.isResizing = value;
  }

  setChangingBackground(value: boolean): void {
    this.isChangingBackground = value;
  }

  setChangingColor(value: boolean): void {
    this.isChangingColor = value;
  }
  /**
   * 检查是否有任何操作正在进行
   */
  isOperating(): boolean {
    return (
      this.isDragging ||
      this.isResizing ||
      this.isChangingBackground ||
      this.isChangingColor
    );
  }

  /**
   * 重置所有操作状态
   */
  resetOperationStates(): void {
    this.isDragging = false;
    this.isResizing = false;
    this.isChangingBackground = false;
    this.isChangingColor = false;
  }

  // ============================================
  // 历史记录相关 API
  // ============================================

  /**
   * 撤销上一个操作
   */
  undo(): boolean {
    return this.historyManager?.undo() ?? false;
  }

  /**
   * 重做已撤销的操作
   */
  redo(): boolean {
    return this.historyManager?.redo() ?? false;
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.historyManager?.canUndo() ?? false;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.historyManager?.canRedo() ?? false;
  }

  /**
   * 开始批量操作
   */
  beginBatch(): void {
    this.historyManager?.beginBatch();
  }

  /**
   * 结束批量操作
   */
  endBatch(): void {
    this.historyManager?.endBatch();
  }

  /**
   * 取消批量操作
   */
  cancelBatch(): void {
    this.historyManager?.cancelBatch();
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    this.historyManager?.clear();
  }

  /**
   * 获取历史状态
   */
  getHistoryState() {
    return this.historyManager?.getState();
  }

  destroy(): void {
    if (this.eventManager) {
      this.eventManager.unbindAll();
    }
    if (this.moveableManager) {
      this.moveableManager.destroy();
    }
    if (this.historyManager) {
      this.historyManager.destroy();
    }
    if (this.container) {
      this.container.classList.remove('html-visual-editor');
    }
    this.container = null;
    // 从注册表中移除
    this.EditorRegistry.unregister(this);
  }
}