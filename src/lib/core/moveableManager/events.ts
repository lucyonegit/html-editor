/**
 * Moveable Events Handler
 * 拖拽与缩放事件处理逻辑
 */
import type Moveable from "moveable";
import type { HTMLEditor } from "../editor";
import { createStyleChangeCommand } from "../historyManager/commands";

export class MoveableEventsHandler {
  private editor: HTMLEditor;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  /**
   * 绑定拖拽事件
   */
  bindDragEvents(instance: Moveable) {
    let originalTransform: string | null = null;

    instance.on("dragStart", ({ target, inputEvent }) => {
      const el = target as HTMLElement;
      try {
        inputEvent?.preventDefault();
      } catch {}
      el.style.userSelect = "none";
      this.editor.setDragging(true);
      
      // 记录初始状态
      originalTransform = el.style.transform || "";
    });

    instance.on("drag", ({ target, transform }) => {
      const el = target as HTMLElement;
      el.style.transform = transform;
      this.editor.emit("styleChange", el, { transform });
    });

    instance.on("dragEnd", ({ target }) => {
      const el = target as HTMLElement;
      // 记录历史
      if (this.editor.historyManager && originalTransform !== null) {
        const newTransform = el.style.transform || "";
        
        if (originalTransform !== newTransform) {
          const command = createStyleChangeCommand(el, "transform", originalTransform, newTransform);
          command.execute();
          this.editor.historyManager.push(command);
        }
      }
      
      this.editor.setDragging(false);
      this.editor.emit("contentChange");
      originalTransform = null;
    });
  }

  /**
   * 绑定缩放事件
   */
  bindScaleEvents(instance: Moveable) {
    let originalTransform: string | null = null;

    instance.on("scaleStart", (e) => {
      this.editor.setResizing(true);
      e.target.blur();
      // 记录初始状态
      const el = e.target as HTMLElement;
      originalTransform = el.style.transform || "";
    });

    instance.on("scale", ({ target, transform, drag }) => {
      const el = target as HTMLElement;
      el.style.transform = drag.transform;
      this.editor.emit("styleChange", el, {
        transform: drag && drag.transform ? drag.transform : transform,
      });
    });

    instance.on("scaleEnd", ({ target }) => {
      const el = target as HTMLElement;
      // 记录历史
      if (this.editor.historyManager && originalTransform !== null) {
        const newTransform = el.style.transform || "";
        
        if (originalTransform !== newTransform) {
          const command = createStyleChangeCommand(el, "transform", originalTransform, newTransform);
          command.execute();
          this.editor.historyManager.push(command);
        }
      }
      
      this.editor.setResizing(false);
      this.editor.emit("contentChange");
      originalTransform = null;
    });
  }

  /**
   * 绑定所有事件
   */
  bindAllEvents(instance: Moveable) {
    this.bindDragEvents(instance);
    this.bindScaleEvents(instance);
  }
}