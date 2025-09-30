import { useState, useEffect } from 'react';

// 辅助函数：将 rgb/rgba 转换为 hex
const rgbToHex = (rgb: string): string => {
  if (rgb.startsWith('#')) return rgb;

  const match = rgb.match(/\d+/g);
  if (!match) return '#000000';

  const [r, g, b] = match.map(Number);
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// Hook: 读取字体大小
export const useFontSize = (element: HTMLElement | null) => {
  const [fontSize, setFontSize] = useState('16');

  useEffect(() => {
    if (!element) return;
    const computedStyle = window.getComputedStyle(element);
    const fontSizeValue = computedStyle.fontSize;
    setFontSize(parseInt(fontSizeValue).toString());
  }, [element]);

  return [fontSize, setFontSize] as const;
};

// Hook: 读取背景色
export const useBackgroundColor = (element: HTMLElement | null) => {
  const [bgColor, setBgColor] = useState('#ffffff');

  useEffect(() => {
    if (!element) return;
    const computedStyle = window.getComputedStyle(element);
    const bgColorValue = computedStyle.backgroundColor;

    if (bgColorValue && bgColorValue !== 'rgba(0, 0, 0, 0)' && bgColorValue !== 'transparent') {
      setBgColor(rgbToHex(bgColorValue));
    } else {
      setBgColor('#ffffff');
    }
  }, [element]);

  return [bgColor, setBgColor] as const;
};

// Hook: 读取文字颜色
export const useTextColor = (element: HTMLElement | null) => {
  const [textColor, setTextColor] = useState('#000000');

  useEffect(() => {
    if (!element) return;
    const computedStyle = window.getComputedStyle(element);
    const textColorValue = computedStyle.color;

    if (textColorValue) {
      setTextColor(rgbToHex(textColorValue));
    }
  }, [element]);

  return [textColor, setTextColor] as const;
};

// Hook: 读取圆角
export const useBorderRadius = (element: HTMLElement | null) => {
  const [borderRadius, setBorderRadius] = useState('0');

  useEffect(() => {
    if (!element) return;
    const computedStyle = window.getComputedStyle(element);
    const borderRadiusValue = computedStyle.borderRadius;
    setBorderRadius(parseInt(borderRadiusValue).toString());
  }, [element]);

  return [borderRadius, setBorderRadius] as const;
};

// Hook: 读取边框
export const useBorder = (element: HTMLElement | null) => {
  const [border, setBorder] = useState('');

  useEffect(() => {
    if (!element) return;
    const computedStyle = window.getComputedStyle(element);
    const borderValue = computedStyle.border;
    setBorder(borderValue);
  }, [element]);

  return [border, setBorder] as const;
};

// Hook: 读取边距
export const useMargin = (element: HTMLElement | null) => {
  const [margin, setMargin] = useState('');

  useEffect(() => {
    if (!element) return;
    const computedStyle = window.getComputedStyle(element);
    const marginValue = computedStyle.margin;
    setMargin(marginValue);
  }, [element]);

  return [margin, setMargin] as const;
};