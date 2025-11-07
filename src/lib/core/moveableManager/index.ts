/**
 * Moveable Manager
 * 实现选中元素的拖拽与四角缩放
 */
import Moveable from "moveable";
import { type HTMLEditor } from "../editor";
import type { MoveableOptions } from "../../types";
import { MoveableEventsHandler } from "./events";
import { MoveableGuidelinesHandler } from "./guidelines";

export class MoveableManager {
  private editor: HTMLEditor;
  private instance: Moveable | null = null;
  private options: MoveableOptions;
  private eventsHandler: MoveableEventsHandler;

  // 记录启用前的属性，便于恢复
  private originalState: {
    contenteditable?: string | null;
    userSelect?: string | null;
    transformOrigin?: string | null;
  } = {};

  constructor(editor: HTMLEditor, options: MoveableOptions = {}) {
    this.editor = editor;
    this.eventsHandler = new MoveableEventsHandler(editor);
    this.options = {
      draggable: true,
      scalable: false,
      resizable: true,
      renderDirections: ["nw", "ne", "sw", "se", "n", "s", "w", "e"],
      keepRatio: false,
      throttleDrag: 0,
      throttleResize: 0,
      throttleScale: 0,
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

  enableFor(element: HTMLElement, options?: Partial<MoveableOptions>): void {
    this.destroy();

    // 启用前准备：禁用 contenteditable 与选择，避免拖拽被当作文本选择
    this.prepareElement(element);
    const mergedOptions: MoveableOptions = { ...this.options, ...(options || {}) };

    // 获取容器元素
    const container = MoveableGuidelinesHandler.getContainer(
      element,
      this.editor.container,
      mergedOptions.snapContainer ?? null
    );

    // 计算自动对齐参考线
    const autoGuidelines = MoveableGuidelinesHandler.calculateAutoGuidelines(
      element,
      container,
      mergedOptions.elementGuidelines
    );

    // 计算水平标尺线
    const hGuides = MoveableGuidelinesHandler.calculateHorizontalGuidelines(
      container,
      mergedOptions.horizontalGuidelines
    );

    // 计算垂直标尺线
    const vGuides = MoveableGuidelinesHandler.calculateVerticalGuidelines(
      container,
      mergedOptions.verticalGuidelines
    );

    const root = element.ownerDocument?.body || document.body;

    this.instance = new Moveable(root, {
      target: element,
      draggable: mergedOptions.draggable,
      scalable: mergedOptions.scalable,
      resizable: mergedOptions.resizable,
      edgeDraggable: true,
      checkInput: true,
      origin: false,

      // 缩放手柄
      renderDirections: mergedOptions.renderDirections,
      keepRatio: mergedOptions.keepRatio,

      // 性能相关
      throttleDrag: mergedOptions.throttleDrag,
      throttleScale: mergedOptions.throttleScale,

      // 吸附与对齐线
      snappable: mergedOptions.snappable,
      snapContainer: container,
      elementGuidelines: autoGuidelines,
      horizontalGuidelines: hGuides,
      verticalGuidelines: vGuides,
      // 提高阈值，避免吸附过强导致"拖不动"的感觉
      snapThreshold: mergedOptions.snapThreshold ?? 10,
      snapGridWidth: mergedOptions.snapGridWidth,
      snapGridHeight: mergedOptions.snapGridHeight,
      snapDirections: mergedOptions.snapDirections,
    });

    // 绑定拖拽和缩放事件
    this.eventsHandler.bindAllEvents(this.instance);
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
    this.originalState.contenteditable =
      element.getAttribute("contenteditable");
    this.originalState.userSelect = element.style.userSelect || null;
    this.originalState.transformOrigin = element.style.transformOrigin || null;

    element.setAttribute("contenteditable", "false");
    element.style.userSelect = "none";
    (element.style as any).touchAction = "none";
  }

  private restoreElement(element: HTMLElement) {
    // 恢复 contenteditable
    if (this.originalState.contenteditable != null) {
      if (this.originalState.contenteditable === "") {
        element.removeAttribute("contenteditable");
      } else {
        element.setAttribute(
          "contenteditable",
          this.originalState.contenteditable
        );
      }
    } else {
      element.removeAttribute("contenteditable");
    }

    // 恢复 user-select
    if (this.originalState.userSelect != null) {
      element.style.userSelect = this.originalState.userSelect || "";
    } else {
      element.style.removeProperty("user-select");
    }

    // 恢复 transform-origin
    if (this.originalState.transformOrigin != null) {
      element.style.transformOrigin = this.originalState.transformOrigin || "";
    } else {
      element.style.removeProperty("transform-origin");
    }

    // 清理 will-change
    element.style.removeProperty("will-change");

    // 清空记录
    this.originalState = {};
  }
}