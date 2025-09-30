/**
 * Event Manager
 * 事件管理器，处理所有DOM事件
 */

import type HTMLEditor from '../../index';

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

type EventHandler = (e: Event) => void;

export class EventManager {
  private editor: HTMLEditor;
  private boundHandlers: Map<string, EventHandler>;
  private isIframe: boolean;
  private iframeDoc: Document | null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.boundHandlers = new Map<string, EventHandler>();
    this.isIframe = false;
    this.iframeDoc = null;
  }

  bindAll(): void {
    // 检测container是否是iframe
    this.detectIframe();

    this.bindHoverEvents();
    this.bindClickEvents();
    this.bindDocumentEvents();
  }

  detectIframe(): void {
    // 检查container是否在iframe中
    if (this.editor.container && this.editor.container.ownerDocument !== document) {
      this.isIframe = true;
      this.iframeDoc = this.editor.container.ownerDocument;
    }
  }

  bindHoverEvents(): void {
    const handleMouseOver = (e: Event) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;

      if (target.classList.contains('selected-element')) return;

      // 先清除容器内所有非选中元素的hover样式
      if (this.editor.container) {
        const doc = this.editor.container.ownerDocument;
        doc.querySelectorAll('.hover-highlight').forEach(el => {
          if (!el.classList.contains('selected-element')) {
            el.classList.remove('hover-highlight');
            el.removeAttribute('data-element-type');
          }
        });
      }

      target.classList.add('hover-highlight');
      target.setAttribute('data-element-type', this.editor.getElementType(target));

      // 触发hover事件，包含位置信息
      const rect = target.getBoundingClientRect();
      const position: Position = {
        top: rect.top + (this.isIframe ? 0 : window.scrollY),
        left: rect.left + (this.isIframe ? 0 : window.scrollX),
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom + (this.isIframe ? 0 : window.scrollY),
        right: rect.right + (this.isIframe ? 0 : window.scrollX)
      };

      this.editor.emit('hover', target, position);
    };

    const handleMouseOut = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('selected-element')) {
        target.classList.remove('hover-highlight');
        target.removeAttribute('data-element-type');
      }
    };

    if (this.editor.container) {
      this.editor.container.addEventListener('mouseover', handleMouseOver);
      this.editor.container.addEventListener('mouseout', handleMouseOut);

      this.boundHandlers.set('mouseover', handleMouseOver);
      this.boundHandlers.set('mouseout', handleMouseOut);
    }
  }

  bindClickEvents(): void {
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;

      // 如果点击的元素已经被选中且可编辑，不要stopPropagation，让contenteditable正常工作
      if (target === this.editor.selectedElement && target.getAttribute('contenteditable') === 'true') {
        // 不阻止事件，让用户可以在元素内部点击定位光标
        return;
      }

      // 选中元素
      e.stopPropagation();
      this.editor.selectElement(target);
    };

    if (this.editor.container) {
      this.editor.container.addEventListener('click', handleClick);
      this.boundHandlers.set('click', handleClick);
    }
  }

  bindDocumentEvents(): void {
    const handleDocumentClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (this.editor.container &&
          !this.editor.container.contains(target) &&
          !target.closest('.floating-toolbar')) {
        this.editor.clearSelection();
      }
    };

    document.addEventListener('click', handleDocumentClick);
    this.boundHandlers.set('documentClick', handleDocumentClick);
  }

  unbindAll(): void {
    this.boundHandlers.forEach((handler, event) => {
      if (event === 'documentClick') {
        document.removeEventListener('click', handler);
      } else if (this.editor.container) {
        this.editor.container.removeEventListener(event, handler);
      }
    });
    this.boundHandlers.clear();
  }
}

export default EventManager;