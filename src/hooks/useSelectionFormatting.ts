import { useEffect, useState } from 'react';
import { HTMLEditor } from '../lib';

export interface SelectionFormatting {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikeThrough: boolean;
  color: string;
  backgroundColor: string;
  fontSize: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right' | 'start' | 'end' | 'justify' | string;
  collapsed: boolean;
}

export function useSelectionFormatting(editor: HTMLEditor | null): SelectionFormatting {
  const [state, setState] = useState<SelectionFormatting>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikeThrough: false,
    color: '',
    backgroundColor: 'transparent',
    fontSize: '',
    fontFamily: '',
    textAlign: 'left',
    collapsed: true,
  });

  useEffect(() => {
    if (!editor) return;
    const doc = editor.getDoc().document;
    const view = editor.getDoc().view;
    if (!doc || !view) return;

    const readFormatting = () => {
      const sel = doc.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setState({
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isStrikeThrough: false,
          color: '',
          backgroundColor: 'transparent',
          fontSize: '',
          fontFamily: '',
          textAlign: 'left',
          collapsed: true,
        });
        return;
      }
      const range = sel.getRangeAt(0);

      // Get all text nodes in the selection
      const textNodes: Node[] = [];
      const walker = doc.createTreeWalker(
        range.commonAncestorContainer.nodeType === Node.TEXT_NODE
          ? range.commonAncestorContainer.parentNode as Node
          : range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (range.intersectsNode(node)) {
          textNodes.push(node);
        }
      }

      // If no text nodes found, fall back to container
      if (textNodes.length === 0) {
        const container = range.commonAncestorContainer.nodeType === 1
          ? (range.commonAncestorContainer as HTMLElement)
          : (range.commonAncestorContainer.parentNode as HTMLElement);
        textNodes.push(container);
      }

      // Check if ALL text nodes have each style
      let isBold = true;
      let isItalic = true;
      let isUnderline = true;
      let isStrikeThrough = true;
      let color = '';
      let backgroundColor = '';
      let fontSize = '';
      let fontFamily = '';
      let textAlign: string = 'left';

      const toHex = (input: string): string => {
        const s = input.trim().toLowerCase();
        if (!s || s === 'transparent') return '';
        const m = s.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)$/);
        if (m) {
          const r = Math.max(0, Math.min(255, parseInt(m[1], 10)));
          const g = Math.max(0, Math.min(255, parseInt(m[2], 10)));
          const b = Math.max(0, Math.min(255, parseInt(m[3], 10)));
          const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
          if (a === 0) return '';
          const h = (n: number) => n.toString(16).padStart(2, '0');
          return `#${h(r)}${h(g)}${h(b)}`;
        }
        const hx = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
        if (hx) {
          if (hx[1].length === 3) {
            const r = hx[1][0];
            const g = hx[1][1];
            const b = hx[1][2];
            return `#${r}${r}${g}${g}${b}${b}`;
          }
          return s;
        }
        return '';
      };

      textNodes.forEach((node, index) => {
        const el = node.nodeType === Node.TEXT_NODE
          ? (node.parentNode as HTMLElement)
          : (node as HTMLElement);

        if (!el) return;

        const cs = view.getComputedStyle(el);

        // Check bold
        const fw = cs.fontWeight;
        const nodeBold = fw === 'bold' || parseInt(fw as any, 10) >= 600;
        if (!nodeBold) isBold = false;

        // Check italic
        const nodeItalic = cs.fontStyle === 'italic';
        if (!nodeItalic) isItalic = false;

        // Check underline and strikethrough
        const deco = cs.textDecorationLine || cs.textDecoration;
        const nodeUnderline = typeof deco === 'string' && deco.indexOf('underline') >= 0;
        const nodeStrikeThrough = typeof deco === 'string' && deco.indexOf('line-through') >= 0;
        if (!nodeUnderline) isUnderline = false;
        if (!nodeStrikeThrough) isStrikeThrough = false;

        // For color, fontSize, fontFamily - use first node's value
        if (index === 0) {
          color = toHex(cs.color);
          fontSize = cs.fontSize;
          fontFamily = cs.fontFamily;
        }
      });

      // Get block ancestor for textAlign and backgroundColor
      const container = range.commonAncestorContainer.nodeType === 1
        ? (range.commonAncestorContainer as HTMLElement)
        : (range.commonAncestorContainer.parentNode as HTMLElement);
      const el = container || doc.body;

      const getBlockAncestor = (el: HTMLElement | null) => {
        let cur: HTMLElement | null = el;
        while (cur && cur !== doc.body) {
          const display = view.getComputedStyle(cur).display;
          if (display !== 'inline') return cur;
          cur = cur.parentElement;
        }
        return doc.body as HTMLElement;
      };

      const block = getBlockAncestor(el);
      const bs = view.getComputedStyle(block);
      const cs = view.getComputedStyle(el);
      backgroundColor = toHex(bs.backgroundColor || cs.backgroundColor);
      textAlign = bs.textAlign as any;

      setState({
        isBold,
        isItalic,
        isUnderline,
        isStrikeThrough,
        color,
        backgroundColor,
        fontSize,
        fontFamily,
        textAlign,
        collapsed: false,
      });
    };

    const handler = () => readFormatting();
    doc.addEventListener('selectionchange', handler);
    doc.addEventListener('keyup', handler);
    doc.addEventListener('mouseup', handler);
    doc.body.addEventListener('htmleditor:historyChange', handler as EventListener);
    doc.body.addEventListener('htmleditor:contentChange', handler as EventListener);
    readFormatting();

    return () => {
      doc.removeEventListener('selectionchange', handler);
      doc.removeEventListener('keyup', handler);
      doc.removeEventListener('mouseup', handler);
      doc.body.removeEventListener('htmleditor:historyChange', handler as EventListener);
      doc.body.removeEventListener('htmleditor:contentChange', handler as EventListener);
    };
  }, [editor]);

  return state;
}

export default useSelectionFormatting;
