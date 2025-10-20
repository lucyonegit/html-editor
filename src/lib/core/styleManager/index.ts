/**
 * Style Manager
 * 样式管理器，处理元素样式的应用和获取
 */

import { type HTMLEditor } from '../editor';
import type { ElementStyles } from '../../types';

export class StyleManager {
  private editor: HTMLEditor;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  // 字体相关方法
  changeFont(element: HTMLElement | null, fontFamily: string): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    element.style.fontFamily = fontFamily;
    this.editor.emit('styleChange', element, { fontFamily });
    return true;
  }

  changeFontSize(element: HTMLElement | null, fontSize: string): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    element.style.fontSize = fontSize;
    this.editor.emit('styleChange', element, { fontSize });
    return true;
  }

  changeFontWeight(element: HTMLElement | null, fontWeight: string): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    element.style.fontWeight = fontWeight;
    this.editor.emit('styleChange', element, { fontWeight });
    return true;
  }

  changeFontStyle(element: HTMLElement | null, fontStyle: string): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    element.style.fontStyle = fontStyle;
    this.editor.emit('styleChange', element, { fontStyle });
    return true;
  }

  changeTextDecoration(element: HTMLElement | null, textDecoration: string): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    element.style.textDecoration = textDecoration;
    this.editor.emit('styleChange', element, { textDecoration });
    return true;
  }

  // 边距相关方法
  changeMargin(element: HTMLElement | null, margin: string): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    element.style.margin = margin;
    this.editor.emit('styleChange', element, { margin });
    return true;
  }

  changePadding(element: HTMLElement | null, padding: string): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    element.style.padding = padding;
    this.editor.emit('styleChange', element, { padding });
    return true;
  }

  // 颜色相关方法
  changeColor(element: HTMLElement | null, color: string): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    element.style.color = color;
    this.editor.emit('styleChange', element, { color });
    return true;
  }

  changeBackground(element: HTMLElement | null, backgroundColor: string): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    // 同步设置 background 与 backgroundColor，避免不生效
    element.style.backgroundColor = backgroundColor;
    element.style.background = backgroundColor;
    this.editor.emit('styleChange', element, { backgroundColor, background: backgroundColor });
    return true;
  }

  // 边框相关方法
  changeBorder(element: HTMLElement | null, border: string): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    element.style.border = border;
    this.editor.emit('styleChange', element, { border });
    return true;
  }

  changeBorderRadius(element: HTMLElement | null, borderRadius: string): boolean {
    if (!element) element = this.editor.selectedElement;
    if (!element) return false;
    element.style.borderRadius = borderRadius;
    this.editor.emit('styleChange', element, { borderRadius });
    return true;
  }

  applyTextStyle(property: string, value: string): boolean {
    if (!this.editor.selectedElement) return false;

    (this.editor.selectedElement.style as any)[property] = value;
    this.editor.emit('styleChange', this.editor.selectedElement, { [property]: value });
    return true;
  }

  applyBlockStyle(property: string, value: string): boolean {
    if (!this.editor.selectedElement) return false;

    const el = this.editor.selectedElement;
    const style = el.style as any;

    // 兼容传入 'background-color' 字符串，转为 camelCase
    const prop = property === 'background-color' ? 'backgroundColor' : property;

    // 常规赋值
    style[prop] = value;

    // 当设置背景相关属性时，同时更新 background 与 backgroundColor
    if (prop === 'background' || prop === 'backgroundColor') {
      style.backgroundColor = value;
      style.background = value;
      this.editor.emit('styleChange', el, { backgroundColor: value, background: value });
      return true;
    }

    this.editor.emit('styleChange', el, { [prop]: value });
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