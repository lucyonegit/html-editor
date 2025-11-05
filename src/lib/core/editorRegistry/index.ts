import type { HTMLEditor } from '../editor';

const editors = new Set<HTMLEditor>();

export const EditorRegistry = {
  register(editor: HTMLEditor) {
    editors.add(editor);
  },
  unregister(editor: HTMLEditor) {
    editors.delete(editor);
  },
  clearOthers(current: HTMLEditor) {
    editors.forEach(ed => {
      if (ed !== current) {
        ed.clearSelection();
      }
    });
  },
  getAll() {
    return Array.from(editors);
  },

  hasActiveEditor() {
    return Array.from(editors).some(ed => ed.selectedElement);
  }
};

export default EditorRegistry;