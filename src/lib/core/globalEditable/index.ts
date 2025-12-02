import { HTMLEditor } from '../editor';
import { createContentChangeCommand } from '../historyManager/commands';
import { MarkEngine } from '../markEngine';
import type { MarkSpec, MarkType } from '../markEngine';

export class GlobalEditable {
  private editor: HTMLEditor;
  private enabled: boolean = false;
  private lastRecorded: string = '';
  private handlers: { input?: (e: Event) => void; keydown?: (e: KeyboardEvent) => void; selectionchange?: () => void } = {};
  private lastRange: Range | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) return;
    if (enabled) this.enable(); else this.disable();
  }

  private getTarget(): HTMLElement {
    const doc = this.editor.getDoc();
    return doc.document.body as HTMLElement;
  }

  private attachBodyEditable(): void {
    const doc = this.editor.getDoc();
    const body = doc.document.body;
    if (!body) return;
    if (!body.hasAttribute('data-original-contenteditable')) {
      const original = body.getAttribute('contenteditable') || 'inherit';
      body.setAttribute('data-original-contenteditable', original);
    }
    doc.document.execCommand('defaultParagraphSeparator', false, 'br');
    body.setAttribute('contenteditable', 'true');
    body.focus();
  }

  private detachBodyEditable(): void {
    const doc = this.editor.getDoc();
    const body = doc.document.body;
    const original = body.getAttribute('data-original-contenteditable');
    if (original) {
      if (original === 'inherit') body.removeAttribute('contenteditable');
      else body.setAttribute('contenteditable', original);
      body.removeAttribute('data-original-contenteditable');
    } else {
      body.removeAttribute('contenteditable');
    }
  }

  private bindListeners(): void {
    const doc = this.editor.getDoc();
    const target = this.getTarget();
    this.lastRecorded = target.innerHTML;
    const onInput = () => {
      const after = target.innerHTML;
      if (this.editor.suppressBodyInputRecord) {
        this.lastRecorded = after;
        return;
      }
      if (this.editor.historyManager && after !== this.lastRecorded) {
        const cmd = createContentChangeCommand(target, this.lastRecorded, after);
        this.editor.historyManager.push(cmd);
        this.lastRecorded = after;
      }
      this.editor.emit('contentChange');
    };
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const selection = doc.document.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        const br = doc.document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        onInput();
      }
    };
    const onSelectionChange = () => {
      const sel = doc.document.getSelection();
      if (sel && sel.rangeCount > 0) {
        try {
          this.lastRange = sel.getRangeAt(0).cloneRange();
        } catch {}
      }
    };
    doc.document.body.addEventListener('input', onInput);
    doc.document.body.addEventListener('keydown', onKeydown);
    doc.document.addEventListener('selectionchange', onSelectionChange);
    this.handlers = { input: onInput, keydown: onKeydown, selectionchange: onSelectionChange };
  }

  private unbindListeners(): void {
    const doc = this.editor.getDoc();
    if (this.handlers.input) doc.document.body.removeEventListener('input', this.handlers.input);
    if (this.handlers.keydown) doc.document.body.removeEventListener('keydown', this.handlers.keydown);
    if (this.handlers.selectionchange) doc.document.removeEventListener('selectionchange', this.handlers.selectionchange);
    this.handlers = {};
    }

  private enable(): void {
    this.editor.clearSelection();
    this.editor.eventManager?.unbindAll();
    this.editor.moveableManager?.destroy();
    if (this.editor.options.helperBox && this.editor.helperBoxManager) {
      this.editor.helperBoxManager.visible(false);
    }
    this.attachBodyEditable();
    this.bindListeners();
    this.enabled = true;
  }

  private disable(): void {
    this.detachBodyEditable();
    this.unbindListeners();
    this.enabled = false;
    this.editor.eventManager?.bindAll();
  }

  private withContentHistory(fn: () => void): boolean {
    const target = this.getTarget();
    const before = target.innerHTML;
    this.editor.suppressBodyInputRecord = true;
    fn();
    const after = target.innerHTML;
    this.editor.suppressBodyInputRecord = false;
    if (this.editor.historyManager && before !== after) {
      const cmd = createContentChangeCommand(target, before, after);
      this.editor.historyManager.push(cmd);
    }
    this.lastRecorded = after;
    this.editor.emit('contentChange');
    return true;
  }

  private toggleMark(spec: MarkSpec): boolean {
    const ctx = this.editor.getDoc();
    const engine = new MarkEngine(ctx as any);
    let sel = ctx.document.getSelection();
    const restoreSelection = () => {
      if ((!sel || sel.rangeCount === 0 || sel.isCollapsed) && this.lastRange) {
        try {
          ctx.document.body.focus();
          const s = ctx.document.getSelection();
          s?.removeAllRanges();
          s?.addRange(this.lastRange);
        } catch {}
      }
    };
    restoreSelection();
    sel = ctx.document.getSelection();
    const isCollapsed = !sel || sel.rangeCount === 0 || sel.isCollapsed;
    if (!isCollapsed) {
      return this.withContentHistory(() => {
        const ok = engine.toggle(spec);
        if (!ok) {
          const map: Record<string, { cmd: string; value?: string }> = {
            bold: { cmd: 'bold' },
            italic: { cmd: 'italic' },
            underline: { cmd: 'underline' },
            strike: { cmd: 'strikethrough' },
            color: { cmd: 'foreColor', value: spec.value },
            background: { cmd: 'backColor', value: spec.value },
          };
          const f = map[spec.type as string];
          if (f) {
            try { ctx.document.execCommand(f.cmd, false, f.value); } catch {}
          }
        }
      });
    }
    const applyCollapsed = () => {
      const curSel = ctx.document.getSelection();
      if (!curSel || curSel.rangeCount === 0) return;
      const range = curSel.getRangeAt(0);
      const span = ctx.document.createElement('span');
      const set = (p: string, v?: string) => { if (v) span.style.setProperty(p, v); };
      switch (spec.type) {
        case 'bold': set('font-weight', 'bold'); break;
        case 'italic': set('font-style', 'italic'); break;
        case 'underline': set('text-decoration', 'underline'); break;
        case 'strike': set('text-decoration', 'line-through'); break;
        case 'color': set('color', spec.value); break;
        case 'background': set('background-color', spec.value); break;
        case 'fontSize': set('font-size', spec.value); break;
        case 'fontFamily': set('font-family', spec.value); break;
        case 'highlight': set('background-color', spec.value || 'yellow'); break;
        case 'code':
          set('font-family', 'monospace');
          set('background-color', '#f5f5f5');
          set('padding', '2px 4px');
          set('border-radius', '3px');
          break;
        case 'link':
          set('color', '#0066cc');
          set('text-decoration', 'underline');
          span.style.cursor = 'pointer';
          if (spec.attrs?.href) span.setAttribute('data-href', spec.attrs.href);
          break;
      }
      const zwsp = ctx.document.createTextNode('\u200B');
      span.appendChild(zwsp);
      range.insertNode(span);
      const newRange = ctx.document.createRange();
      newRange.setStart(span.firstChild as Text, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    };
    return this.withContentHistory(applyCollapsed);
  }


  private applyBlockStyle(property: string, value: string): boolean {
    const doc = this.editor.getDoc();
    let sel = doc.document.getSelection();
    if ((!sel || sel.rangeCount === 0 || sel.isCollapsed) && this.lastRange) {
      try {
        doc.document.body.focus();
        const s = doc.document.getSelection();
        s?.removeAllRanges();
        s?.addRange(this.lastRange);
        sel = s ?? sel;
      } catch {}
    }
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    let node: Node = range.commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentNode as Node;
    let el = node as HTMLElement;
    const view = doc.view as Window;
    while (el && el !== this.getTarget()) {
      const display = view.getComputedStyle(el).display;
      if (display !== 'inline') break;
      el = el.parentElement as HTMLElement;
    }
    if (!el) el = this.getTarget();
    el.style.setProperty(property, value);
    return true;
  }

  applySelectionBold(): boolean {
    return this.toggleMark({ type: 'bold' });
  }
  applySelectionItalic(): boolean {
    return this.toggleMark({ type: 'italic' });
  }
  applySelectionUnderline(): boolean {
    return this.toggleMark({ type: 'underline' });
  }
  applySelectionStrikeThrough(): boolean {
    return this.toggleMark({ type: 'strike' });
  }
  applySelectionFontSize(px: string): boolean {
    return this.toggleMark({ type: 'fontSize', value: px });
  }
  applySelectionFontFamily(name: string): boolean {
    return this.toggleMark({ type: 'fontFamily', value: name });
  }
  applySelectionColor(color: string): boolean {
    return this.toggleMark({ type: 'color', value: color });
  }
  applySelectionBackground(color: string): boolean {
    return this.toggleMark({ type: 'background', value: color });
  }
  applySelectionHighlight(color?: string): boolean {
    return this.toggleMark({ type: 'highlight', value: color });
  }
  applySelectionCode(): boolean {
    return this.toggleMark({ type: 'code' });
  }
  applySelectionLink(href: string): boolean {
    return this.toggleMark({ type: 'link', attrs: { href } });
  }
  applySelectionAlign(align: 'left' | 'center' | 'right'): boolean {
    return this.withContentHistory(() => { this.applyBlockStyle('text-align', align); });
  }

  clearSelectionFormat(): boolean {
    const ctx = this.editor.getDoc();
    const engine = new MarkEngine(ctx as any);
    return this.withContentHistory(() => { engine.clearFormat(); });
  }

  getActiveSelectionMarks(): Set<MarkType> {
    const ctx = this.editor.getDoc();
    const engine = new MarkEngine(ctx as any);
    return engine.getActiveMarks();
  }
}

export default GlobalEditable;
