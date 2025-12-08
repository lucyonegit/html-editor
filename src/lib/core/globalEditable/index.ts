import { HTMLEditor } from '../editor';
import { createContentChangeCommand } from '../historyManager/commands';
import { Editor } from './markEngine'
import type { MarkSpec } from './markEngine/type';

export class GlobalEditable {
  private editor: HTMLEditor;
  private enabled: boolean = false;
  private lastRecorded: string = '';
  private handlers: { input?: (e: Event) => void; keydown?: (e: KeyboardEvent) => void; selectionchange?: () => void } = {};

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

    doc.document.body.addEventListener('input', onInput);
    doc.document.body.addEventListener('keydown', onKeydown);
    this.handlers = { input: onInput, keydown: onKeydown };
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
    const engine = new Editor(ctx as any, { placeholder: '' });
    const action = () => engine.toggle(spec);
    return this.withContentHistory(action);
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

  /**
   * 设置文本对齐方式
   * @param alignment - 'left' | 'center' | 'right'
   */
  applySelectionAlign(alignment: 'left' | 'center' | 'right'): boolean {
    const ctx = this.editor.getDoc();
    const engine = new Editor(ctx as any, { placeholder: '' });
    const action = () => engine.align(alignment);
    return this.withContentHistory(action);
  }

  /**
   * 左对齐
   */
  applySelectionAlignLeft(): boolean {
    return this.applySelectionAlign('left');
  }

  /**
   * 居中对齐
   */
  applySelectionAlignCenter(): boolean {
    return this.applySelectionAlign('center');
  }

  /**
   * 右对齐
   */
  applySelectionAlignRight(): boolean {
    return this.applySelectionAlign('right');
  }

  /**
   * 查询当前段落的对齐方式
   * @returns 'left' | 'center' | 'right' | null
   */
  queryAlign(): 'left' | 'center' | 'right' | null {
    const ctx = this.editor.getDoc();
    const engine = new Editor(ctx as any, { placeholder: '' });
    return engine.queryAlign();
  }

  /**
   * 设置标题级别
   * @param level - 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' (普通段落)
   */
  setHeading(level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'): boolean {
    const ctx = this.editor.getDoc();
    const engine = new Editor(ctx as any, { placeholder: '' });
    const action = () => engine.setHeading(level);
    return this.withContentHistory(action);
  }

  /**
   * 查询当前标题级别
   * @returns 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | null
   */
  queryHeading(): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | null {
    const ctx = this.editor.getDoc();
    const engine = new Editor(ctx as any, { placeholder: '' });
    return engine.queryHeading();
  }

}

export default GlobalEditable;
