/**
 * Style Manager
 * 样式管理器，处理元素样式的应用和获取
 */

import { type HTMLEditor } from '../editor';
import type { ElementStyles } from '../../types';
import { createStyleChangeCommand, createElementTagChangeCommand } from '../historyManager/commands';

export class StyleManager {
  private editor: HTMLEditor;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  /**
   * 应用样式并记录历史
   */
  private applyStyleWithHistory(element: HTMLElement, property: string, value: string): void {
    const oldValue = element.style.getPropertyValue(property) || window.getComputedStyle(element).getPropertyValue(property);

    // 创建命令并执行
    if (this.editor.historyManager) {
      const command = createStyleChangeCommand(element, property, oldValue, value);
      command.execute();
      this.editor.historyManager.push(command);
    } else {
      // 如果没有历史管理器，直接应用样式
      element.style.setProperty(property, value);
    }
  }

  // 字体相关方法
  changeFont(element: HTMLElement | null, fontFamily: string, triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    this.applyStyleWithHistory(element, 'font-family', fontFamily);
    this.editor.emit('styleChange', element, { fontFamily });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  changeFontSize(element: HTMLElement | null, fontSize: string, triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    this.applyStyleWithHistory(element, 'font-size', fontSize);
    this.editor.emit('styleChange', element, { fontSize });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  changeFontWeight(element: HTMLElement | null, fontWeight: string, triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    this.applyStyleWithHistory(element, 'font-weight', fontWeight);
    this.editor.emit('styleChange', element, { fontWeight });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  changeFontStyle(element: HTMLElement | null, fontStyle: string, triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    this.applyStyleWithHistory(element, 'font-style', fontStyle);
    this.editor.emit('styleChange', element, { fontStyle });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  changeTextDecoration(element: HTMLElement | null, textDecoration: string, triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    this.applyStyleWithHistory(element, 'text-decoration', textDecoration);
    this.editor.emit('styleChange', element, { textDecoration });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  changeTextAlign(element: HTMLElement | null, textAlign: string, triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    this.applyStyleWithHistory(element, 'text-align', textAlign);
    this.editor.emit('styleChange', element, { textAlign });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  // 边距相关方法
  changeMargin(element: HTMLElement | null, margin: string, triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    this.applyStyleWithHistory(element, 'margin', margin);
    this.editor.emit('styleChange', element, { margin });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  changePadding(element: HTMLElement | null, padding: string,triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    this.applyStyleWithHistory(element, 'padding', padding);
    this.editor.emit('styleChange', element, { padding });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  // 颜色相关方法
  changeColor(element: HTMLElement | null, color: string, triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    this.applyStyleWithHistory(element, 'color', color);
    this.editor.emit('styleChange', element, { color });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  changeBackground(element: HTMLElement | null, backgroundColor: string, triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    // 使用批量操作记录 background 和 backgroundColor
    // this.editor.beginBatch();
    this.applyStyleWithHistory(element, 'background-color', backgroundColor);
    // this.editor.endBatch();
    this.editor.emit('styleChange', element, { backgroundColor, background: backgroundColor });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  // 边框相关方法
  changeBorder(element: HTMLElement | null, border: string, triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    this.applyStyleWithHistory(element, 'border', border);
    this.editor.emit('styleChange', element, { border });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  changeBorderRadius(element: HTMLElement | null, borderRadius: string, triggerContentChange = true): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    this.applyStyleWithHistory(element, 'border-radius', borderRadius);
    this.editor.emit('styleChange', element, { borderRadius });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  applyTextStyle(property: string, value: string, triggerContentChange = true): boolean {
    if (!this.editor.selectedElement) return false;
    this.applyStyleWithHistory(this.editor.selectedElement, property, value);
    this.editor.emit('styleChange', this.editor.selectedElement, { [property]: value });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  applyBlockStyle(property: string, value: string, triggerContentChange = true): boolean {
    if (!this.editor.selectedElement) return false;

    const el = this.editor.selectedElement;

    // 兼容传入 'background-color' 字符串
    const prop = property === 'background-color' ? 'background-color' : property;

    // 当设置背景相关属性时，同时更新 background 与 backgroundColor
    if (prop === 'background' || prop === 'background-color') {
      this.editor.beginBatch();
      this.applyStyleWithHistory(el, 'background-color', value);
      this.applyStyleWithHistory(el, 'background', value);
      this.editor.endBatch();
      this.editor.emit('styleChange', el, { backgroundColor: value, background: value });
      return true;
    }

    this.applyStyleWithHistory(el, prop, value);
    this.editor.emit('styleChange', el, { [prop]: value });
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }
    return true;
  }

  getComputedStyle(element: HTMLElement, property: string): string {
    return window.getComputedStyle(element)[property as any];
  }

  getElementStyles(element: HTMLElement): ElementStyles {
    const computedStyle = window.getComputedStyle(element);
    return {
      fontSize: computedStyle.fontSize,
      color: computedStyle.color,
      fontWeight: computedStyle.fontWeight,
      backgroundColor: computedStyle.backgroundColor,
      borderWidth: computedStyle.borderWidth,
      padding: computedStyle.padding,
      margin: computedStyle.margin,
      borderRadius: computedStyle.borderRadius
    };
  }

  changeElementTag(element: HTMLElement, newTag: string, triggerContentChange = true): HTMLElement | null {
    if (!element || !element.parentNode || !newTag) {
      return null;
    }

    const command = createElementTagChangeCommand(element, newTag);
    command.execute();

    const newElement = (command as any).newElement as HTMLElement;
    if (!newElement) return null;

    if (this.editor.historyManager) {
      this.editor.historyManager.push(command);
    }
    
    this.editor.selectElement(newElement);

    this.editor.emit('contentChange');
    if (triggerContentChange) {
      this.editor.emit('contentChange');
    }

    return newElement;
  }

  rgbToHex(rgb: string): string {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') {
      return '#ffffff';
    }

    const result = rgb.match(/\d+/g);
    if (!result) return '#000000';

    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}

export default StyleManager;