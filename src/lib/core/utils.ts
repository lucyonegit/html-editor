/**
 * 通用工具函数集合：与 HTMLEditor 实例 (this) 无关的逻辑
 */

import { Position } from "../types";
import { HTMLEditor } from "./editor";

export function getElementType(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase();
  const typeMap: Record<string, string> = {
    'h1': '标题1', 'h2': '标题2', 'h3': '标题3',
    'h4': '标题4', 'h5': '标题5', 'h6': '标题6',
    'p': '段落', 'div': '区块', 'span': '文本',
    'a': '链接', 'img': '图片',
    'ul': '无序列表', 'ol': '有序列表', 'li': '列表项'
  };
  return typeMap[tagName] || tagName.toUpperCase();
}

export function isDivWithText(element: HTMLElement): boolean {
  const elementWithText = !!element.textContent?.trim() && element.children.length === 0;
  return element.tagName.toLowerCase() === 'div' && elementWithText
}

export function isTextElement(element: HTMLElement): boolean {
  const textTags = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'strong', 'em'];
  return textTags.includes(element.tagName.toLowerCase()) || isDivWithText(element);
}

export function isDivWithImage(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const {backgroundImage, background} = computedStyle
  const elementWithBgImage = !!backgroundImage && backgroundImage !== 'none' && backgroundImage.includes('url(')
  const elementBgWithUrl = !!background && background.includes('url(')
  const divWithbg = element.tagName.toLowerCase() === 'div' && element.children.length === 0 && (elementWithBgImage || elementBgWithUrl);
  return divWithbg
}



export function isBlockElement(element: HTMLElement): boolean {
  const blockTags = ['div', 'section', 'article', 'header', 'footer', 'main', 'body', 'ol', 'ul','li','button','i'];
  return blockTags.includes(element.tagName.toLowerCase()) && !isDivWithImage(element) && !isDivWithText(element);
}

export const isInlineElement = (element: HTMLElement): boolean => {
  const display = getComputedStyle(element).display;
  return display.startsWith('inline') && display !== 'inline-block';
}

export const isTableElement = (element: HTMLElement): boolean => {
  const tableTags = ['tr', 'td', 'th', 'tbody', 'thead', 'tfoot', 'caption'];
  const tagName = element.tagName.toLowerCase().toLowerCase();
  return tableTags.includes(tagName);
}

export function isImageElement(element: HTMLElement): boolean {
  return isDivWithImage(element) || element.tagName.toLowerCase() === 'img';
}

export function createElement(type: string, content: string = ''): HTMLElement {
  const element = document.createElement(type);

  if (content) {
    element.textContent = content;
  } else {
    element.textContent = type === 'div' ? '新区块' : '新文本';
  }

  // 添加基础样式
  element.style.padding = '10px';
  element.style.margin = '5px';
  element.style.backgroundColor = '#f8f9fa';
  element.style.border = '1px dashed #dee2e6';
  element.style.borderRadius = '4px';

  return element;
}

export const elementWatcher = ( editor: HTMLEditor) => {
  let ele = null;
  let running = false;
  let frameId = null;
  let lastRect = null;
  const update = (element: HTMLElement, callback?:(postition: Position)=>void) => {
    if (!running || !element.isConnected) return;

    const postition = editor.getBoundPostion(element);

    const hasChanged =
      !lastRect ||
      postition.left !== lastRect.left ||
      postition.top !== lastRect.top ||
      postition.width !== lastRect.width ||
      postition.height !== lastRect.height ||
      postition.right !== lastRect.right ||
      postition.bottom !== lastRect.bottom;

    if (hasChanged) {
      lastRect = postition;
      callback?.(postition);
    }

    // 下一帧继续
    frameId = requestAnimationFrame(()=>update(element, callback));
  }
  return {
    start:(element: HTMLElement, callback?:(position: Position)=>void)=>{
      if (!running) { 
        ele = element;
        running = true;
        update(element, callback);
      }
    },
    stop: (element: HTMLElement) => {
      if(ele !== element) return;
      running = false;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = null;
    },
  };
}