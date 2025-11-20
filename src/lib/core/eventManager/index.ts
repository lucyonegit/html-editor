/**
 * Event Manager
 * 事件管理器，处理所有DOM事件
 */

import { type HTMLEditor } from '../editor';
import { getElementType } from '../utils';

type EventHandler = (e: Event) => void;

export class EventManager {
  private editor: HTMLEditor;
  private boundHandlers: Map<string, EventHandler>;


  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.boundHandlers = new Map<string, EventHandler>();
  }

  bindAll(): void {
    this.bindHoverEvents();
    this.bindClickEvents();
    this.bindDocumentEvents();
  }



  bindHoverEvents(): void {
    const highlightTracker = this.editor.helperBoxManager.createHighlightTracker();
    const handleMouseOver = (e: Event) => {
      if (this.editor.isInsertMode) {
        return;
      }
      // 如果正在进行拖动、缩放等操作，不处理 hover
      if (this.editor.isOperating()) {
        return;
      }

      e.stopPropagation();
      const target = e.target as HTMLElement;
      const targetTagName = target.tagName.toLowerCase();
      // 如果包含在忽略的标签中，不处理
      if((this.editor.options.ignoreSelectTags||[]).includes(targetTagName)) return;

      if (target.classList.contains('selected-element') || target.classList.contains('moveable-line')) return;

      // 先清除容器内所有非选中元素的hover样式
      if (this.editor.container) {
        const doc = this.editor.container.ownerDocument;
        doc.querySelectorAll('.hover-highlight').forEach((el: Element) => {
          if (!el.classList.contains('selected-element')) {
            el.classList.remove('hover-highlight');
            el.removeAttribute('data-element-type');
          }
        });
      }

      target.classList.add('hover-highlight');
      target.setAttribute('data-element-type', getElementType(target));

      if (this.editor.options.helperBox && this.editor.helperBoxManager && this.editor.container) {
        highlightTracker.start(target);
        // const position = this.editor.getBoundPostion(target);
        // this.editor.helperBoxManager.updatePostion(position);
        this.editor.helperBoxManager.visible(!(this.editor.selectedElement === target));
      }

      this.editor.emit('hover', target);
    };

    const handleMouseOut = (e: Event) => {
      if (this.editor.isInsertMode) {
        return;
      }
      const target = e.target as HTMLElement;
      if (!target.classList.contains('selected-element')) {
        target.classList.remove('hover-highlight');
        target.removeAttribute('data-element-type');
      }

      // 如果启用了 helperBox，则隐藏
      if (this.editor.options.helperBox && this.editor.helperBoxManager) {
        highlightTracker.stop(target);
        this.editor.helperBoxManager.visible(false);
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
      if (this.editor.isInsertMode) {
        e.stopPropagation();
        const me = e as MouseEvent;
        this.editor.insertTextAtPosition(me.clientX, me.clientY);
        return;
      }

      const targetTagName = target.tagName.toLowerCase();
      // 如果包含在忽略的标签中，不处理
      if((this.editor.options.ignoreSelectTags||[]).includes(targetTagName)) return;

      // 如果正在进行拖动或缩放操作，不处理点击
      if (this.editor.isDragging || this.editor.isResizing) {
        return;
      }

      // 当点击当前容器时，清空其他编辑器的选中样式
      this.editor.EditorRegistry.clearOthers(this.editor);

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

      // 如果正在进行操作，不清除选择
      if (this.editor.isOperating()) {
        return;
      }
      if (this.editor.container &&
          !this.editor.container.contains(target) &&
        !target.closest('.html-editor-toolbar') && 
        !target.closest('.html-editor-heading-dropdown') &&
        !target.closest('.ant-color-picker-inner')
      ) {
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