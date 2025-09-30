import React from 'react';
import HTMLEditor from '../lib/index';
import {
  useFontSize,
  useBackgroundColor,
  useTextColor,
  useBorderRadius,
  useBorder,
  useMargin,
} from '../hooks/useElementStyles';

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

interface TooltipProps {
  editor: HTMLEditor | null;
  element: HTMLElement | null;
  position: Position | null;
}

export const Tooltip: React.FC<TooltipProps> = ({ editor, element, position }) => {
  // 使用自定义 hooks 读取样式
  const [fontSize, setFontSize] = useFontSize(element);
  const [bgColor, setBgColor] = useBackgroundColor(element);
  const [textColor, setTextColor] = useTextColor(element);
  const [borderRadius, setBorderRadius] = useBorderRadius(element);
  const [border, setBorder] = useBorder(element);
  const [margin, setMargin] = useMargin(element);

  if (!editor || !element || !position || !editor.styleManager) return null;

  const styleManager = editor.styleManager;
  const isTextElement = editor.isTextElement(element);
  const isBlockElement = editor.isBlockElement(element);
  const isImageElement = editor.isImageElement(element);

  const handleDelete = () => {
    editor.deleteElement(element);
  };

  const renderTextTools = () => (
    <div style={styles.toolbar}>
      <div style={styles.group}>
        <label style={styles.label}>字体大小</label>
        <input
          type="number"
          value={fontSize}
          onChange={(e) => {
            const size = e.target.value;
            setFontSize(size);
            styleManager.changeFontSize(element, size + 'px');
          }}
          style={styles.input}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>背景色</label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => {
            setBgColor(e.target.value);
            styleManager.changeBackground(element, e.target.value);
          }}
          style={styles.colorInput}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>字体颜色</label>
        <input
          type="color"
          value={textColor}
          onChange={(e) => {
            setTextColor(e.target.value);
            styleManager.changeColor(element, e.target.value);
          }}
          style={styles.colorInput}
        />
      </div>

      <button
        onClick={() => styleManager.changeFontWeight(element, 'bold')}
        style={styles.button}
        title="加粗"
      >
        <strong>B</strong>
      </button>

      <button
        onClick={() => styleManager.changeFontStyle(element, 'italic')}
        style={styles.button}
        title="斜体"
      >
        <em>I</em>
      </button>

      <button
        onClick={() => styleManager.changeTextDecoration(element, 'underline')}
        style={styles.button}
        title="下划线"
      >
        <u>U</u>
      </button>

      <button
        onClick={handleDelete}
        style={{ ...styles.button, ...styles.deleteButton }}
        title="删除"
      >
        删除
      </button>
    </div>
  );

  const renderBlockTools = () => (
    <div style={styles.toolbar}>
      <div style={styles.group}>
        <label style={styles.label}>背景色</label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => {
            setBgColor(e.target.value);
            styleManager.changeBackground(element, e.target.value);
          }}
          style={styles.colorInput}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>圆角 ({borderRadius}px)</label>
        <input
          type="range"
          min="0"
          max="50"
          value={borderRadius}
          onChange={(e) => {
            setBorderRadius(e.target.value);
            styleManager.changeBorderRadius(element, e.target.value + 'px');
          }}
          style={styles.rangeInput}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>边框</label>
        <input
          type="text"
          placeholder="1px solid #000"
          value={border}
          onChange={(e) => {
            setBorder(e.target.value);
            styleManager.changeBorder(element, e.target.value);
          }}
          style={styles.input}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>边距</label>
        <input
          type="text"
          placeholder="10px"
          value={margin}
          onChange={(e) => {
            setMargin(e.target.value);
            styleManager.changeMargin(element, e.target.value);
          }}
          style={styles.input}
        />
      </div>

      <button
        onClick={handleDelete}
        style={{ ...styles.button, ...styles.deleteButton }}
        title="删除"
      >
        删除
      </button>
    </div>
  );

  const renderImageTools = () => (
    <div style={styles.toolbar}>
      <div style={styles.group}>
        <span style={styles.label}>图片编辑功能开发中</span>
      </div>
      <button
        onClick={handleDelete}
        style={{ ...styles.button, ...styles.deleteButton }}
        title="删除"
      >
        删除
      </button>
    </div>
  );

  const tooltipStyle = {
    ...styles.container,
    top: `${position.bottom + 10}px`,
    left: `${position.left}px`,
  };

  return (
    <div style={tooltipStyle} className="floating-toolbar">
      {isTextElement && renderTextTools()}
      {isBlockElement && renderBlockTools()}
      {isImageElement && renderImageTools()}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'absolute',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 10000,
    display: 'flex',
    gap: '8px',
    minWidth: '300px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
  },
  input: {
    padding: '4px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    width: '80px',
  },
  colorInput: {
    width: '40px',
    height: '30px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  rangeInput: {
    width: '80px',
  },
  button: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    height: '36px',
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
    color: '#fff',
    borderColor: '#ff4d4f',
  },
};

export default Tooltip;