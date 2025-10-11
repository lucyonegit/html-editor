import { useEffect, useRef, useState, useCallback } from 'react';
import HTMLEditor, { Position, EditorStyleConfig } from '../lib/index';

interface UseInjectModeOptions {
  styleConfig?: EditorStyleConfig;
  onContentChange?: (srcDoc: string) => void;
}

interface UseInjectModeReturn {
  editor: HTMLEditor | null;
  selectedElement: HTMLElement | null;
  position: Position | null;
  injectScript: () => void;
}

export function useInjectMode(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  options?: UseInjectModeOptions
): UseInjectModeReturn {
  const editorRef = useRef<HTMLEditor | null>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<Position | null>(null);

  const injectScript = useCallback(() => {
    if (!iframeRef.current) return;

    const iframeDoc = iframeRef.current.contentWindow?.document;
    if (!iframeDoc) return;

    const targetContainer = iframeDoc.body;

    if (editorRef.current) {
      editorRef.current.destroy();
    }

    const editor = new HTMLEditor({
      styleConfig: options?.styleConfig,
      onElementSelect: (element: HTMLElement | null, pos?: Position) => {
        setSelectedElement(element);

        if (element && iframeRef.current && pos) {
          const iframeRect = iframeRef.current.getBoundingClientRect();
          const adjustedPosition = {
            top: pos.top + iframeRect.top + window.scrollY,
            left: pos.left + iframeRect.left + window.scrollX,
            width: pos.width,
            height: pos.height,
            bottom: pos.bottom + iframeRect.top + window.scrollY,
            right: pos.right + iframeRect.left + window.scrollX
          };
          setPosition(adjustedPosition);
        } else {
          setPosition(null);
        }
      },
      onStyleChange: (element: HTMLElement) => {
        debugger
        if (element && iframeRef.current) {
          const rect = element.getBoundingClientRect();
          const iframeRect = iframeRef.current.getBoundingClientRect();
          setPosition({
            top: rect.top + iframeRect.top + window.scrollY,
            left: rect.left + iframeRect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom + iframeRect.top + window.scrollY,
            right: rect.right + iframeRect.left + window.scrollX
          });

          // 触发内容变化回调
          if (options?.onContentChange) {
            const iframeDoc = iframeRef.current.contentWindow?.document;
            if (iframeDoc) {
              const srcDoc = iframeDoc.documentElement.outerHTML;
              options.onContentChange(srcDoc);
            }
          }
        }
      },
      onContentChange: () => {
        debugger
        // 触发内容变化回调
        if (options?.onContentChange && iframeRef.current) {
          const iframeDoc = iframeRef.current.contentWindow?.document;
          if (iframeDoc) {
            const srcDoc = iframeDoc.documentElement.outerHTML;
            options.onContentChange(srcDoc);
          }
        }
      }
    });

    editor.init(targetContainer);
    editorRef.current = editor;
  }, [iframeRef, options?.styleConfig]);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;

    const handleLoad = () => {
      setTimeout(() => {
        injectScript();
      }, 100);
    };

    if (iframe.contentWindow?.document.readyState === 'complete') {
      setTimeout(() => {
        injectScript();
      }, 100);
    } else {
      iframe.addEventListener('load', handleLoad);
    }

    return () => {
      iframe.removeEventListener('load', handleLoad);
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [iframeRef, injectScript, options?.styleConfig]);

  return {
    editor: editorRef.current,
    selectedElement,
    position,
    injectScript
  };
}

export default useInjectMode;