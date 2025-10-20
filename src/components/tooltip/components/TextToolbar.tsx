import React from 'react';
import { HTMLEditor } from '../../../lib';
import {
  useFontSize,
  useBackgroundColor,
  useTextColor,
  useFontWeight,
  useFontStyle,
  useTextDecoration,
} from '../hooks/useElementStyles';
import { styles } from '../styles';

interface TextToolbarProps {
  editor: HTMLEditor;
  element: HTMLElement;
  onDelete: () => void;
}

export const TextToolbar: React.FC<TextToolbarProps> = ({ editor, element, onDelete }) => {
  const [fontSize, setFontSize] = useFontSize(element);
  const [bgColor, setBgColor] = useBackgroundColor(element);
  const [textColor, setTextColor] = useTextColor(element);
  const isBold = useFontWeight(element);
  const isItalic = useFontStyle(element);
  const isUnderline = useTextDecoration(element);

  const styleManager = editor.styleManager;

  if (!editor || !element || !styleManager) return null;

  const handleToggleBold = () => {
    if (isBold) {
      styleManager.changeFontWeight(element, 'normal');
    } else {
      styleManager.changeFontWeight(element, 'bold');
    }
  };

  const handleToggleItalic = () => {
    if (isItalic) {
      styleManager.changeFontStyle(element, 'normal');
    } else {
      styleManager.changeFontStyle(element, 'italic');
    }
  };

  const handleToggleUnderline = () => {
    if (isUnderline) {
      styleManager.changeTextDecoration(element, 'none');
    } else {
      styleManager.changeTextDecoration(element, 'underline');
    }
  };

  return (
    <div style={styles.toolbar}>
      <div style={styles.section}>
        <div style={styles.buttonGroup}>
          <button
            onClick={handleToggleBold}
            style={{
              ...styles.iconButton,
              ...(isBold ? styles.iconButtonActive : {}),
            }}
            title="加粗 (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={handleToggleItalic}
            style={{
              ...styles.iconButton,
              ...(isItalic ? styles.iconButtonActive : {}),
            }}
            title="斜体 (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            onClick={handleToggleUnderline}
            style={{
              ...styles.iconButton,
              ...(isUnderline ? styles.iconButtonActive : {}),
            }}
            title="下划线 (Ctrl+U)"
          >
            <u>U</u>
          </button>
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <div style={styles.inputGroup}>
          <span style={styles.inputLabel}>A</span>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => {
              const size = e.target.value;
              setFontSize(size);
              styleManager.changeFontSize(element, size + 'px');
            }}
            style={styles.numberInput}
            min="8"
            max="72"
          />
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <div style={styles.colorGroup}>
          <div style={styles.colorItem}>
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                styleManager.changeColor(element, e.target.value);
              }}
              style={styles.colorInput}
              title="文字颜色"
            />
            <span style={styles.colorLabel}>A</span>
          </div>
          <div style={styles.colorItem}>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value);
                styleManager.changeBackground(element, e.target.value);
              }}
              style={styles.colorInput}
              title="背景色"
            />
            <span style={styles.colorLabel}>
              <div style={styles.bgIcon} />
            </span>
          </div>
        </div>
      </div>

      <div style={styles.divider} />

      <button
        onClick={onDelete}
        style={styles.deleteButton}
        title="删除"
      >
        🗑
      </button>
    </div>
  );
};