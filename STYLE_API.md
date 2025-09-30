# 样式配置 API 文档

## 概述

HTML Visual Editor 提供了完整的样式配置 API，允许你自定义 hover 样式、focus 样式和角标样式。同时支持 contenteditable 功能，让用户可以直接编辑选中的元素。

## 导入

```typescript
import HTMLEditor, { EditorStyleConfig, defaultStyleConfig } from './lib/index';
```

## 接口定义

### EditorStyleConfig

```typescript
interface EditorStyleConfig {
  // Hover 样式配置
  hover: {
    outline?: string;           // 轮廓线样式，例如: '2px dashed #4dabf7'
    outlineOffset?: string;     // 轮廓线偏移，例如: '2px'
    cursor?: string;            // 鼠标指针样式，例如: 'pointer'
    backgroundColor?: string;   // 背景色（可选）
  };

  // Focus/Selected 样式配置
  selected: {
    outline?: string;           // 轮廓线样式，例如: '2px solid #228be6'
    outlineOffset?: string;     // 轮廓线偏移
    cursor?: string;            // 鼠标指针样式
    backgroundColor?: string;   // 背景色（可选）
  };

  // 角标样式配置
  badge: {
    enabled?: boolean;          // 是否启用角标，默认: true
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    offset?: {
      top?: string;
      left?: string;
      right?: string;
      bottom?: string;
    };
    background?: string;        // 背景色，例如: '#228be6'
    color?: string;             // 文字颜色，例如: 'white'
    padding?: string;           // 内边距，例如: '2px 8px'
    borderRadius?: string;      // 圆角，例如: '3px'
    fontSize?: string;          // 字体大小，例如: '12px'
    fontFamily?: string;        // 字体，例如: 'system-ui, -apple-system, sans-serif'
    zIndex?: number;            // 层级，例如: 10000
  };
}
```

## ContentEditable 功能

编辑器默认启用 contenteditable 功能，当用户点击选中元素时，元素会自动变为可编辑状态。

### 配置选项

```typescript
interface HTMLEditorOptions {
  enableContentEditable?: boolean; // 是否启用contenteditable编辑，默认: true
}
```

### 启用/禁用 ContentEditable

```typescript
// 启用 (默认)
const editor = new HTMLEditor({
  container: '#editor',
  enableContentEditable: true
});

// 禁用
const editor = new HTMLEditor({
  container: '#editor',
  enableContentEditable: false
});
```

### 工作原理

1. **选中元素**：用户点击元素时，元素被选中并自动设置 `contenteditable="true"`
2. **直接编辑**：元素获得焦点，用户可以直接输入文本进行编辑
3. **再次点击**：点击已选中的可编辑元素时，可以定位光标位置
4. **取消选择**：点击其他元素或容器外部时，移除 contenteditable 属性

### 事件监听

```typescript
const editor = new HTMLEditor({
  container: '#editor',
  onContentChange: () => {
    console.log('内容已修改:', editor.getContent());
  }
});
```

## 使用示例

### 1. 使用默认配置

```typescript
const editor = new HTMLEditor({
  container: '#editor'
});
editor.init();
```

### 2. 自定义 Hover 样式

```typescript
const editor = new HTMLEditor({
  container: '#editor',
  styleConfig: {
    hover: {
      outline: '3px dotted #ff6b6b',
      outlineOffset: '4px',
      cursor: 'crosshair'
    }
  }
});
editor.init();
```

### 3. 自定义 Focus 样式

```typescript
const editor = new HTMLEditor({
  container: '#editor',
  styleConfig: {
    selected: {
      outline: '3px solid #51cf66',
      outlineOffset: '2px',
      backgroundColor: 'rgba(81, 207, 102, 0.1)'
    }
  }
});
editor.init();
```

### 4. 自定义角标样式

```typescript
const editor = new HTMLEditor({
  container: '#editor',
  styleConfig: {
    badge: {
      enabled: true,
      position: 'top-right',
      offset: {
        top: '-28px',
        right: '0'
      },
      background: '#ff6b6b',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '14px'
    }
  }
});
editor.init();
```

### 5. 禁用角标

```typescript
const editor = new HTMLEditor({
  container: '#editor',
  styleConfig: {
    badge: {
      enabled: false
    }
  }
});
editor.init();
```

### 6. 完整自定义配置

```typescript
const customConfig: EditorStyleConfig = {
  hover: {
    outline: '2px dashed #845ef7',
    outlineOffset: '3px',
    cursor: 'pointer'
  },
  selected: {
    outline: '3px solid #845ef7',
    outlineOffset: '3px',
    cursor: 'move',
    backgroundColor: 'rgba(132, 94, 247, 0.05)'
  },
  badge: {
    enabled: true,
    position: 'bottom-left',
    offset: {
      bottom: '-30px',
      left: '0'
    },
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'monospace',
    zIndex: 9999
  }
};

const editor = new HTMLEditor({
  container: '#editor',
  styleConfig: customConfig
});
editor.init();
```

## React Hooks 中使用

### useDirectMode

```typescript
import { useDirectMode } from './hooks/useDirectMode';

function MyComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { editor, selectedElement, position } = useDirectMode(containerRef, {
    styleConfig: {
      hover: {
        outline: '2px dashed #ff6b6b'
      },
      badge: {
        enabled: true,
        position: 'top-right'
      }
    }
  });

  return <div ref={containerRef}>...</div>;
}
```

### useInjectMode

```typescript
import { useInjectMode } from './hooks/useInjectMode';

function MyComponent() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { editor, selectedElement, position } = useInjectMode(iframeRef, {
    styleConfig: {
      selected: {
        outline: '3px solid #51cf66'
      },
      badge: {
        background: '#51cf66'
      }
    }
  });

  return <iframe ref={iframeRef} srcDoc="..." />;
}
```

## 默认配置

```typescript
const defaultStyleConfig: EditorStyleConfig = {
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
```

## 高级技巧

### 主题预设

你可以创建主题预设来快速切换样式：

```typescript
// themes.ts
export const lightTheme: EditorStyleConfig = {
  hover: { outline: '2px dashed #4dabf7' },
  selected: { outline: '2px solid #228be6' },
  badge: { background: '#228be6', color: 'white' }
};

export const darkTheme: EditorStyleConfig = {
  hover: { outline: '2px dashed #ffa94d' },
  selected: { outline: '2px solid #ff922b' },
  badge: { background: '#ff922b', color: '#000' }
};

export const minimalTheme: EditorStyleConfig = {
  hover: { outline: '1px solid #adb5bd' },
  selected: { outline: '2px solid #495057' },
  badge: { enabled: false }
};
```

使用主题：

```typescript
import { darkTheme } from './themes';

const editor = new HTMLEditor({
  container: '#editor',
  styleConfig: darkTheme
});
```

## 注意事项

1. 所有样式配置都是可选的，未配置的部分会使用默认值
2. 角标使用 CSS `::before` 伪元素和 `attr(data-element-type)` 实现
3. 样式会自动注入到目标文档中（包括 iframe）
4. 如果需要更细粒度的控制，可以直接使用 `generateEditorCSS()` 函数生成 CSS 字符串