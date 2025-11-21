import { HTMLEditor } from '../editor';
import { createContentChangeCommand } from '../historyManager/commands';

export class GlobalEditable {
  private editor: HTMLEditor;
  private enabled: boolean = false;
  private lastRecorded: string = '';
  private handlers: { input?: (e: Event) => void; keydown?: (e: KeyboardEvent) => void } = {};

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
    return (this.editor.container ?? doc.document.body) as HTMLElement;
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
    doc.document.body.addEventListener('input', onInput);
    doc.document.body.addEventListener('keydown', onKeydown);
    this.handlers = { input: onInput, keydown: onKeydown };
  }

  private unbindListeners(): void {
    const doc = this.editor.getDoc();
    if (this.handlers.input) doc.document.body.removeEventListener('input', this.handlers.input);
    if (this.handlers.keydown) doc.document.body.removeEventListener('keydown', this.handlers.keydown);
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
    fn();
    const after = target.innerHTML;
    if (this.editor.historyManager && before !== after) {
      const cmd = createContentChangeCommand(target, before, after);
      this.editor.historyManager.push(cmd);
    }
    this.editor.emit('contentChange');
    return true;
  }

  private wrapSelectionWithSpan(style: Record<string, string>): boolean {
    const doc = this.editor.getDoc();
    const sel = doc.document.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
    const range = sel.getRangeAt(0);
    const span = doc.document.createElement('span');
    Object.entries(style).forEach(([k, v]) => span.style.setProperty(k, v));
    const frag = range.extractContents();
    span.appendChild(frag);
    range.insertNode(span);
    sel.removeAllRanges();
    const newRange = doc.document.createRange();
    newRange.setStartAfter(span);
    newRange.collapse(true);
    sel.addRange(newRange);
    return true;
  }

  applySelectionBold(): boolean {
    const doc = this.editor.getDoc();
    return this.withContentHistory(() => { doc.document.execCommand('bold'); });
  }
  applySelectionItalic(): boolean {
    const doc = this.editor.getDoc();
    return this.withContentHistory(() => { doc.document.execCommand('italic'); });
  }
  applySelectionUnderline(): boolean {
    const doc = this.editor.getDoc();
    return this.withContentHistory(() => { doc.document.execCommand('underline'); });
  }
  applySelectionStrikeThrough(): boolean {
    const doc = this.editor.getDoc();
    return this.withContentHistory(() => { doc.document.execCommand('strikeThrough'); });
  }
  applySelectionFontSize(px: string): boolean {
    return this.withContentHistory(() => { this.wrapSelectionWithSpan({ 'font-size': px }); });
  }
  applySelectionFontFamily(name: string): boolean {
    return this.withContentHistory(() => { this.wrapSelectionWithSpan({ 'font-family': name }); });
  }
  applySelectionColor(color: string): boolean {
    const doc = this.editor.getDoc();
    return this.withContentHistory(() => {
      if (!doc.document.execCommand('foreColor', false, color)) {
        this.wrapSelectionWithSpan({ color });
      }
    });
  }
  applySelectionBackground(color: string): boolean {
    const doc = this.editor.getDoc();
    return this.withContentHistory(() => {
      if (!doc.document.execCommand('backColor', false, color)) {
        this.wrapSelectionWithSpan({ 'background-color': color });
      }
    });
  }
  applySelectionAlign(align: 'left' | 'center' | 'right'): boolean {
    const doc = this.editor.getDoc();
    return this.withContentHistory(() => {
      if (align === 'left') doc.document.execCommand('justifyLeft');
      if (align === 'center') doc.document.execCommand('justifyCenter');
      if (align === 'right') doc.document.execCommand('justifyRight');
    });
  }
}

export default GlobalEditable;