import React, { useRef, useState } from 'react';
import { useInjectMode } from '../hooks/useInjectMode';
import Tooltip from '../components/tooltip';

const IframePage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [updatedSrcDoc, setUpdatedSrcDoc] = useState<string>('');

  const { editor, selectedElement, position } = useInjectMode(iframeRef, {
    onContentChange: (srcDoc: string) => {
      console.log('Iframe 内容已更新');
      setUpdatedSrcDoc(srcDoc);
    }
  });

  const iframeContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Iframe 编辑器</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background-color: #1a1f2e;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
    }
    h1 {
      font-size: 32px;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px dashed #4dabf7;
    }
    .text-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .icon {
      font-size: 24px;
    }
    .sample-text {
      font-size: 20px;
      font-weight: 600;
    }
    p {
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 32px;
      padding: 16px;
      background: rgba(74, 171, 247, 0.1);
      border-left: 4px solid #4dabf7;
    }
    .practice-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .practice-title {
      font-size: 20px;
      font-weight: 600;
      color: #51cf66;
    }
    .advice-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .advice-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .bullet {
      color: #51cf66;
      font-size: 20px;
    }
  </style>
</head>
<body>
  <h1>技能转型与能力构建</h1>

  <div class="text-section">
    <span class="icon">📘</span>
    <span class="sample-text">文本</span>
  </div>

  <p>
    逻辑 = 专业深度：十年技术积累是宝贵的财富，是解决复杂问题的基石。
  </p>

  <div class="practice-section">
    <span class="icon">🎯</span>
    <span class="practice-title">实战建议</span>
  </div>

  <div class="advice-list">
    <div class="advice-item">
      <span class="bullet">●</span>
      <span>基础筑基：掌握Prompt Engineering，理解模型原理。</span>
    </div>

    <div class="advice-item">
      <span class="bullet">●</span>
      <span>核心突破：学习Fine-tuning，将模型与业务场景结合。</span>
    </div>

    <div class="advice-item">
      <span class="bullet">●</span>
      <span>高阶实践：探索RAG、Agent等前沿应用，构建竞争壁垒。</span>
    </div>
  </div>
</body>
  </html>`;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>Iframe 编辑器</h2>
        <p style={styles.description}>
          通过注入方式将编辑器注入到 iframe 中，实现对 iframe 内部元素的编辑。鼠标悬停高亮，点击选中后可进行编辑。
        </p>
      </div>

      <div style={styles.editorWrapper}>
        <iframe
          ref={iframeRef}
          srcDoc={iframeContent}
          style={styles.iframe}
          title="Iframe Editor"
        />
      </div>

      {updatedSrcDoc && (
        <div style={styles.debugPanel}>
          <h3 style={styles.debugTitle}>更新后的 srcDoc (前500字符):</h3>
          <pre style={styles.debugContent}>
            {updatedSrcDoc}
          </pre>
        </div>
      )}

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
  iframe: {
    width: '100%',
    height: '600px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
  },
  debugPanel: {
    marginTop: '24px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e0e0e0',
  },
  debugTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  },
  debugContent: {
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#fff',
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '200px',
    border: '1px solid #e0e0e0',
  },
};

export default IframePage;