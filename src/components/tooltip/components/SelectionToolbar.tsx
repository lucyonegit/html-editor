import React from 'react';
import { HTMLEditor } from '../../../lib';
import { styles } from '../styles';
import type { SelectionFormatting } from '../../../hooks/useSelectionFormatting';

interface SelectionToolbarProps {
  editor: HTMLEditor;
  fmt: SelectionFormatting;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ editor, fmt }) => {
  const gm = editor.globalEditable as any;
  if (!editor || !gm || !fmt || fmt.collapsed) return null;

  const parsePx = (v: string) => {
    const n = parseInt(v || '16', 10);
    return isNaN(n) ? 16 : n;
  };

  return (
    <div style={styles.toolbar}>
      <div style={styles.section}>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => gm.applySelectionBold()}
            style={{ ...styles.iconButton, ...(fmt.isBold ? styles.iconButtonActive : {}) }}
            title="加粗"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => gm.applySelectionItalic()}
            style={{ ...styles.iconButton, ...(fmt.isItalic ? styles.iconButtonActive : {}) }}
            title="斜体"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => gm.applySelectionUnderline()}
            style={{ ...styles.iconButton, ...(fmt.isUnderline ? styles.iconButtonActive : {}) }}
            title="下划线"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => gm.applySelectionStrikeThrough()}
            style={{ ...styles.iconButton, ...(fmt.isStrikeThrough ? styles.iconButtonActive : {}) }}
            title="删除线"
          >
            S
          </button>
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <div style={styles.inputGroup}>
          <span style={styles.inputLabel}>A</span>
          <input
            type="number"
            value={parsePx(fmt.fontSize)}
            onChange={(e) => gm.applySelectionFontSize(`${e.target.value}px`)}
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
              value={fmt.color || '#000000'}
              onChange={(e) => gm.applySelectionColor(e.target.value)}
              style={styles.colorInput}
              title="文字颜色"
            />
            <span style={styles.colorLabel}>A</span>
          </div>
          <div style={styles.colorItem}>
            <input
              type="color"
              value={fmt.backgroundColor || '#ffffff'}
              onChange={(e) => gm.applySelectionBackground(e.target.value)}
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

      <div style={styles.section}>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => gm.applySelectionAlign('left')}
            style={{ ...styles.iconButton, ...(fmt.textAlign === 'left' ? styles.iconButtonActive : {}) }}
            title="左对齐"
          >
            L
          </button>
          <button
            onClick={() => gm.applySelectionAlign('center')}
            style={{ ...styles.iconButton, ...(fmt.textAlign === 'center' ? styles.iconButtonActive : {}) }}
            title="居中"
          >
            C
          </button>
          <button
            onClick={() => gm.applySelectionAlign('right')}
            style={{ ...styles.iconButton, ...(fmt.textAlign === 'right' ? styles.iconButtonActive : {}) }}
            title="右对齐"
          >
            R
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionToolbar;
