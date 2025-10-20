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

    const updateFontSize = () => {
      const computedStyle = window.getComputedStyle(element);
      const fontSizeValue = computedStyle.fontSize;
      setFontSize(parseInt(fontSizeValue).toString());
    };

    updateFontSize();

    // 监听样式变化
    const observer = new MutationObserver(() => {
      updateFontSize();
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, [element]);

  return [fontSize, setFontSize] as const;
};

// Hook: 读取背景色
export const useBackgroundColor = (element: HTMLElement | null) => {
  const [bgColor, setBgColor] = useState('#ffffff');

  useEffect(() => {
    if (!element) return;

    const updateBgColor = () => {
      const computedStyle = window.getComputedStyle(element);
      const bgColorValue = computedStyle.backgroundColor;

      if (bgColorValue && bgColorValue !== 'rgba(0, 0, 0, 0)' && bgColorValue !== 'transparent') {
        setBgColor(rgbToHex(bgColorValue));
      } else {
        setBgColor('#ffffff');
      }
    };

    updateBgColor();

    const observer = new MutationObserver(() => {
      updateBgColor();
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, [element]);

  return [bgColor, setBgColor] as const;
};

// Hook: 读取文字颜色
export const useTextColor = (element: HTMLElement | null) => {
  const [textColor, setTextColor] = useState('#000000');

  useEffect(() => {
    if (!element) return;

    const updateTextColor = () => {
      const computedStyle = window.getComputedStyle(element);
      const textColorValue = computedStyle.color;

      if (textColorValue) {
        setTextColor(rgbToHex(textColorValue));
      }
    };

    updateTextColor();

    const observer = new MutationObserver(() => {
      updateTextColor();
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, [element]);

  return [textColor, setTextColor] as const;
};

// Hook: 读取圆角
export const useBorderRadius = (element: HTMLElement | null) => {
  const [borderRadius, setBorderRadius] = useState('0');

  useEffect(() => {
    if (!element) return;

    const updateBorderRadius = () => {
      const computedStyle = window.getComputedStyle(element);
      const borderRadiusValue = computedStyle.borderRadius;
      setBorderRadius(parseInt(borderRadiusValue).toString());
    };

    updateBorderRadius();

    const observer = new MutationObserver(() => {
      updateBorderRadius();
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, [element]);

  return [borderRadius, setBorderRadius] as const;
};

// Hook: 读取边框
export const useBorder = (element: HTMLElement | null) => {
  const [border, setBorder] = useState('');

  useEffect(() => {
    if (!element) return;

    const updateBorder = () => {
      const computedStyle = window.getComputedStyle(element);
      const borderValue = computedStyle.border;
      setBorder(borderValue);
    };

    updateBorder();

    const observer = new MutationObserver(() => {
      updateBorder();
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, [element]);

  return [border, setBorder] as const;
};

// Hook: 读取边距
export const useMargin = (element: HTMLElement | null) => {
  const [margin, setMargin] = useState('');

  useEffect(() => {
    if (!element) return;

    const updateMargin = () => {
      const computedStyle = window.getComputedStyle(element);
      const marginValue = computedStyle.margin;
      setMargin(marginValue);
    };

    updateMargin();

    const observer = new MutationObserver(() => {
      updateMargin();
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, [element]);

  return [margin, setMargin] as const;
};

// Hook: 读取字体粗细
export const useFontWeight = (element: HTMLElement | null) => {
  const [isBold, setIsBold] = useState(false);

  useEffect(() => {
    if (!element) return;

    const updateFontWeight = () => {
      const computedStyle = window.getComputedStyle(element);
      const fontWeight = computedStyle.fontWeight;
      // fontWeight 可能是数字（400, 700）或字符串（normal, bold）
      setIsBold(fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight) >= 700);
    };

    updateFontWeight();

    const observer = new MutationObserver(() => {
      updateFontWeight();
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, [element]);

  return isBold;
};

// Hook: 读取字体样式（斜体）
export const useFontStyle = (element: HTMLElement | null) => {
  const [isItalic, setIsItalic] = useState(false);

  useEffect(() => {
    if (!element) return;

    const updateFontStyle = () => {
      const computedStyle = window.getComputedStyle(element);
      const fontStyle = computedStyle.fontStyle;
      setIsItalic(fontStyle === 'italic');
    };

    updateFontStyle();

    const observer = new MutationObserver(() => {
      updateFontStyle();
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, [element]);

  return isItalic;
};

// Hook: 读取文字装饰（下划线）
export const useTextDecoration = (element: HTMLElement | null) => {
  const [isUnderline, setIsUnderline] = useState(false);

  useEffect(() => {
    if (!element) return;

    const updateTextDecoration = () => {
      const computedStyle = window.getComputedStyle(element);
      const textDecoration = computedStyle.textDecoration;
      setIsUnderline(textDecoration.includes('underline'));
    };

    updateTextDecoration();

    const observer = new MutationObserver(() => {
      updateTextDecoration();
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, [element]);

  return isUnderline;
};