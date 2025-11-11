/**
 * Editor Styles Configuration
 * 编辑器样式配置
 */

import { EditorStyleConfig } from "../types";

export const defaultStyleConfig: EditorStyleConfig = {
  hover: {
    outline: '1px dashed #4dabf7',
    outlineOffset: '0px',
    cursor: 'pointer',
  },
  selected: {
    outline: '1px solid #228be6',
    outlineOffset: '2px',
    cursor: 'pointer',
  },
  badge: {
    enabled: true,
    position: 'top-left',
    offset: {
      top: '-24px',
      left: '0',
    },
    background: '#228be6',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '12px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    zIndex: 10000,
  },
};

/**
 * Generate CSS from style configuration
 * 从样式配置生成CSS
 */
export function generateEditorCSS(config: EditorStyleConfig = defaultStyleConfig, enableMoveable: boolean | undefined, helperBox: boolean | undefined): string {
  const { hover, selected, badge } = config;
  const scope = '.html-visual-editor';

  let css = `
    ${scope} {
      position: relative;
    }

    ${scope} .hover-highlight {
      outline: ${helperBox ? 'none' : hover.outline} !important;
      outline-offset: ${hover.outlineOffset};
      // position: relative;
      cursor: ${hover.cursor};
      ${hover.backgroundColor ? `background-color: ${hover.backgroundColor} !important;` : ''}
    }

    ${scope} .selected-element {
      outline: ${enableMoveable || helperBox ? 'none' : selected.outline} !important;
      outline-offset: ${selected.outlineOffset};
      cursor: ${selected.cursor};
      // position: relative;
      ${selected.backgroundColor ? `background-color: ${selected.backgroundColor} !important;` : ''}
    }

    ${scope} [contenteditable="true"] {
      user-select: text;
      -webkit-font-smoothing: inherit !important;
      -moz-osx-font-smoothing: inherit !important;
      text-rendering: inherit !important;
    }

    ${scope} [contenteditable="true"]:focus {
      outline: ${enableMoveable || helperBox ? 'none' : selected.outline} !important;
      outline-offset: ${selected.outlineOffset};
      cursor: text !important;
    }

    ${scope} [contenteditable="true"]:empty:not(:focus)::before {
      content: attr(data-placeholder);
      color: #999;
    }

    .moveable-control-box>.moveable-line{
      background: #376CFF !important;
      height: 2px !important;
    }

    .moveable-control-box>.moveable-control:not(.moveable-e):not(.moveable-w){
      border: 2px solid #376CFF !important;
      background: #fff !important;
    }

    .moveable-control-box>.moveable-control.moveable-e{
      width: 10px !important;
      height: 22px !important;
      border-radius: 10px !important;
      margin-top: -11px !important;
      margin-left: -5px !important;
      border: 2px solid #376CFF !important;
      background: #fff !important;
    }
    .moveable-control-box>.moveable-control.moveable-w{
      width: 10px !important;
      height: 22px !important;
      border-radius: 7px !important;
      border: 2px solid #376CFF !important;
      background: #fff !important;
      margin-top: -11px !important;
      margin-left: -5px !important;
    }
  `;

  // 如果启用角标，添加 ::before 伪元素样式
  if (badge.enabled) {
    const badgePosition = getBadgePositionCSS(badge.position || 'top-left', badge.offset);
    css += `
    ${scope} #html-editor-helper-box::before {
      content: attr(data-element-type);
      position: absolute;
      ${badgePosition}
      background: ${badge.background};
      color: ${badge.color};
      padding: ${badge.padding};
      border-radius: ${badge.borderRadius};
      font-size: ${badge.fontSize};
      font-family: ${badge.fontFamily};
      white-space: nowrap;
      z-index: ${badge.zIndex};
    }}
    `;
  }

  return css;
}

/**
 * Get badge position CSS based on position type
 * 根据位置类型获取角标位置CSS
 */
function getBadgePositionCSS(
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  offset?: { top?: string; left?: string; right?: string; bottom?: string }
): string {
  const defaultOffset = offset || {};

  switch (position) {
    case 'top-left':
      return `
        top: ${defaultOffset.top || '-24px'};
        left: ${defaultOffset.left || '0'};
      `;
    case 'top-right':
      return `
        top: ${defaultOffset.top || '-24px'};
        right: ${defaultOffset.right || '0'};
      `;
    case 'bottom-left':
      return `
        bottom: ${defaultOffset.bottom || '-24px'};
        left: ${defaultOffset.left || '0'};
      `;
    case 'bottom-right':
      return `
        bottom: ${defaultOffset.bottom || '-24px'};
        right: ${defaultOffset.right || '0'};
      `;
    default:
      return `
        top: ${defaultOffset.top || '-24px'};
        left: ${defaultOffset.left || '0'};
      `;
  }
}

export default {
  defaultStyleConfig,
  generateEditorCSS,
};