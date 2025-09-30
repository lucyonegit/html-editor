import React, { useRef } from 'react';
import { useDirectMode } from '../hooks/useDirectMode';
import Tooltip from '../components/tooltip';

const ReactDomPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { editor, selectedElement, position } = useDirectMode(containerRef);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>React DOM 编辑器</h2>
        <p style={styles.description}>
          通过 React ref 直接编辑 DOM 元素。鼠标悬停高亮，点击选中后可进行编辑。
        </p>
      </div>

      <div style={styles.editorWrapper}>
        <div ref={containerRef} style={styles.editorContainer}>
          <h1 style={styles.sampleTitle}>技能转型与能力构建</h1>

          <div style={styles.textSection}>
            <span style={styles.icon}>📘</span>
            <span style={styles.sampleText}>文本</span>
          </div>

          <p style={styles.sampleParagraph}>
            逻辑 = 专业深度：十年技术积累是宝贵的财富，是解决复杂问题的基石。
          </p>

          <div style={styles.practiceSection}>
            <span style={styles.practiceIcon}>🎯</span>
            <span style={styles.practiceTitle}>实战建议</span>
          </div>

          <div style={styles.adviceList}>
            <div style={styles.adviceItem}>
              <span style={styles.bullet}>●</span>
              <span style={styles.adviceText}>
                基础筑基：掌握Prompt Engineering，理解模型原理。
              </span>
            </div>

            <div style={styles.adviceItem}>
              <span style={styles.bullet}>●</span>
              <span style={styles.adviceText}>
                核心突破：学习Fine-tuning，将模型与业务场景结合。
              </span>
            </div>

            <div style={styles.adviceItem}>
              <span style={styles.bullet}>●</span>
              <span style={styles.adviceText}>
                高阶实践：探索RAG、Agent等前沿应用，构建竞争壁垒。
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <Tooltip editor={editor} element={selectedElement} position={position} />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  description: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
  },
  editorWrapper: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  editorContainer: {
    minHeight: '500px',
    padding: '20px',
    backgroundColor: '#1a1f2e',
    borderRadius: '4px',
    color: '#fff',
  },
  sampleTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '2px dashed #4dabf7',
  },
  textSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  icon: {
    fontSize: '24px',
  },
  sampleText: {
    fontSize: '20px',
    fontWeight: '600',
  },
  sampleParagraph: {
    fontSize: '16px',
    lineHeight: '1.8',
    marginBottom: '32px',
    padding: '16px',
    backgroundColor: 'rgba(74, 171, 247, 0.1)',
    borderLeft: '4px solid #4dabf7',
  },
  practiceSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  practiceIcon: {
    fontSize: '24px',
  },
  practiceTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#51cf66',
  },
  adviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  adviceItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  bullet: {
    color: '#51cf66',
    fontSize: '20px',
    lineHeight: '1.6',
  },
  adviceText: {
    fontSize: '16px',
    lineHeight: '1.6',
    flex: 1,
  },
};

export default ReactDomPage;