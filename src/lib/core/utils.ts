/**
 * 通用工具函数集合：与 HTMLEditor 实例 (this) 无关的逻辑
 */

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

export function isTextElement(element: HTMLElement): boolean {
  const textTags = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'strong', 'em'];
  return textTags.includes(element.tagName.toLowerCase());
}

export function isBlockElement(element: HTMLElement): boolean {
  const blockTags = ['div', 'section', 'article', 'header', 'footer', 'main', 'body'];
  return blockTags.includes(element.tagName.toLowerCase());
}

export function isImageElement(element: HTMLElement): boolean {
  return element.tagName.toLowerCase() === 'img';
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