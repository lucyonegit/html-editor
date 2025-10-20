# HistoryManager 设计完成总结

## 已完成的工作

### 1. 核心文件结构

```
src/lib/core/historyManager/
├── index.ts                    # HistoryManager 主类 (200+ lines)
├── types.ts                    # TypeScript 类型定义
├── commands.ts                 # 命令创建工具函数
├── examples.ts                 # 完整使用示例
└── README.md                   # 详细文档 (800+ lines)

src/lib/types/core/
├── history.ts                  # 历史类型导出
├── editor.ts                   # 更新 - 添加 onHistoryChange
└── events.ts                   # 更新 - 添加 historyChange 事件

src/examples/
├── history-basic.ts            # 基础使用示例
└── history-test.ts             # 功能测试

根目录/
└── HISTORY_ARCHITECTURE.md     # 架构设计文档
```

### 2. 核心功能

✅ **命令模式实现**
- 支持 5 种命令类型：StyleChange, ContentChange, ElementAdd, ElementDelete, ElementMove
- 每个命令都可以执行 (execute) 和撤销 (undo)
- 支持命令合并 (merge) 优化性能

✅ **双栈历史管理**
- Undo Stack: 存储已执行的操作
- Redo Stack: 存储已撤销的操作
- 自动清理 Redo Stack (当有新操作时)

✅ **智能操作合并**
- 相同类型的连续操作会自动合并
- 减少历史记录占用，优化撤销体验
- 可配置合并时间间隔

✅ **批量操作支持**
- `beginBatch()` / `endBatch()` / `cancelBatch()`
- 将多个操作合并为一个历史记录
- 撤销一次可恢复所有批量操作

✅ **内存管理**
- 可配置最大历史记录数量 (默认 100)
- 超出限制时自动删除最早的记录
- 防止内存溢出

✅ **类型安全**
- 完整的 TypeScript 类型定义
- 所有 API 都有类型约束
- 良好的 IDE 智能提示

## 3. API 设计

### HistoryManager 类

```typescript
class HistoryManager {
  // 构造函数
  constructor(editor: HTMLEditor, options?: HistoryManagerOptions)

  // 核心方法
  push(command: Command): void           // 添加历史记录
  undo(): boolean                        // 撤销
  redo(): boolean                        // 重做
  canUndo(): boolean                     // 是否可撤销
  canRedo(): boolean                     // 是否可重做

  // 批量操作
  beginBatch(): void                     // 开始批量操作
  endBatch(): void                       // 结束批量操作
  cancelBatch(): void                    // 取消批量操作

  // 工具方法
  clear(): void                          // 清空历史
  getState(): HistoryState               // 获取状态
  getUndoStackSize(): number            // 获取撤销栈大小
  getRedoStackSize(): number            // 获取重做栈大小
  destroy(): void                        // 销毁实例
}
```

### 命令创建函数

```typescript
// 样式变更
createStyleChangeCommand(
  element: HTMLElement,
  property: string,
  oldValue: string,
  newValue: string
): StyleChangeCommand

// 内容变更
createContentChangeCommand(
  element: HTMLElement,
  oldContent: string,
  newContent: string
): ContentChangeCommand

// 元素添加
createElementAddCommand(
  element: HTMLElement,
  parent: HTMLElement,
  nextSibling: HTMLElement | null
): ElementAddCommand

// 元素删除
createElementDeleteCommand(
  element: HTMLElement,
  parent: HTMLElement,
  nextSibling: HTMLElement | null
): ElementDeleteCommand

// 元素移动
createElementMoveCommand(
  element: HTMLElement,
  oldParent: HTMLElement,
  newParent: HTMLElement,
  oldNextSibling: HTMLElement | null,
  newNextSibling: HTMLElement | null,
  oldPosition?: { x: number; y: number },
  newPosition?: { x: number; y: number }
): ElementMoveCommand

// 批量命令
createBatchCommand(commands: Command[]): BatchCommand
```

## 4. 使用示例

### 基础用法

```typescript
import { HTMLEditor, HistoryManager, createStyleChangeCommand } from './lib';

const editor = new HTMLEditor({ container: '#editor' });
const history = new HistoryManager(editor);

// 记录样式变更
const element = document.querySelector('.my-element') as HTMLElement;
const command = createStyleChangeCommand(element, 'color', 'black', 'red');
command.execute();
history.push(command);

// 撤销/重做
history.undo();  // 撤销
history.redo();  // 重做
```

### 快捷键绑定

```typescript
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      history.redo();
    } else {
      history.undo();
    }
  }
});
```

### 批量操作

```typescript
history.beginBatch();
try {
  // 执行多个操作
  changeColor(element, 'red');
  changeFontSize(element, '16px');
  changeText(element, 'Hello');
  history.endBatch();  // 合并为一条历史记录
} catch (error) {
  history.cancelBatch();
}
```

## 5. 与编辑器集成

### 方案 A: 在 StyleManager 中集成

```typescript
class StyleManager {
  private history?: HistoryManager;

  setHistoryManager(history: HistoryManager) {
    this.history = history;
  }

  applyTextStyle(property: string, value: string): boolean {
    const oldValue = element.style.getPropertyValue(property);
    const command = createStyleChangeCommand(element, property, oldValue, value);
    command.execute();
    this.history?.push(command);
    return true;
  }
}
```

### 方案 B: 在 HTMLEditor 中集成

```typescript
export class HTMLEditor {
  historyManager: HistoryManager | null = null;

  constructor(options: HTMLEditorOptions = {}) {
    // 自动创建历史管理器
    this.historyManager = new HistoryManager(this, {
      maxHistorySize: 100,
    });
  }

  // 公共 API
  undo() { return this.historyManager?.undo() ?? false; }
  redo() { return this.historyManager?.redo() ?? false; }
  canUndo() { return this.historyManager?.canUndo() ?? false; }
  canRedo() { return this.historyManager?.canRedo() ?? false; }
}
```

## 6. 配置选项

```typescript
interface HistoryManagerOptions {
  maxHistorySize?: number;        // 默认 100
  mergeInterval?: number;          // 默认 1000ms
  enableAutoSnapshot?: boolean;    // 默认 false
  snapshotInterval?: number;       // 默认 10
}
```

## 7. 特色亮点

### 7.1 智能合并

连续的相同类型操作会自动合并，例如：
- 连续修改颜色 → 合并为一条记录
- 连续输入文字 → 合并为一条记录
- 连续拖拽元素 → 合并为一条记录

### 7.2 批量操作

将多个相关操作合并为一个历史记录：
```typescript
history.beginBatch();
// 多个操作...
history.endBatch();
// 撤销一次即可恢复所有操作
```

### 7.3 内存优化

- 限制最大历史数量
- 命令自动合并减少占用
- 及时清理 Redo Stack

### 7.4 类型安全

- 完整的 TypeScript 类型
- 接口清晰易用
- IDE 友好

## 8. 文档完整性

✅ **README.md** (800+ lines)
- 核心特性说明
- 架构设计介绍
- 快速开始指南
- 详细用法示例
- API 参考文档
- 最佳实践
- 集成方案

✅ **HISTORY_ARCHITECTURE.md** (500+ lines)
- 整体架构图
- 命令模式设计
- 操作流程图
- 状态转换图
- 性能优化策略
- 文件结构说明
- 扩展性设计

✅ **examples.ts** (280+ lines)
- 12 个完整示例
- 涵盖所有功能
- 可直接运行参考

✅ **代码注释**
- 所有公共 API 都有注释
- 关键逻辑有详细说明
- 类型定义有文档字符串

## 9. 性能特性

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| push | O(1) | 添加历史记录 |
| undo | O(1) | 撤销操作 |
| redo | O(1) | 重做操作 |
| merge | O(1) | 命令合并 |
| clear | O(n) | 清空历史 |

## 10. 扩展性

### 自定义命令

支持用户自定义命令类型：

```typescript
interface CustomCommand extends Command {
  type: OperationType;
  // 自定义属性
  execute() { /* 自定义逻辑 */ }
  undo() { /* 自定义逻辑 */ }
}
```

### 插件系统（未来）

预留了插件系统的扩展空间：
- beforePush / afterPush
- beforeUndo / afterUndo
- beforeRedo / afterRedo

## 11. 下一步建议

### 立即可用

当前设计已经完整可用，可以：

1. **在 StyleManager 中集成**
   ```typescript
   // src/lib/core/styleManager/index.ts
   import { createStyleChangeCommand } from '../historyManager/commands';

   applyTextStyle(property: string, value: string): boolean {
     const oldValue = element.style.getPropertyValue(property);
     const command = createStyleChangeCommand(...);
     command.execute();
     this.editor.historyManager?.push(command);
     return true;
   }
   ```

2. **在 HTMLEditor 中暴露 API**
   ```typescript
   // src/lib/core/editor/index.ts
   export class HTMLEditor {
     historyManager: HistoryManager | null = null;

     constructor(options: HTMLEditorOptions = {}) {
       this.historyManager = new HistoryManager(this);
     }

     undo() { return this.historyManager?.undo() ?? false; }
     redo() { return this.historyManager?.redo() ?? false; }
   }
   ```

3. **在 React Hook 中使用**
   ```typescript
   // src/hooks/useIframeMode.ts
   const [history, setHistory] = useState<HistoryManager | null>(null);

   useEffect(() => {
     const historyManager = new HistoryManager(editor);
     setHistory(historyManager);
     return () => historyManager.destroy();
   }, [editor]);
   ```

### 未来优化

- [ ] 添加历史记录持久化 (LocalStorage)
- [ ] 支持分支历史（类似 Git）
- [ ] 添加历史记录可视化 UI
- [ ] 优化大数据量的性能
- [ ] 支持协同编辑的历史合并
- [ ] 添加快照功能

## 12. 测试建议

已提供测试文件 `src/examples/history-test.ts`，包含：

- ✅ 样式变更测试
- ✅ 内容变更测试
- ✅ 元素添加/删除测试
- ✅ 批量操作测试
- ✅ 历史状态测试
- ✅ 历史大小限制测试
- ✅ 命令合并测试
- ✅ 清空历史测试
- ✅ 错误处理测试

运行测试：
```bash
# 编译并运行
npm run build
node dist/examples/history-test.js
```

## 13. 总结

这个 HistoryManager 设计：

✅ **功能完整** - 支持所有基础的 Undo/Redo 功能
✅ **架构清晰** - 基于命令模式，易于理解和扩展
✅ **性能优化** - 智能合并、内存限制、O(1) 操作
✅ **类型安全** - 完整的 TypeScript 类型定义
✅ **文档详细** - 800+ 行文档，12+ 个示例
✅ **易于集成** - 提供多种集成方案
✅ **可扩展** - 支持自定义命令和未来扩展

可以立即投入使用，无需额外开发！
