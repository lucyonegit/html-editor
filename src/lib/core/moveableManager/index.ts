/**
 * Moveable Manager
 * 集成 moveable，实现选中元素的拖拽与四角缩放
 * 依赖：npm i moveable
 */
import Moveable from "moveable";
import { type HTMLEditor } from "../editor";
import type { MoveableOptions } from "../../types";



export class MoveableManager {
  private editor: HTMLEditor;
  private instance: Moveable | null = null;
  private options: MoveableOptions;

  // 记录启用前的属性，便于恢复
  private originalState: {
    contenteditable?: string | null;
    userSelect?: string | null;
  } = {};

  constructor(editor: HTMLEditor, options: MoveableOptions = {}) {
    this.editor = editor;
    this.options = {
      renderDirections: ["nw", "ne", "sw", "se"],
      keepRatio: false,
      throttleDrag: 0,
      throttleResize: 0,

      // 默认开启吸附与标尺线
      snappable: true,
      snapCenter: true,
      snapThreshold: 5,
      snapGridWidth: undefined,
      snapGridHeight: undefined,
      snapContainer: null,
      elementGuidelines: undefined,
      horizontalGuidelines: undefined,
      verticalGuidelines: undefined,
      snapDirections: {
        left: true,
        top: true,
        right: true,
        bottom: true,
        center: true,
        middle: true,
      },

      ...options,
    };
  }

  enableFor(element: HTMLElement) {
    this.destroy();

    // 启用前准备：禁用 contenteditable 与选择，避免拖拽被当作文本选择
    this.prepareElement(element);

    const root = element.ownerDocument?.body || document.body;

    // 以编辑器容器为参考（若存在），否则用目标的父节点或文档 body
    const container =
      this.options.snapContainer ??
      (this.editor.container || element.parentElement || root);

    // 自动收集容器内其他元素作为对齐参考线
    const autoGuidelines =
      this.options.elementGuidelines ??
      Array.from(container.querySelectorAll<HTMLElement>("*")).filter((el) => {
        if (el === element) return false;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const visible =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0;
        return visible;
      });

    // 可选：基础水平/垂直标尺线（容器边与中心）
    const hGuides =
      this.options.horizontalGuidelines ??
      [0, Math.round(container.clientHeight / 2), container.clientHeight];
    const vGuides =
      this.options.verticalGuidelines ??
      [0, Math.round(container.clientWidth / 2), container.clientWidth];

    this.instance = new Moveable(root, {
      target: element,
      draggable: true,
      resizable: true,
      edgeDraggable: true,
      checkInput: true,


      // 缩放手柄
      renderDirections: this.options.renderDirections,
      keepRatio: this.options.keepRatio,

      // 性能相关
      throttleDrag: this.options.throttleDrag,
      throttleResize: this.options.throttleResize,

      // 吸附与对齐线
      snappable: this.options.snappable,
      snapContainer: container,
      elementGuidelines: autoGuidelines,
      horizontalGuidelines: hGuides,
      verticalGuidelines: vGuides,
      // 提高阈值，避免吸附过强导致“拖不动”的感觉
      snapThreshold: this.options.snapThreshold ?? 10,
      snapGridWidth: this.options.snapGridWidth,
      snapGridHeight: this.options.snapGridHeight,
      snapDirections: this.options.snapDirections,
    });

    // 拖拽事件：直接使用 moveable 提供的 transform（包含叠加）
    this.instance.on("dragStart", ({ target, inputEvent }) => {
      const el = target as HTMLElement;
      try {
        inputEvent?.preventDefault();
      } catch {}
      el.style.userSelect = "none";
    });
    this.instance.on("drag", ({ target, transform }) => {
      const el = target as HTMLElement;
      el.style.transform = transform;
      this.editor.emit("styleChange", el, { transform });
      this.editor.emit("contentChange");
    });
    this.instance.on("dragEnd", ({ target }) => {
      // 拖拽结束恢复 userSelect（最终完整恢复在 destroy 中进行）
      const el = target as HTMLElement;
      if (this.originalState.userSelect != null) {
        el.style.userSelect = this.originalState.userSelect || "";
      } else {
        el.style.removeProperty("user-select");
      }
    });

    // 缩放事件：更新尺寸，并用 drag.transform 同步位置（如有）
    this.instance.on("resize", ({ target, width, height, drag }) => {
      const el = target as HTMLElement;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;

      if (drag && drag.transform) {
        el.style.transform = drag.transform;
        this.editor.emit("styleChange", el, {
          width: `${width}px`,
          height: `${height}px`,
          transform: drag.transform,
        });
      } else {
        this.editor.emit("styleChange", el, {
          width: `${width}px`,
          height: `${height}px`,
        });
      }

      this.editor.emit("contentChange");
    });
  }

  destroy() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
    // 恢复元素的原始状态
    const el = this.editor.selectedElement;
    if (el) {
      this.restoreElement(el);
    }
  }

  private prepareElement(element: HTMLElement) {
    // 保存原始状态
    this.originalState.contenteditable = element.getAttribute("contenteditable");
    this.originalState.userSelect = element.style.userSelect || null;

    // 禁用 contenteditable 与选择，避免拖拽冲突；禁用触摸默认滚动
    element.setAttribute("contenteditable", "false");
    element.style.userSelect = "none";
    (element.style as any).touchAction = "none";
    element.style.willChange = "transform";
  }

  private restoreElement(element: HTMLElement) {
    // 恢复 contenteditable
    if (this.originalState.contenteditable != null) {
      if (this.originalState.contenteditable === "") {
        element.removeAttribute("contenteditable");
      } else {
        element.setAttribute("contenteditable", this.originalState.contenteditable);
      }
    } else {
      // 如果原本没有该属性，移除
      element.removeAttribute("contenteditable");
    }

    // 恢复 user-select
    if (this.originalState.userSelect != null) {
      element.style.userSelect = this.originalState.userSelect || "";
    } else {
      element.style.removeProperty("user-select");
    }

    // 清理 will-change
    element.style.removeProperty("will-change");

    // 清空记录
    this.originalState = {};
  }
}