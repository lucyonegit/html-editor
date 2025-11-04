export class MoveableGuidelinesHandler {
  /**
   * 计算自动对齐参考线
   */
  static calculateAutoGuidelines(
    element: HTMLElement,
    container: HTMLElement,
    elementGuidelinesOption: HTMLElement[] | undefined
  ): HTMLElement[] {
    if (elementGuidelinesOption) {
      return elementGuidelinesOption;
    }

    return Array.from(container.querySelectorAll<HTMLElement>("*")).filter((el) => {
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
  }

  /**
   * 计算水平标尺线
   */
  static calculateHorizontalGuidelines(
    container: HTMLElement,
    horizontalGuidelinesOption: number[] | undefined
  ): number[] {
    if (horizontalGuidelinesOption) {
      return horizontalGuidelinesOption;
    }

    return [
      0,
      Math.round(container.clientHeight / 2),
      container.clientHeight,
    ];
  }

  /**
   * 计算垂直标尺线
   */
  static calculateVerticalGuidelines(
    container: HTMLElement,
    verticalGuidelinesOption: number[] | undefined
  ): number[] {
    if (verticalGuidelinesOption) {
      return verticalGuidelinesOption;
    }

    return [
      0,
      Math.round(container.clientWidth / 2),
      container.clientWidth,
    ];
  }

  /**
   * 获取容器元素
   */
  static getContainer(
    element: HTMLElement,
    editorContainer: HTMLElement | null,
    snapContainerOption: HTMLElement | null
  ): HTMLElement {
    const root = element.ownerDocument?.body || document.body;
    return snapContainerOption ?? (editorContainer || element.parentElement || root);
  }
}