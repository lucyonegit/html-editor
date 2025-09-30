/**
 * HTML Visual Editor Core Class
 * 核心编辑器类，提供基础的编辑功能
 */
import EventManager from './core/eventManager';
import StyleManager from './core/styleManager';
import { EditorStyleConfig, defaultStyleConfig, generateEditorCSS } from './config/styles';

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

interface HTMLEditorOptions {
  container?: HTMLElement | string | null;
  theme?: string;
  autoSave?: boolean;
  styleConfig?: EditorStyleConfig;
  enableContentEditable?: boolean; // 是否启用contenteditable编辑
  onElementSelect?: ((element: HTMLElement | null, position?: Position) => void) | null;
  onStyleChange?: ((element: HTMLElement, styles: Record<string, string>) => void) | null;
  onContentChange?: (() => void) | null;
  onReady?: (() => void) | null;
}

interface TypeMap {
  [key: string]: string;
}

class HTMLEditor {
  options: HTMLEditorOptions;
  selectedElement: HTMLElement | null;
  isTextSelected: boolean;
  eventManager: EventManager | null;
  styleManager: StyleManager | null;
  container: HTMLElement | null;

  constructor(options: HTMLEditorOptions = {}) {
    this.options = {
      container: null,
      theme: 'default',
      autoSave: false,
      styleConfig: defaultStyleConfig,
      enableContentEditable: true, // 默认启用
      onElementSelect: null,
      onStyleChange: null,
      onContentChange: null,
      onReady: null,
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

    this.selectedElement = null;
    this.isTextSelected = false;
    this.eventManager = null;
    this.styleManager = null;
    this.container = null;
  }

  init(container?: HTMLElement | string): void {
    if (container) {
      this.options.container = container;
    }

    this.validateOptions();
    this.setupContainer();
    this.initializeManagers();
    this.bindEvents();
    this.emit('ready');
  }

  validateOptions(): void {
    if (!this.options.container) {
      throw new Error('Container is required');
    }
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

    // 注入编辑器样式
    this.injectStyles();
  }

  /**
   * Inject editor styles into the document
   * 注入编辑器样式到文档中
   */
  injectStyles(): void {
    if (!this.container) return;

    const doc = this.container.ownerDocument;
    const styleId = 'html-editor-styles';

    // 检查是否已经注入过样式
    if (doc.getElementById(styleId)) return;

    const styleElement = doc.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = generateEditorCSS(this.options.styleConfig);
    doc.head.appendChild(styleElement);
  }

  initializeManagers(): void {
    this.eventManager = new EventManager(this);
    this.styleManager = new StyleManager(this);
  }

  bindEvents(): void {
    if (this.eventManager) {
      this.eventManager.bindAll();
    }
  }

  // 元素选择
  selectElement(element: HTMLElement): void {
    // 如果是同一个元素，检查是否需要重新启用编辑
    if (element === this.selectedElement) {
      // 如果元素不再是 contenteditable，重新启用编辑
      if (this.options.enableContentEditable && element.getAttribute('contenteditable') !== 'true') {
        this.enableElementEditing(element);
      }
      return;
    }

    this.clearSelection();
    this.selectedElement = element;
    element.classList.add('selected-element');
    element.setAttribute('data-element-type', this.getElementType(element));

    // 如果启用contenteditable，使元素可编辑
    if (this.options.enableContentEditable) {
      this.enableElementEditing(element);
    }

    // 获取元素位置信息
    const rect = element.getBoundingClientRect();
    const position: Position = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom + window.scrollY,
      right: rect.right + window.scrollX
    };

    this.emit('elementSelect', element, position);
  }

  /**
   * Enable element editing
   * 启用元素编辑
   */
  enableElementEditing(element: HTMLElement): void {
    // 如果已经有事件处理器，先移除避免重复绑定
    const existingHandlers = (element as any).__editHandlers;
    if (existingHandlers) {
      element.removeEventListener('input', existingHandlers.handleInput);
      element.removeEventListener('blur', existingHandlers.handleBlur);
    }

    // 保存原始的contenteditable状态
    if (!element.hasAttribute('data-original-contenteditable')) {
      const originalValue = element.getAttribute('contenteditable') || 'inherit';
      element.setAttribute('data-original-contenteditable', originalValue);
    }

    // 设置为可编辑
    element.setAttribute('contenteditable', 'true');

    element.focus();

    // 监听内容变化
    const handleInput = () => {
      this.emit('contentChange');
    };

    const handleBlur = () => {
      // 失去焦点时禁用contenteditable
      this.disableElementEditing(element);
    };

    element.addEventListener('input', handleInput);
    element.addEventListener('blur', handleBlur);

    // 保存事件处理器引用，便于后续清理
    (element as any).__editHandlers = { handleInput, handleBlur };
  }

  /**
   * Disable element editing
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

    // 移除事件监听器
    const handlers = (element as any).__editHandlers;
    if (handlers) {
      element.removeEventListener('input', handlers.handleInput);
      element.removeEventListener('blur', handlers.handleBlur);
      delete (element as any).__editHandlers;
    }
  }

  clearSelection(): void {
    if (this.selectedElement) {
      this.selectedElement.classList.remove('selected-element');
      this.selectedElement.removeAttribute('data-element-type');

      // 禁用编辑功能
      if (this.options.enableContentEditable) {
        this.disableElementEditing(this.selectedElement);
      }
    }

    // 清除主文档中的hover样式
    document.querySelectorAll('.hover-highlight').forEach(el => {
      el.classList.remove('hover-highlight');
      el.removeAttribute('data-element-type');
    });

    // 如果在iframe中，也清除iframe文档中的样式
    if (this.container) {
      const ownerDoc = this.container.ownerDocument;
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

    this.selectedElement = null;
    this.emit('elementSelect', null);
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
  addElement(type: string, content: string = ''): HTMLElement {
    const element = this.createElement(type, content);
    if (this.container) {
      this.container.appendChild(element);
    }
    this.selectElement(element);
    this.emit('contentChange');
    return element;
  }

  deleteElement(element: HTMLElement | null = this.selectedElement): boolean {
    if (!element || element === this.container) return false;

    element.remove();
    this.clearSelection();
    this.emit('contentChange');
    return true;
  }

  createElement(type: string, content: string = ''): HTMLElement {
    const element = document.createElement(type);

    if (content) {
      element.textContent = content;
    } else {
      element.textContent = type === 'div' ? '新区块' : '新文本';
    }

    // 添加基础样式
    element.style.padding = '10px';
    element.style.margin = '5px';
    element.style.backgroundColor = '#f8f9fa';
    element.style.border = '1px dashed #dee2e6';
    element.style.borderRadius = '4px';

    return element;
  }

  // 工具函数
  getElementType(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const typeMap: TypeMap = {
      'h1': '标题1', 'h2': '标题2', 'h3': '标题3',
      'h4': '标题4', 'h5': '标题5', 'h6': '标题6',
      'p': '段落', 'div': '区块', 'span': '文本',
      'a': '链接', 'img': '图片',
      'ul': '无序列表', 'ol': '有序列表', 'li': '列表项'
    };
    return typeMap[tagName] || tagName.toUpperCase();
  }

  isTextElement(element: HTMLElement): boolean {
    const textTags = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'strong', 'em'];
    return textTags.includes(element.tagName.toLowerCase());
  }

  isBlockElement(element: HTMLElement): boolean {
    const blockTags = ['div', 'section', 'article', 'header', 'footer', 'main','body'];
    return blockTags.includes(element.tagName.toLowerCase());
  }

  isImageElement(element: HTMLElement): boolean {
    return element.tagName.toLowerCase() === 'img';
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

  destroy(): void {
    if (this.eventManager) {
      this.eventManager.unbindAll();
    }
    if (this.container) {
      this.container.classList.remove('html-visual-editor');
    }
    this.container = null;
  }
}

export default HTMLEditor;
export type { HTMLEditorOptions, Position };
export type { EditorStyleConfig } from './config/styles';
export { defaultStyleConfig, generateEditorCSS } from './config/styles';