import React from 'react';
import { HTMLEditor } from '../../lib';
import { TextToolbar } from './components/TextToolbar';
import { BlockToolbar } from './components/BlockToolbar';
import { ImageToolbar } from './components/ImageToolbar';
import { styles } from './styles';
import { isTextElement, isBlockElement, isImageElement} from '../../lib/core/utils';

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

  const isText = isTextElement(element);
  const isBlock = isBlockElement(element);
  const isImage = isImageElement(element);

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
      {isText && <TextToolbar editor={editor} element={element} onDelete={handleDelete} />}
      {isBlock && <BlockToolbar editor={editor} element={element} onDelete={handleDelete} />}
      {isImage && <ImageToolbar onDelete={handleDelete} />}
    </div>
  );
};

export default Tooltip;