/**
 * HTML Visual Editor Core Class
 * 核心编辑器类，提供基础的编辑功能
 */
import { EventManager } from '../eventManager'
import StyleManager from '../styleManager';
import { MoveableManager } from '../moveableManager';
import { defaultStyleConfig, generateEditorCSS } from '../../config/styles';
import type { HTMLEditorOptions, Position, EditorStyleConfig } from '../../types';
import { createElement, getElementType } from '../utils';


export class HTMLEditor {
  options: HTMLEditorOptions;
  selectedElement: HTMLElement | null;

  eventManager: EventManager | null;
  styleManager: StyleManager | null;
  moveableManager: MoveableManager | null;
  container: HTMLElement | null;

  // 操作状态
  isDragging: boolean = false;
  isResizing: boolean = false;
  isChangingBackground: boolean = false;
  isChangingColor: boolean = false;

  constructor(options: HTMLEditorOptions = {}) {
    this.options = {
      container: null,
      theme: 'default',
      autoSave: false,
      styleConfig: defaultStyleConfig,
      enableContentEditable: true, // 默认启用
      enableMoveable: false, // 默认启用拖拽与缩放
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

    this.eventManager = null;
    this.styleManager = null;
    this.moveableManager = null;
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
    styleElement.textContent = generateEditorCSS(this.options.styleConfig as EditorStyleConfig, this.options.enableMoveable);
    doc.head.appendChild(styleElement);
  }

  initializeManagers(): void {
    this.eventManager = new EventManager(this);
    this.styleManager = new StyleManager(this);
    this.moveableManager = new MoveableManager(this, (this.options as any).moveableOptions ?? {});
  }

  bindEvents(): void {
    if (this.eventManager) {
      this.eventManager.bindAll();
    }
  }

  // 元素选择
  selectElement(element: HTMLElement): void {
    this.clearSelection();
    // 启用 moveable
    if (this.options.enableMoveable && this.moveableManager) {
      this.moveableManager.enableFor(element);
    }
    // 如果是同一个元素，检查是否需要重新启用编辑
    // if (element === this.selectedElement) {
    //   // 如果元素不再是 contenteditable，重新启用编辑
    //   if (this.options.enableContentEditable && element.getAttribute('contenteditable') !== 'true') {
    //     this.enableElementEditing(element);
    //   }
    //   return;
    // }
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
    this.selectedElement = element;
    element.classList.add('selected-element');
    element.setAttribute('data-element-type', getElementType(element));
  }

  /**
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

      // 销毁 moveable
      if (this.moveableManager) {
        this.moveableManager.destroy();
      }

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
    const element = createElement(type, content);
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

  // 工具函数已抽离到 ./core/utils

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

  destroy(): void {
    if (this.eventManager) {
      this.eventManager.unbindAll();
    }
    if (this.moveableManager) {
      this.moveableManager.destroy();
    }
    if (this.container) {
      this.container.classList.remove('html-visual-editor');
    }
    this.container = null;
  }
}