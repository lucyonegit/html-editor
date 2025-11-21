import { Position } from "../../types";
import { HTMLEditor } from "../editor";
import { elementWatcher } from "../utils";

export class HelperBoxManager {
  editor: HTMLEditor;
  element: HTMLElement | null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.element = null;
  }

  init() {
    if (!this.editor.container) return;
    const doc = this.editor.getDoc().document;
    const helperBox = doc.getElementById('html-editor-helper-box') || doc.createElement('div');
    this.element = helperBox;
    this.element.id = 'html-editor-helper-box';
    this.element.style.position = 'absolute';
    this.element.style.zIndex = '9999';
    this.element.style.display = 'none';
    this.element.style.pointerEvents = 'none';
    this.element.style.border = '1px dashed #228be6';
    this.element.style.backgroundColor = 'rgba(34, 139, 230, 0.04)';

    if(this.editor.isIframe) {
      doc.body.appendChild(this.element);
    } else {
      this.editor.container.style.position = 'relative';
      this.editor.container.appendChild(this.element);
    }
  }
  
  updatePostion(position: Position) {
    if (!this.element) return;
    const { document, view } = this.editor.getDoc();
    if(!view || !document) return;
    const scrollTop  = view.scrollY || 0;
    const scrollLeft = view.scrollX || 0;


    const doc = this.editor.container?.ownerDocument || document;
    let offsetTop = position.top + (this.editor.container?.scrollTop || 0);
    let offsetLeft = position.left;
    if (this.editor.isIframe && document?.body) {
      const cs = view?.getComputedStyle(doc.body);
      const mt = cs ? parseFloat(cs.marginTop || '0') : 0;
      const ml = cs ? parseFloat(cs.marginLeft || '0') : 0;
      offsetTop -= mt;
      offsetLeft -= ml;
    }
    this.element.style.width = `${position.width}px`;
    this.element.style.height = `${position.height}px`;
    this.element.style.top = `${offsetTop + scrollTop }px`;
    this.element.style.left = `${offsetLeft + scrollLeft }px`;
  }

  // 创建高亮框,根据渲染帧刷新位置（解决dom有动画的case）
  createHighlightTracker() {
    const watcher = elementWatcher(this.editor);
    return {
      start:(element: HTMLElement)=>{
        watcher.start(element, (postion) => {
          this.updatePostion(postion);
          this.element.setAttribute('data-element-type', element.getAttribute('data-element-type'))
        });
      },
      stop: watcher.stop,
    };
  }

  visible(visible: boolean) {
    if(!this.element) return;
    this.element.style.display = visible ? 'block' : 'none';
  }

  delete() {
    if(!this.element) return;
    this.element.remove();
    this.element = null;
  }
}