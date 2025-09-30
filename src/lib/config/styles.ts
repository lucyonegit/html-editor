/**
 * Editor Styles Configuration
 * 编辑器样式配置
 */

export interface EditorStyleConfig {
  // Hover 样式配置
  hover: {
    outline?: string;
    outlineOffset?: string;
    cursor?: string;
    backgroundColor?: string;
  };
  // Focus/Selected 样式配置
  selected: {
    outline?: string;
    outlineOffset?: string;
    cursor?: string;
    backgroundColor?: string;
  };
  // 角标样式配置
  badge: {
    enabled?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    offset?: {
      top?: string;
      left?: string;
      right?: string;
      bottom?: string;
    };
    background?: string;
    color?: string;
    padding?: string;
    borderRadius?: string;
    fontSize?: string;
    fontFamily?: string;
    zIndex?: number;
  };
}

export const defaultStyleConfig: EditorStyleConfig = {
  hover: {
    outline: '2px dashed #4dabf7',
    outlineOffset: '2px',
    cursor: 'pointer',
  },
  selected: {
    outline: '2px solid #228be6',
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
export function generateEditorCSS(config: EditorStyleConfig = defaultStyleConfig): string {
  const { hover, selected, badge } = config;

  let css = `
    .html-visual-editor {
      position: relative;
    }

    .hover-highlight {
      outline: ${hover.outline} !important;
      outline-offset: ${hover.outlineOffset};
      position: relative;
      cursor: ${hover.cursor};
      ${hover.backgroundColor ? `background-color: ${hover.backgroundColor} !important;` : ''}
    }

    .selected-element {
      outline: ${selected.outline} !important;
      outline-offset: ${selected.outlineOffset};
      cursor: ${selected.cursor};
      ${selected.backgroundColor ? `background-color: ${selected.backgroundColor} !important;` : ''}
    }

    /* Contenteditable editing styles - prevent any layout changes */
    [contenteditable="true"] {
      user-select: text;
      /* Critical: prevent box model changes */
      /* Prevent font/text rendering changes */
      -webkit-font-smoothing: inherit !important;
      -moz-osx-font-smoothing: inherit !important;
      text-rendering: inherit !important;
    }

    [contenteditable="true"]:focus {
      outline: ${selected.outline} !important;
      outline-offset: ${selected.outlineOffset};
      cursor: text !important;
      /* Prevent any layout changes on focus */
    }

    /* Prevent height/width changes on contenteditable focus */
    [contenteditable="true"]:empty:not(:focus)::before {
      content: attr(data-placeholder);
      color: #999;
    }
  `;

  // 如果启用角标，添加 ::before 伪元素样式
  if (badge.enabled) {
    const badgePosition = getBadgePositionCSS(badge.position || 'top-left', badge.offset);

    css += `
    .hover-highlight::before {
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
    }
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