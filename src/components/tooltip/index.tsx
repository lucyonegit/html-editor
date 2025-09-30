import React from 'react';
import HTMLEditor from '../../lib/index';
import { TextToolbar } from './components/TextToolbar';
import { BlockToolbar } from './components/BlockToolbar';
import { ImageToolbar } from './components/ImageToolbar';
import { styles } from './styles';

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
  if (!editor || !element || !position || !editor.styleManager) return null;

  const isTextElement = editor.isTextElement(element);
  const isBlockElement = editor.isBlockElement(element);
  const isImageElement = editor.isImageElement(element);

  const handleDelete = () => {
    editor.deleteElement(element);
  };

  const tooltipStyle = {
    ...styles.container,
    top: `${position.bottom + 10}px`,
    left: `${position.left}px`,
  };

  return (
    <div style={tooltipStyle} className="floating-toolbar">
      {isTextElement && <TextToolbar editor={editor} element={element} onDelete={handleDelete} />}
      {isBlockElement && <BlockToolbar editor={editor} element={element} onDelete={handleDelete} />}
      {isImageElement && <ImageToolbar onDelete={handleDelete} />}
    </div>
  );
};

export default Tooltip;