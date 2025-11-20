import type { HTMLEditor } from '../editor';

const editors = new Set<HTMLEditor>();
let lastActiveEditor: HTMLEditor | null = null;

export const EditorRegistry = {
  register(editor: HTMLEditor) {
    editors.add(editor);
    if (!lastActiveEditor) {
      lastActiveEditor = editor;
    }
  },
  unregister(editor: HTMLEditor) {
    editors.delete(editor);
    if (lastActiveEditor === editor) {
      lastActiveEditor = null;
    }
  },
  clearOthers(current: HTMLEditor) {
    editors.forEach(ed => {
      if (ed !== current) {
        ed.clearSelection();
      }
    });
    lastActiveEditor = current;
  },
  getAll() {
    return Array.from(editors);
  },

  hasActiveEditor() {
    return Array.from(editors).some(ed => ed.selectedElement);
  },
  getActiveEditor(): HTMLEditor | null {
    const activeBySelection = Array.from(editors).find(ed => ed.selectedElement);
    if (activeBySelection) return activeBySelection;
    return lastActiveEditor;
  },
  getGlobalUndoTarget(): HTMLEditor | null {
    let target: HTMLEditor | null = null;
    let maxTs = -1;
    editors.forEach(ed => {
      const hm = ed.historyManager;
      const ts = hm?.getTopUndoTimestamp?.();
      if (typeof ts === 'number' && hm?.canUndo?.()) {
        if (ts > maxTs) {
          maxTs = ts;
          target = ed;
        }
      }
    });
    return target;
  },
  getGlobalRedoTarget(): HTMLEditor | null {
    let target: HTMLEditor | null = null;
    let maxTs = -1;
    editors.forEach(ed => {
      const hm = ed.historyManager;
      const ts = hm?.getTopRedoTimestamp?.();
      if (typeof ts === 'number' && hm?.canRedo?.()) {
        if (ts > maxTs) {
          maxTs = ts;
          target = ed;
        }
      }
    });
    return target;
  },
  undo(): boolean {
    const target = this.getGlobalUndoTarget();
    return target ? target.undo() : false;
  },
  redo(): boolean {
    const target = this.getGlobalRedoTarget();
    return target ? target.redo() : false;
  },
  canUndo(): boolean {
    return Array.from(editors).some(ed => ed.historyManager?.canUndo());
  },
  canRedo(): boolean {
    return Array.from(editors).some(ed => ed.historyManager?.canRedo());
  }
};

export default EditorRegistry;