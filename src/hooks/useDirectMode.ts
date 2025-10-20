import { useEffect, useRef, useState } from 'react';
import {HTMLEditor, Position, EditorStyleConfig } from '../lib';

interface UseDirectModeOptions {
  styleConfig?: EditorStyleConfig;
}

interface UseDirectModeReturn {
  editor: HTMLEditor | null;
  selectedElement: HTMLElement | null;
  position: Position | null;
}

export function useDirectMode(
  containerRef: React.RefObject<HTMLElement>,
  options?: UseDirectModeOptions
): UseDirectModeReturn {
  const editorRef = useRef<HTMLEditor | null>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const targetContainer = containerRef.current;

    const editor = new HTMLEditor({
      styleConfig: options?.styleConfig,
      onElementSelect: (element: HTMLElement | null, pos?: Position) => {
        setSelectedElement(element);
        setPosition(pos || null);
      },
      onStyleChange: (element: HTMLElement) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          setPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom + window.scrollY,
            right: rect.right + window.scrollX
          });
        }
      }
    });

    editor.init(targetContainer);
    editorRef.current = editor;

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [containerRef, options?.styleConfig]);

  return {
    editor: editorRef.current,
    selectedElement,
    position
  };
}

export default useDirectMode;