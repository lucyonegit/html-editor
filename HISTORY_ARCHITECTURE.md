# History Manager 架构设计

## 1. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                       HTMLEditor                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ EventManager │  │StyleManager  │  │MoveableManager│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                  │
│                   ┌────────▼────────┐                        │
│                   │ HistoryManager  │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼───────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐          ┌──────▼──────┐
         │ Undo Stack  │          │ Redo Stack  │
         │             │          │             │
         │ Command 3   │          │             │
         │ Command 2   │◄─undo────┤             │
         │ Command 1   │──redo───►│             │
         └─────────────┘          └─────────────┘
```

## 2. 命令模式设计

```
┌──────────────────────────────────────────────────────────┐
│                    Command Interface                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ + execute(): void                                    │ │
│  │ + undo(): void                                       │ │
│  │ + merge?(command: Command): boolean                 │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────┬─────────────────────────────────────┘
                     │
      ┌──────────────┴──────────────┬──────────────┬────────────────┐
      │                             │              │                │
┌─────▼────────┐         ┌─────────▼──────┐  ┌───▼──────┐   ┌────▼─────┐
│StyleChange   │         │ContentChange   │  │ElementAdd│   │Element   │
│Command       │         │Command         │  │Command   │   │Delete    │
│              │         │                │  │          │   │Command   │
│- element     │         │- element       │  │- element │   │- element │
│- property    │         │- oldContent    │  │- parent  │   │- parent  │
│- oldValue    │         │- newContent    │  │          │   │- HTML    │
│- newValue    │         │                │  │          │   │          │
└──────────────┘         └────────────────┘  └──────────┘   └──────────┘
```

## 3. 操作流程

### 3.1 执行操作并记录

```
User Action
    │
    ▼
┌───────────────────┐
│ Create Command    │
└─────┬─────────────┘
      │
      ▼
┌───────────────────┐
│ command.execute() │
└─────┬─────────────┘
      │
      ▼
┌───────────────────┐     ┌──────────────┐
│ history.push()    │────►│ Try Merge?   │
└─────┬─────────────┘     └──────┬───────┘
      │                          │
      │ No Merge                 │ Merged
      ▼                          │
┌───────────────────┐            │
│ Add to Undo Stack │◄───────────┘
└─────┬─────────────┘
      │
      ▼
┌───────────────────┐
│ Clear Redo Stack  │
└───────────────────┘
```

### 3.2 撤销操作

```
User: Ctrl+Z
    │
    ▼
┌───────────────────┐
│ history.undo()    │
└─────┬─────────────┘
      │
      ▼
┌───────────────────┐
│ Pop from Undo     │
└─────┬─────────────┘
      │
      ▼
┌───────────────────┐
│ command.undo()    │
└─────┬─────────────┘
      │
      ▼
┌───────────────────┐
│ Push to Redo      │
└───────────────────┘
```

### 3.3 重做操作

```
User: Ctrl+Shift+Z
    │
    ▼
┌───────────────────┐
│ history.redo()    │
└─────┬─────────────┘
      │
      ▼
┌───────────────────┐
│ Pop from Redo     │
└─────┬─────────────┘
      │
      ▼
┌───────────────────┐
│ command.execute() │
└─────┬─────────────┘
      │
      ▼
┌───────────────────┐
│ Push to Undo      │
└───────────────────┘
```

## 4. 命令合并机制

```
Time: 0ms              500ms             1000ms            1500ms
  │                     │                  │                 │
  ▼                     ▼                  ▼                 ▼
┌────────┐          ┌────────┐         ┌────────┐       ┌────────┐
│Cmd 1   │  Merge  │Cmd 2   │  Merge  │Cmd 3   │       │Cmd 4   │
│color:  │───────► │color:  │───────► │color:  │  X    │color:  │
│red     │         │blue    │         │green   │       │yellow  │
└────────┘          └────────┘         └────────┘       └────────┘
                                            │
                                            │ Too much time passed
                                            ▼
                                    ┌─────────────────┐
                                    │ New history     │
                                    │ entry created   │
                                    └─────────────────┘

Result:
Undo Stack:
  [Command: red → green]  ← Merged
  [Command: green → yellow] ← New entry
```

## 5. 批量操作

```
User Action (Multiple operations)
    │
    ▼
┌───────────────────┐
│ history.begin()   │
└─────┬─────────────┘
      │
      ├─► [Operation 1] ──┐
      │                   │
      ├─► [Operation 2] ──┼─► Stored in
      │                   │   temporary array
      ├─► [Operation 3] ──┘
      │
      ▼
┌───────────────────┐
│ history.end()     │
└─────┬─────────────┘
      │
      ▼
┌───────────────────────────┐
│ Create BatchCommand       │
│ ┌─────────────────────┐   │
│ │ commands: [         │   │
│ │   Operation 1,      │   │
│ │   Operation 2,      │   │
│ │   Operation 3       │   │
│ │ ]                   │   │
│ └─────────────────────┘   │
└─────┬─────────────────────┘
      │
      ▼
┌───────────────────┐
│ Push to Undo Stack│
│ (Single entry)    │
└───────────────────┘

Undo once → All 3 operations reversed
```

## 6. 内存管理

```
┌─────────────────────────────────────────────────────────┐
│                    History Manager                       │
│                                                          │
│  Undo Stack (Max: 100)                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │ [Cmd 100] [Cmd 99] ... [Cmd 2] [Cmd 1]          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  When new command arrives:                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Remove oldest │ Shift all │ Add new command     │   │
│  │   [Cmd 1]     │  ← ← ← ←  │   [Cmd 101]        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Result:                                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ [Cmd 101] [Cmd 100] ... [Cmd 3] [Cmd 2]         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 7. 集成示例

### 7.1 与 StyleManager 集成

```
User: Change color
    │
    ▼
┌─────────────────────────────┐
│ StyleManager                │
│ .applyTextStyle()           │
└────────┬────────────────────┘
         │
         ├─► Get old value
         │
         ├─► Create StyleChangeCommand
         │
         ├─► Execute command
         │
         └─► history.push(command)
                │
                ▼
         ┌──────────────────┐
         │ HistoryManager   │
         │ records command  │
         └──────────────────┘
```

### 7.2 与 EventManager 集成

```
DOM Event (click, drag, etc.)
    │
    ▼
┌─────────────────────────────┐
│ EventManager                │
│ handles event               │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Create appropriate command  │
│ (Move, Style, Content, etc.)│
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ HistoryManager.push()       │
└─────────────────────────────┘
```

## 8. 状态转换图

```
                    ┌──────────────┐
                    │    Empty     │
                    │   History    │
                    └──────┬───────┘
                           │ push()
                           ▼
                    ┌──────────────┐
         ┌─────────►│  Can Undo    │
         │          │  Can't Redo  │◄──────┐
         │          └──────┬───────┘       │
         │                 │               │
         │ push()          │ undo()        │ push()
         │                 ▼               │
         │          ┌──────────────┐       │
         └──────────│  Can Undo    │       │
                    │  Can Redo    │───────┘
                    └──────┬───────┘
                           │ redo()
                           │
                           └─────►(back to Can Undo, Can't Redo)
```

## 9. 性能优化策略

### 9.1 命令合并

```
Without merge:          With merge:
─────────────          ─────────────
[Cmd 1] size: 1KB      [Cmd 1-10] size: 1KB
[Cmd 2] size: 1KB
[Cmd 3] size: 1KB      Total: 1KB
[Cmd 4] size: 1KB      Memory saved: 90%
...
[Cmd 10] size: 1KB
─────────────
Total: 10KB
```

### 9.2 历史限制

```
Memory Usage

  │
  │                                      ┌──────────
  │                                    ╱
  │                                  ╱
  │                                ╱
  │                              ╱
  │                            ╱
  │              ┌───────────╱
  │            ╱            Max limit (100 commands)
  │          ╱
  │        ╱
  │      ╱
  │    ╱
  │  ╱
  └──────────────────────────────────────────────► Time
     0        50        100       150       200
                   Commands added
```

## 10. 文件结构

```
src/lib/core/historyManager/
│
├── index.ts              # HistoryManager 主类
├── types.ts              # TypeScript 类型定义
├── commands.ts           # 命令创建工具函数
├── examples.ts           # 使用示例
└── README.md             # 详细文档

src/lib/types/core/
└── history.ts            # 导出历史相关类型

src/examples/
├── history-basic.ts      # 基础使用示例
└── history-test.ts       # 功能测试
```

## 11. 扩展性

### 11.1 自定义命令

```typescript
// 1. 定义命令类型
enum CustomOperationType {
  CUSTOM_ACTION = 'custom_action',
}

// 2. 实现命令接口
interface CustomCommand extends Command {
  type: CustomOperationType.CUSTOM_ACTION;
  // custom properties
}

// 3. 创建命令工厂
function createCustomCommand(): CustomCommand {
  return {
    type: CustomOperationType.CUSTOM_ACTION,
    timestamp: Date.now(),
    execute() { /* ... */ },
    undo() { /* ... */ },
  };
}

// 4. 使用
const cmd = createCustomCommand();
history.push(cmd);
```

### 11.2 插件系统（未来计划）

```
┌─────────────────────────────────────┐
│       HistoryManager                │
│                                     │
│  ┌────────────────────────────┐    │
│  │  Plugin System             │    │
│  │  ┌──────┐  ┌──────┐        │    │
│  │  │Plugin│  │Plugin│  ...   │    │
│  │  │  1   │  │  2   │        │    │
│  │  └──────┘  └──────┘        │    │
│  └────────────────────────────┘    │
│                                     │
│  - beforePush()                    │
│  - afterPush()                     │
│  - beforeUndo()                    │
│  - afterUndo()                     │
└─────────────────────────────────────┘
```

## 12. 性能指标（目标）

| 操作 | 时间复杂度 | 空间复杂度 |
|------|-----------|-----------|
| Push | O(1) | O(1) |
| Undo | O(1) | O(1) |
| Redo | O(1) | O(1) |
| Merge | O(1) | O(1) |
| Clear | O(n) | O(1) |

| 内存占用 | 估算值 |
|---------|-------|
| 单个命令 | ~100-500 bytes |
| 100条历史 | ~10-50 KB |
| 1000条历史 | ~100-500 KB |
