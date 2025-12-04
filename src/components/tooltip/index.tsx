import React, { useRef } from 'react';
import { HTMLEditor } from '../../lib';
import { TextToolbar } from './components/TextToolbar';
import { BlockToolbar } from './components/BlockToolbar';
import { ImageToolbar } from './components/ImageToolbar';
import { styles } from './styles';
import { isTextElement, isBlockElement, isImageElement} from '../../lib/core/utils';
import { useToolbarPosition } from './hooks/useToolbarPosition';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const coords = useToolbarPosition(position, containerRef, { offset: 10, placement: 'bottom' });
  const tooltipStyle = {
    ...styles.container,
    top: `${coords?.top ?? position.bottom + 10}px`,
    left: `${coords?.left ?? position.left}px`,
  };

  return (
    <div style={tooltipStyle} className="floating-toolbar" ref={containerRef}>
      {isText && <TextToolbar editor={editor} element={element} onDelete={handleDelete} />}
      {isBlock && <BlockToolbar editor={editor} element={element} onDelete={handleDelete} />}
      {isImage && <ImageToolbar editor={editor} element={element} onDelete={handleDelete} />}
    </div>
  );
};

export default Tooltip;
