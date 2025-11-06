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
      helperBox: false, // 启用 helperBox
      enableMoveable: false,
      onElementSelect: (element: HTMLElement | null, pos?: Position) => {
        setSelectedElement(element);
        const rect = targetContainer!.getBoundingClientRect();
        console.log('选中元素', element, pos,rect);
        if(!pos) return;
        setPosition({
            top: pos.top + rect.top,
            left: pos.left + rect.left,
            width: pos.width,
            height: pos.height,
            bottom: pos.bottom + rect.top,
            right: pos.right + rect.left
          });
      },
      onStyleChange: () => {
        // if (element) {
        //   const rect = element.getBoundingClientRect();
        //   setPosition({
        //     top: rect.top + rect.top,
        //     left: rect.left + rect.left,
        //     width: rect.width,
        //     height: rect.height,
        //     bottom: rect.bottom + rect.top,
        //     right: rect.right + rect.left
        //   });
        // }
      }
    });

    editor.init(targetContainer);
    console.log('初始化编辑器');
    editorRef.current = editor;

    return () => {
      if (editorRef.current) {
        console.log('销毁编辑器');
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