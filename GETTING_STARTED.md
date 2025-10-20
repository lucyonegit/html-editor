# ✨ HistoryManager - 快速开始指南

## 🎯 一分钟上手

你的编辑器现在已经内置了完整的 Undo/Redo 功能！无需任何额外配置，**默认就已启用**。

## 📦 最简使用（零配置）

```typescript
import { HTMLEditor } from './lib';

const editor = new HTMLEditor({
  container: '#editor',
  // 历史记录已默认启用，无需配置！
});

editor.init();

// 就这么简单！现在所有操作都会自动记录历史
```

## 🎮 添加 UI 控制

### HTML 按钮

```html
<button id="undo">撤销</button>
<button id="redo">重做</button>
```

### JavaScript 绑定

```typescript
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');

// 绑定点击事件
undoBtn.onclick = () => editor.undo();
redoBtn.onclick = () => editor.redo();

// 动态更新按钮状态
editor.options.onHistoryChange = (state) => {
  undoBtn.disabled = !state.canUndo;
  redoBtn.disabled = !state.canRedo;
};
```

## ⌨️ 键盘快捷键（自动支持）

如果你使用 `useIframeMode` Hook，快捷键已自动绑定：

- `Ctrl+Z` (Mac: `Cmd+Z`) → 撤销
- `Ctrl+Shift+Z` (Mac: `Cmd+Shift+Z`) → 重做
- `Ctrl+Y` (Mac: `Cmd+Y`) → 重做（Windows风格）

如果不使用 Hook，可以手动绑定：

```typescript
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    e.shiftKey ? editor.redo() : editor.undo();
  }
});
```

## 🔧 可选配置

只有当你需要自定义时才配置：

```typescript
const editor = new HTMLEditor({
  container: '#editor',

  // 可选：自定义历史记录配置
  historyOptions: {
    maxHistorySize: 100,    // 最多保存100条历史
    mergeInterval: 1000,    // 1秒内的相同操作自动合并
  },

  // 可选：监听历史变化
  onHistoryChange: (state) => {
    console.log(`可撤销: ${state.canUndo}, 可重做: ${state.canRedo}`);
    updateUIButtons();
  },

  // 可选：完全禁用历史功能
  enableHistory: false,  // 不推荐
});
```

## ⚛️ React 使用方式

```tsx
import { useIframeMode } from './hooks/useIframeMode';

function MyEditor() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Hook 自动启用历史记录和快捷键
  const { editor, canUndo, canRedo, undo, redo } = useIframeMode(iframeRef);

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>撤销</button>
      <button onClick={redo} disabled={!canRedo}>重做</button>
      <iframe ref={iframeRef} srcDoc="..." />
    </div>
  );
}
```

## 🚀 高级用法

### 批量操作

将多个操作合并为一条历史记录：

```typescript
editor.beginBatch();
editor.styleManager?.changeColor(element, 'red');
editor.styleManager?.changeFontSize(element, '16px');
editor.styleManager?.changeFontWeight(element, 'bold');
editor.endBatch();

// 撤销一次恢复所有操作
editor.undo();
```

### 清空历史

```typescript
editor.clearHistory();
```

### 查询状态

```typescript
const state = editor.getHistoryState();
console.log(state);
// {
//   canUndo: true,
//   canRedo: false,
//   historySize: 10,
//   currentIndex: 10
// }
```

## ✅ 自动记录的操作

以下操作会**自动记录**到历史，无需手动处理：

### 样式修改
- ✅ 颜色、字体、字号
- ✅ 边距、内边距
- ✅ 背景、边框
- ✅ 所有 CSS 属性

### 元素操作
- ✅ 添加元素
- ✅ 删除元素

### 智能特性
- ✅ 1秒内的相同操作自动合并
- ✅ 批量操作自动合并
- ✅ 历史数量自动限制

## 📱 完整示例

```typescript
import { HTMLEditor } from './lib';

// 1. 创建编辑器（历史记录自动启用）
const editor = new HTMLEditor({
  container: '#editor',
  onHistoryChange: (state) => {
    updateButtons(state);
  },
});

editor.init();

// 2. 绑定 UI
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');

undoBtn.onclick = () => editor.undo();
redoBtn.onclick = () => editor.redo();

function updateButtons(state) {
  undoBtn.disabled = !state.canUndo;
  redoBtn.disabled = !state.canRedo;
}

// 3. 绑定快捷键（可选，如果用 Hook 会自动绑定）
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      editor.redo();
    } else {
      editor.undo();
    }
  }
});

// 4. 使用！所有操作都会自动记录
editor.styleManager?.changeColor(element, 'red');  // 自动记录
editor.deleteElement(element);                      // 自动记录

// 撤销/重做
editor.undo();  // 撤销删除
editor.undo();  // 撤销颜色修改
editor.redo();  // 重做颜色修改
```

## 🧪 测试

打开 `test-history.html` 进行可视化测试：

```bash
# 1. 编译项目
npm run build

# 2. 打开测试页面
open test-history.html
```

## 💡 常见问题

**Q: 需要手动调用记录历史吗？**
A: 不需要！所有样式修改和元素操作都会自动记录。

**Q: 如何禁用历史记录？**
A: 在创建编辑器时设置 `enableHistory: false`（不推荐）。

**Q: 历史记录会占用大量内存吗？**
A: 不会。默认最多保存100条，且会自动合并相同操作。

**Q: 支持哪些快捷键？**
A: 使用 `useIframeMode` Hook 会自动支持 Ctrl+Z、Ctrl+Shift+Z、Ctrl+Y。

**Q: 如何自定义历史记录数量？**
A: 使用 `historyOptions: { maxHistorySize: 50 }`。

## 📚 更多文档

- 📖 完整文档: `src/lib/core/historyManager/README.md`
- 🏗️ 架构设计: `HISTORY_ARCHITECTURE.md`
- 📝 集成报告: `INTEGRATION_COMPLETE.md`
- ⚡ 快速参考: `HISTORY_QUICK_REFERENCE.md`

## 🎉 就是这样！

你的编辑器现在拥有了专业级的 Undo/Redo 功能！

无需复杂配置，开箱即用。享受吧！ 🚀
