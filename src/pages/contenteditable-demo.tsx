import React, { useEffect, useRef, useState } from 'react';
import { useIframeMode } from '../hooks/useIframeMode';
import Tooltip from '../components/tooltip';
import { paperContent } from './paper';
import { useSelectionFormatting } from '../hooks/useSelectionFormatting';

const ContentEditableDemo: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { editor, selectedElement, position, canUndo, canRedo, undo, redo } = useIframeMode(iframeRef);
  const [globalOn, setGlobalOn] = useState(true);
  const [fontSize, setFontSize] = useState('18px');
  const [fontName, setFontName] = useState('Times New Roman');
  const [color, setColor] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');

  useEffect(() => {
    if (!editor) return;
    editor.setGlobalContentEditableEnabled(globalOn);
  }, [editor, globalOn]);

  const gm = editor?.globalEditable as any;
  const fmt = useSelectionFormatting(globalOn ? editor : null);

  useEffect(() => {
    if (!globalOn) return;
    if (!fmt) return;
    if (fmt.fontFamily) setFontName(fmt.fontFamily);
    if (fmt.fontSize) setFontSize(fmt.fontSize);
    if (fmt.color) setColor(fmt.color);
    if (fmt.backgroundColor) setBg(fmt.backgroundColor);
  }, [fmt, globalOn]);

  return (
    <div style={styles.page}>
      <div style={styles.headerBar} className="html-editor-toolbar">
        <button style={styles.iconBtn} onClick={() => setGlobalOn(!globalOn)}>
          {globalOn ? '关闭文字编辑' : '开启文字编辑'}
        </button>
        <div style={{ marginLeft: 12 }}>
          <select
            value={fontName}
            onChange={(e) => {
              setFontName(e.target.value);
              if (globalOn) gm?.applySelectionFontFamily(e.target.value);
            }}
            style={styles.select}
          >
            <option>Times New Roman</option>
            <option>Arial</option>
            <option>Georgia</option>
            <option>Courier New</option>
          </select>
        </div>
        <div style={{ marginLeft: 8 }}>
          <input
            type="number"
            min={8}
            max={72}
            value={parseInt(fontSize)}
            onChange={(e) => {
              const px = `${e.target.value}px`;
              setFontSize(px);
              if (globalOn) gm?.applySelectionFontSize(px);
            }}
            style={styles.numberInput}
          />
        </div>
        <div style={{ marginLeft: 8 }}>
          <button style={{...styles.iconBtn, background: (!fmt.collapsed && fmt.isBold) ? '#e6f4ff' : '#fff'}} onClick={() => (globalOn ? gm?.applySelectionBold() : editor?.styleManager?.changeFontWeight(selectedElement, 'bold'))}>B</button>
          <button style={{...styles.iconBtn, background: (!fmt.collapsed && fmt.isItalic) ? '#e6f4ff' : '#fff'}} onClick={() => (globalOn ? gm?.applySelectionItalic() : editor?.styleManager?.changeFontStyle(selectedElement, 'italic'))}>I</button>
          <button style={{...styles.iconBtn, background: (!fmt.collapsed && fmt.isUnderline) ? '#e6f4ff' : '#fff'}} onClick={() => (globalOn ? gm?.applySelectionUnderline() : editor?.styleManager?.changeTextDecoration(selectedElement, 'underline'))}>U</button>
          <button style={{...styles.iconBtn, background: (!fmt.collapsed && fmt.isStrikeThrough) ? '#e6f4ff' : '#fff'}} onClick={() => (globalOn ? gm?.applySelectionStrikeThrough() : editor?.styleManager?.changeTextDecoration(selectedElement, 'line-through'))}>S</button>
        </div>
        <div style={{ marginLeft: 8 }}>
          <input type="color" value={color} onChange={(e) => { setColor(e.target.value); globalOn ? gm?.applySelectionColor(e.target.value) : editor?.styleManager?.changeColor(selectedElement, e.target.value); }} />
        </div>
        <div style={{ marginLeft: 8 }}>
          <input type="color" value={bg} onChange={(e) => { setBg(e.target.value); globalOn ? gm?.applySelectionBackground(e.target.value) : editor?.styleManager?.changeBackground(selectedElement, e.target.value); }} />
        </div>
        <div style={{ marginLeft: 8 }}>
          <button style={{...styles.iconBtn, background: (!fmt.collapsed && fmt.textAlign==='left')?'#e6f4ff':'#fff'}} onClick={() => (globalOn ? gm?.applySelectionAlign('left') : editor?.styleManager?.changeTextAlign(selectedElement, 'left'))}>左</button>
          <button style={{...styles.iconBtn, background: (!fmt.collapsed && fmt.textAlign==='center')?'#e6f4ff':'#fff'}} onClick={() => (globalOn ? gm?.applySelectionAlign('center') : editor?.styleManager?.changeTextAlign(selectedElement, 'center'))}>中</button>
          <button style={{...styles.iconBtn, background: (!fmt.collapsed && fmt.textAlign==='right')?'#e6f4ff':'#fff'}} onClick={() => (globalOn ? gm?.applySelectionAlign('right') : editor?.styleManager?.changeTextAlign(selectedElement, 'right'))}>右</button>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button style={styles.iconBtn} onClick={undo} disabled={!canUndo}>撤销</button>
          <button style={styles.iconBtn} onClick={redo} disabled={!canRedo}>重做</button>
        </div>
      </div>

      <div style={styles.editorWrapper}>
        <iframe
          ref={iframeRef}
          srcDoc={paperContent}
          style={styles.iframe}
          title="Contenteditable Iframe Demo"
        />
      </div>

      {!globalOn && editor && (
        <Tooltip editor={editor} element={selectedElement} position={position} />
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: { width: '100%', maxWidth: '1200px', margin: '0 auto' },
  headerBar: {
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 10,
    padding: '8px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: { padding: '6px 10px', border: '1px solid #ddd', background: '#fff', borderRadius: 4, cursor: 'pointer' },
  select: { padding: '6px', border: '1px solid #ddd', borderRadius: 4 },
  numberInput: { width: 60, padding: '6px', border: '1px solid #ddd', borderRadius: 4 },
  editorWrapper: { backgroundColor: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  iframe: { width: '100%', height: 960, outline: 'none', border: 0 },
};

export default ContentEditableDemo;
