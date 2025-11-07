import React from 'react';
import { HTMLEditor } from '../../../lib';
import { styles } from '../styles';

interface ImageToolbarProps {
  editor: HTMLEditor;
  element: HTMLElement;
  onDelete: () => void;
}

export const ImageToolbar: React.FC<ImageToolbarProps> = ({ editor, element, onDelete }) => {
  if (!editor || !element) return null;

  const handleReplace = () => {
    const url = window.prompt('输入远程图片地址 URL');
    if (!url) return;
    editor.replaceImage(element, url);
  };

  const handleCopy = () => {
    editor.copyElement(element);
  };

  return (
    <div style={styles.toolbar}>
      <div style={styles.section}>
        <div style={styles.buttonGroup}>
          <button onClick={handleReplace} style={styles.iconButton} title="替换远程图片">
            🔗
          </button>
          <button onClick={handleCopy} style={styles.iconButton} title="复制">
            📄
          </button>
        </div>
      </div>
      <div style={styles.divider} />
      <button onClick={onDelete} style={styles.deleteButton} title="删除">
        🗑
      </button>
    </div>
  );
};