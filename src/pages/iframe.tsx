import React, { useRef, useState } from 'react';
import { useIframeMode } from '../hooks/useIframeMode';
import Tooltip from '../components/tooltip';
import { iframeContent } from './config';

const IframePage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [updatedSrcDoc, setUpdatedSrcDoc] = useState<string>('');

  const { editor, selectedElement, position,canRedo,canUndo,undo,redo } = useIframeMode(iframeRef, {
    onContentChange: (srcDoc: string) => {
      console.log('Iframe 内容已更新');
      setUpdatedSrcDoc(srcDoc);
    }
  });

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={undo} disabled={!canUndo} style={{marginRight: '8px'}}>撤销</button>
        <button onClick={redo} disabled={!canRedo}>重做</button>
        {/* <h2 style={styles.pageTitle}>Iframe 编辑器</h2>
        <p style={styles.description}>
          通过注入方式将编辑器注入到 iframe 中，实现对 iframe 内部元素的编辑。鼠标悬停高亮，点击选中后可进行编辑。
        </p> */}
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
          <h3 style={styles.debugTitle}>更新后的 srcDoc:</h3>
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
  },
  iframe: {
    width: '100%',
    height: '660px',
    outline: 'none',
    border:0
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