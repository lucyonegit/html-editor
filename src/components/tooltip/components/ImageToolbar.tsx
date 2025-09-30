import React from 'react';
import { styles } from '../styles';

interface ImageToolbarProps {
  onDelete: () => void;
}

export const ImageToolbar: React.FC<ImageToolbarProps> = ({ onDelete }) => {
  return (
    <div style={styles.toolbar}>
      <div style={styles.section}>
        <span style={styles.hint}>图片编辑功能开发中</span>
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