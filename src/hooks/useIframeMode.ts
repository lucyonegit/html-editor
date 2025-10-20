import { useEffect, useRef, useState } from 'react';
import { HTMLEditor, Position, EditorStyleConfig } from '../lib/index';

interface UseInjectModeOptions {
  styleConfig?: EditorStyleConfig;
  onContentChange?: (srcDoc: string) => void;
}

interface UseInjectModeReturn {
  editor: HTMLEditor | null;
  selectedElement: HTMLElement | null;
  position: Position | null;
  injectScript: (targetContainer: HTMLElement) => Promise<void>;
}

const waitForIframeReady = (iframe: HTMLIFrameElement, timeout = 5000): Promise<void> => {
  return new Promise((resolve) => {
    const start = performance.now();

    const tryAttach = () => {
      const doc = iframe.contentDocument;
      if (!doc) {
        if (performance.now() - start > timeout) return resolve();
        return requestAnimationFrame(tryAttach);
      }

      // 如果已经 complete，直接 resolve
      if (doc.readyState === 'complete') {
        return resolve();
      }

      let stableTimer: any;
      const observer = new MutationObserver(() => {
        clearTimeout(stableTimer);
        stableTimer = setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 800);
      });

      observer.observe(doc.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      // 超时保护
      setTimeout(() => {
        observer.disconnect();
        clearTimeout(stableTimer);
        resolve();
      }, timeout);

      // 同时监听 readyState
      const checkReady = () => {
        if (doc.readyState === 'complete') {
          observer.disconnect();
          clearTimeout(stableTimer);
          resolve();
        } else if (performance.now() - start < timeout) {
          requestAnimationFrame(checkReady);
        }
      };
      checkReady();
    };

    tryAttach();
  });
};


export function useIframeMode(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  options?: UseInjectModeOptions
): UseInjectModeReturn {
  const editorRef = useRef<HTMLEditor | null>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<Position | null>(null);

  const injectScript = async (targetContainer: HTMLElement) => {
    if (!targetContainer) return;
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
        }
      },
      onContentChange: () => {
        // 触发内容变化回调
        if (options?.onContentChange && iframeRef.current) {
          const iframeDoc = iframeRef.current.contentWindow?.document;
          if (iframeDoc) {
            const srcDoc = iframeDoc.documentElement.outerHTML;
            options.onContentChange(srcDoc);
          }
        }
      },
      enableMoveable: true,
    });
    editor.init(targetContainer);
    editorRef.current = editor;
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = async () => {
      const doc = iframe.contentDocument!;
      console.time('useIframeMode');
      await waitForIframeReady(iframe);
      console.timeEnd('useIframeMode');
      console.log('编辑器加载完成', doc);
      injectScript(doc.body);
    }
    iframe.addEventListener('load', onLoad);
    return () => {
      iframe.removeEventListener('load', onLoad);
    }
  },[])

  return {
    editor: editorRef.current,
    selectedElement,
    position,
    injectScript
  };
}

export default useIframeMode;