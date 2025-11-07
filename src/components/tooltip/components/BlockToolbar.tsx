import React from 'react';
import { HTMLEditor } from '../../../lib';
import {
  useBackgroundColor,
  useBorderRadius,
  useBorder,
  useMargin,
} from '../hooks/useElementStyles';
import { styles } from '../styles';

interface BlockToolbarProps {
  editor: HTMLEditor;
  element: HTMLElement;
  onDelete: () => void;
}

export const BlockToolbar: React.FC<BlockToolbarProps> = ({ editor, element, onDelete }) => {
  const [bgColor, setBgColor] = useBackgroundColor(element);
  const [borderRadius, setBorderRadius] = useBorderRadius(element);
  const [border, setBorder] = useBorder(element);
  const [margin, setMargin] = useMargin(element);

  const styleManager = editor.styleManager;
  
  if (!editor || !element || !styleManager) return null;

  return (
    <div style={styles.toolbar}>
      <div style={styles.section}>
        <div style={styles.colorGroup}>
          <div style={styles.colorItem}>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value);
                editor.setChangingBackground(true);
                styleManager.changeBackground(element, e.target.value, false);
              }}
              onBlur={(e) => {
                editor.setChangingBackground(false);
                styleManager.changeBackground(element, e.target.value, true);
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

      <div style={styles.section}>
        <div style={styles.sliderGroup}>
          <span style={styles.sliderLabel}>⬜</span>
          <input
            type="range"
            min="0"
            max="50"
            value={borderRadius}
            onChange={(e) => {
              setBorderRadius(e.target.value);
              styleManager.changeBorderRadius(element, e.target.value + 'px', false);
            }}
            onMouseUp={() => {
              // 鼠标释放时触发 contentChange
              styleManager.changeBorderRadius(element, borderRadius + 'px', true);
            }}
            onTouchEnd={() => {
              // 触摸结束时触发 contentChange
              styleManager.changeBorderRadius(element, borderRadius + 'px', true);
            }}
            style={styles.rangeInput}
            title={`圆角 ${borderRadius}px`}
          />
          <span style={styles.sliderValue}>{borderRadius}</span>
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <div style={styles.inputGroup}>
          <span style={styles.inputLabel}>⬜</span>
          <input
            type="text"
            placeholder="1px solid #000"
            value={border}
            onChange={(e) => {
              setBorder(e.target.value);
              styleManager.changeBorder(element, e.target.value);
            }}
            style={styles.textInput}
            title="边框"
          />
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <div style={styles.inputGroup}>
          <span style={styles.inputLabel}>↔</span>
          <input
            type="text"
            placeholder="10px"
            value={margin}
            onChange={(e) => {
              setMargin(e.target.value);
              styleManager.changeMargin(element, e.target.value);
            }}
            style={styles.textInput}
            title="边距"
          />
        </div>
      </div>

      <div style={styles.divider} />

      {/* 复制与删除 */}
      <button
        onClick={() => editor.copyElement(element)}
        style={styles.iconButton}
        title="复制"
      >
        📋
      </button>
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