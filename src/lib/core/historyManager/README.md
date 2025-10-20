# History Manager - Undo/Redo 功能

一个基于命令模式的历史记录管理器，为 HTML 编辑器提供撤销/重做功能。

## 核心特性

✅ **命令模式设计** - 将每个操作封装为可撤销的命令对象
✅ **智能合并** - 连续的相同操作自动合并，减少历史记录占用
✅ **批量操作** - 支持将多个操作合并为一个历史记录
✅ **内存优化** - 限制历史记录数量，避免内存溢出
✅ **类型安全** - 完整的 TypeScript 类型定义
✅ **错误恢复** - 操作失败时自动恢复状态

## 架构设计

### 1. 命令模式 (Command Pattern)

每个操作都被封装为一个命令对象，包含以下方法：
- `execute()`: 执行操作
- `undo()`: 撤销操作
- `merge()`: 可选的合并方法，用于优化历史记录

### 2. 双栈结构

```
┌─────────────┐       ┌─────────────┐
│ Undo Stack  │ ←────→ │ Redo Stack  │
├─────────────┤       ├─────────────┤
│ Command 3   │       │             │
│ Command 2   │       │             │
│ Command 1   │       │             │
└─────────────┘       └─────────────┘
```

- **Undo Stack**: 存储已执行的操作
- **Redo Stack**: 存储已撤销的操作

### 3. 支持的操作类型

| 操作类型 | 说明 | 示例 |
|---------|------|------|
| `STYLE_CHANGE` | 样式变更 | 修改颜色、字体大小等 |
| `CONTENT_CHANGE` | 内容变更 | 修改元素的 innerHTML |
| `ELEMENT_ADD` | 添加元素 | 插入新的 DOM 元素 |
| `ELEMENT_DELETE` | 删除元素 | 删除现有的 DOM 元素 |
| `ELEMENT_MOVE` | 移动元素 | 拖拽、调整位置 |
| `BATCH` | 批量操作 | 将多个操作合并为一个 |

## 快速开始

### 基础使用

```typescript
import { HTMLEditor } from './lib/core/editor';
import { HistoryManager } from './lib/core/historyManager';
import { createStyleChangeCommand } from './lib/core/historyManager/commands';

// 1. 创建编辑器和历史管理器
const editor = new HTMLEditor({ container: '#editor' });
const history = new HistoryManager(editor);

editor.init();

// 2. 记录操作
const element = document.querySelector('.my-element') as HTMLElement;
const oldValue = element.style.color;
const command = createStyleChangeCommand(element, 'color', oldValue, 'red');

command.execute(); // 执行操作
history.push(command); // 记录到历史

// 3. 撤销/重做
history.undo(); // 撤销
history.redo(); // 重做
```

### 快捷键绑定

```typescript
document.addEventListener('keydown', (e) => {
  // Ctrl+Z / Cmd+Z: 撤销
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    history.undo();
  }

  // Ctrl+Shift+Z / Cmd+Shift+Z: 重做
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
    e.preventDefault();
    history.redo();
  }
});
```

## 详细用法

### 1. 样式变更

```typescript
import { createStyleChangeCommand } from './lib/core/historyManager/commands';

function changeColor(element: HTMLElement, color: string) {
  const oldValue = element.style.color;
  const command = createStyleChangeCommand(element, 'color', oldValue, color);

  command.execute();
  history.push(command);
}

// 连续修改会自动合并（1秒内）
changeColor(element, 'red');
changeColor(element, 'blue');   // 与上一条合并
changeColor(element, 'green');  // 与上一条合并
// 最终只有一条历史记录: red → green
```

### 2. 内容变更

```typescript
import { createContentChangeCommand } from './lib/core/historyManager/commands';

function updateContent(element: HTMLElement, newContent: string) {
  const oldContent = element.innerHTML;
  const command = createContentChangeCommand(element, oldContent, newContent);

  command.execute();
  history.push(command);
}

updateContent(element, '<p>新内容</p>');
```

### 3. 添加元素

```typescript
import { createElementAddCommand } from './lib/core/historyManager/commands';

function addNewElement(parent: HTMLElement) {
  const newElement = document.createElement('div');
  newElement.textContent = '新元素';

  const command = createElementAddCommand(newElement, parent, null);

  command.execute();
  history.push(command);
}

addNewElement(document.body);
```

### 4. 删除元素

```typescript
import { createElementDeleteCommand } from './lib/core/historyManager/commands';

function removeElement(element: HTMLElement) {
  const parent = element.parentElement!;
  const nextSibling = element.nextSibling as HTMLElement | null;

  const command = createElementDeleteCommand(element, parent, nextSibling);

  command.execute();
  history.push(command);
}

removeElement(element);
```

### 5. 移动元素

```typescript
import { createElementMoveCommand } from './lib/core/historyManager/commands';

function moveElement(element: HTMLElement, newParent: HTMLElement) {
  const oldParent = element.parentElement!;
  const oldNextSibling = element.nextSibling as HTMLElement | null;

  const command = createElementMoveCommand(
    element,
    oldParent,
    newParent,
    oldNextSibling,
    null
  );

  command.execute();
  history.push(command);
}
```

### 6. 批量操作

```typescript
// 将多个操作合并为一个历史记录
history.beginBatch();

try {
  changeColor(element, 'red');
  updateContent(element, '<p>新内容</p>');
  moveElement(element, newParent);

  history.endBatch(); // 这些操作会被合并为一条历史记录
} catch (error) {
  history.cancelBatch(); // 出错时取消批量操作
  throw error;
}

// 现在撤销一次会同时撤销上面的所有操作
history.undo();
```

## 与编辑器集成

### 1. 在 StyleManager 中集成

```typescript
// src/lib/core/styleManager/index.ts
import { HistoryManager } from '../historyManager';
import { createStyleChangeCommand } from '../historyManager/commands';

class StyleManager {
  private editor: HTMLEditor;
  private history?: HistoryManager;

  setHistoryManager(history: HistoryManager) {
    this.history = history;
  }

  applyTextStyle(property: string, value: string): boolean {
    const element = this.editor.selectedElement;
    if (!element) return false;

    const oldValue = element.style.getPropertyValue(property);

    // 创建命令
    const command = createStyleChangeCommand(element, property, oldValue, value);

    // 执行
    command.execute();

    // 记录历史
    if (this.history) {
      this.history.push(command);
    }

    this.editor.emit('styleChange', element);
    return true;
  }
}
```

### 2. 在 HTMLEditor 中集成

```typescript
// src/lib/core/editor/index.ts
import { HistoryManager } from '../historyManager';

export class HTMLEditor {
  historyManager: HistoryManager | null = null;

  constructor(options: HTMLEditorOptions = {}) {
    // ...

    // 创建历史管理器
    if (options.enableHistory !== false) {
      this.historyManager = new HistoryManager(this, options.historyOptions);
    }
  }

  initializeManagers(): void {
    this.eventManager = new EventManager(this);
    this.styleManager = new StyleManager(this);
    this.moveableManager = new MoveableManager(this);

    // 将历史管理器传递给其他管理器
    if (this.historyManager && this.styleManager) {
      this.styleManager.setHistoryManager(this.historyManager);
    }
  }

  // 公共 API
  undo(): boolean {
    return this.historyManager?.undo() ?? false;
  }

  redo(): boolean {
    return this.historyManager?.redo() ?? false;
  }

  canUndo(): boolean {
    return this.historyManager?.canUndo() ?? false;
  }

  canRedo(): boolean {
    return this.historyManager?.canRedo() ?? false;
  }
}
```

### 3. 在 React Hook 中使用

```typescript
// src/hooks/useIframeMode.ts
import { useState, useEffect } from 'react';
import { HTMLEditor } from '../lib/index';
import { HistoryManager } from '../lib/core/historyManager';

export function useIframeMode(iframeRef: React.RefObject<HTMLIFrameElement>) {
  const [editor, setEditor] = useState<HTMLEditor | null>(null);
  const [history, setHistory] = useState<HistoryManager | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument!;

    // 创建编辑器
    const editorInstance = new HTMLEditor({
      onHistoryChange: (state) => {
        setCanUndo(state.canUndo);
        setCanRedo(state.canRedo);
      },
    });

    // 创建历史管理器
    const historyInstance = new HistoryManager(editorInstance, {
      maxHistorySize: 100,
    });

    editorInstance.init(doc.body);

    setEditor(editorInstance);
    setHistory(historyInstance);

    // 绑定快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          historyInstance.redo();
        } else {
          historyInstance.undo();
        }
      }
    };

    doc.addEventListener('keydown', handleKeyDown);

    return () => {
      doc.removeEventListener('keydown', handleKeyDown);
      editorInstance.destroy();
      historyInstance.destroy();
    };
  }, [iframeRef]);

  return {
    editor,
    history,
    canUndo,
    canRedo,
    undo: () => history?.undo(),
    redo: () => history?.redo(),
  };
}
```

## 配置选项

```typescript
interface HistoryManagerOptions {
  maxHistorySize?: number;      // 最大历史记录数量，默认 100
  mergeInterval?: number;        // 合并操作的时间间隔（毫秒），默认 1000
  enableAutoSnapshot?: boolean;  // 是否启用自动快照，默认 false
  snapshotInterval?: number;     // 自动快照间隔（操作次数），默认 10
}
```

## API 参考

### HistoryManager

#### 方法

- `push(command: Command)` - 添加新的历史记录
- `undo(): boolean` - 撤销最后一个操作
- `redo(): boolean` - 重做已撤销的操作
- `canUndo(): boolean` - 检查是否可以撤销
- `canRedo(): boolean` - 检查是否可以重做
- `beginBatch()` - 开始批量操作
- `endBatch()` - 结束批量操作
- `cancelBatch()` - 取消批量操作
- `clear()` - 清空所有历史记录
- `getState(): HistoryState` - 获取当前历史状态
- `destroy()` - 销毁历史管理器

### 命令创建函数

- `createStyleChangeCommand(element, property, oldValue, newValue)`
- `createContentChangeCommand(element, oldContent, newContent)`
- `createElementAddCommand(element, parent, nextSibling)`
- `createElementDeleteCommand(element, parent, nextSibling)`
- `createElementMoveCommand(element, oldParent, newParent, ...)`
- `createBatchCommand(commands)`

## 最佳实践

### 1. 操作合并

对于频繁的连续操作（如拖拽、输入），建议使用操作合并来优化性能：

```typescript
// 不好的做法：每次移动都记录
onDrag(e) {
  const command = createElementMoveCommand(...);
  command.execute();
  history.push(command); // 会产生大量历史记录
}

// 好的做法：利用自动合并（已内置）
onDrag(e) {
  const command = createElementMoveCommand(...);
  command.execute();
  history.push(command); // 500ms 内的连续移动会自动合并
}
```

### 2. 批量操作

对于一组相关的操作，使用批量操作：

```typescript
// 不好的做法
changeColor(element, 'red');     // 历史记录 1
changeFontSize(element, '16px'); // 历史记录 2
changeText(element, 'Hello');    // 历史记录 3
// 需要撤销 3 次才能完全恢复

// 好的做法
history.beginBatch();
changeColor(element, 'red');
changeFontSize(element, '16px');
changeText(element, 'Hello');
history.endBatch();
// 只需要撤销 1 次就能完全恢复
```

### 3. 内存管理

设置合理的历史记录上限：

```typescript
const history = new HistoryManager(editor, {
  maxHistorySize: 50, // 根据应用场景调整
});
```

## 注意事项

1. **DOM 引用** - 命令中存储的 DOM 元素引用可能失效，建议在关键操作时使用元素 ID 或路径
2. **异步操作** - 当前不支持异步命令，所有操作必须是同步的
3. **内存泄漏** - 确保在组件卸载时调用 `destroy()` 方法
4. **事件监听** - 撤销/重做不会自动触发 DOM 事件，需要手动触发编辑器的事件系统

## 扩展开发

### 自定义命令

```typescript
import { Command, OperationType } from './lib/core/historyManager/types';

interface CustomCommand extends Command {
  type: OperationType; // 可以扩展新的类型
  // 自定义属性
}

export function createCustomCommand(): CustomCommand {
  return {
    type: OperationType.STYLE_CHANGE, // 或自定义类型
    timestamp: Date.now(),

    execute() {
      // 执行逻辑
    },

    undo() {
      // 撤销逻辑
    },

    merge(command: Command): boolean {
      // 可选：合并逻辑
      return false;
    },
  };
}
```

## 后续优化方向

- [ ] 支持异步命令
- [ ] 添加历史记录持久化（LocalStorage）
- [ ] 支持分支历史（类似 Git）
- [ ] 添加历史记录可视化 UI
- [ ] 优化内存占用（使用虚拟 DOM diff）
- [ ] 支持协同编辑的历史记录合并

## License

MIT
