/**
 * History Manager
 * 实现 Undo/Redo 功能
 */

import { Command, HistoryManagerOptions, HistoryState, OperationType, BatchCommand } from './types';
import type { HTMLEditor } from '../editor';

export class HistoryManager {
  private editor: HTMLEditor;
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private options: Required<HistoryManagerOptions>;
  private isExecuting: boolean = false;
  private batchCommands: Command[] | null = null;

  constructor(editor: HTMLEditor, options: HistoryManagerOptions = {}) {
    this.editor = editor;
    this.options = {
      maxHistorySize: options.maxHistorySize ?? 100,
      mergeInterval: options.mergeInterval ?? 1000,
      enableAutoSnapshot: options.enableAutoSnapshot ?? false,
      snapshotInterval: options.snapshotInterval ?? 10,
    };
  }

  /**
   * 记录一个操作
   */
  push(command: Command): void {
    // 添加调试日志
    console.log('HistoryManager.push called', {
      isExecuting: this.isExecuting,
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length
    });

    if (this.isExecuting) {
      console.log('HistoryManager.push: isExecuting is true, not recording');
      return;
    }

    // 如果在批量操作中，暂存命令
    if (this.batchCommands) {
      console.log('HistoryManager.push: in batch mode, queuing command');
      this.batchCommands.push(command);
      return;
    }

    const lastCommand = this.undoStack[this.undoStack.length - 1];
    if (lastCommand?.merge && lastCommand.merge(command)) {
      console.log('HistoryManager.push: merged with last command');
      this.notifyStateChange();
      return;
    }

    this.undoStack.push(command);
    console.log('HistoryManager.push: added new command, undoStack size:', this.undoStack.length);
    
    // 清空重做栈
    this.redoStack = [];
    console.log('HistoryManager.push: cleared redoStack');

    if (this.undoStack.length > this.options.maxHistorySize) {
      this.undoStack.shift();
      console.log('HistoryManager.push: removed oldest command due to size limit');
    }

    this.notifyStateChange();
  }

  /**
   * 撤销操作
   */
  undo(): boolean {
    console.log('HistoryManager.undo called', {
      canUndo: this.canUndo(),
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length
    });

    if (!this.canUndo()) return false;

    const command = this.undoStack.pop()!;
    console.log('HistoryManager.undo: popped command from undoStack, remaining:', this.undoStack.length);

    this.isExecuting = true;
    try {
      command.undo();
      this.redoStack.push(command);
      console.log('HistoryManager.undo: pushed command to redoStack, size:', this.redoStack.length);
      this.notifyStateChange();
      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      this.undoStack.push(command);
      return false;
    } finally {
      this.isExecuting = false;
      console.log('HistoryManager.undo: set isExecuting to false');
    }
  }

  /**
   * 重做操作
   */
  redo(): boolean {
    console.log('HistoryManager.redo called', {
      canRedo: this.canRedo(),
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length
    });

    if (!this.canRedo()) return false;

    const command = this.redoStack.pop()!;
    console.log('HistoryManager.redo: popped command from redoStack, remaining:', this.redoStack.length);

    this.isExecuting = true;
    try {
      command.execute();
      this.undoStack.push(command);
      console.log('HistoryManager.redo: pushed command to undoStack, size:', this.undoStack.length);
      this.notifyStateChange();
      return true;
    } catch (error) {
      console.error('Redo failed:', error);
      this.redoStack.push(command);
      return false;
    } finally {
      this.isExecuting = false;
      console.log('HistoryManager.redo: set isExecuting to false');
    }
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    const result = this.undoStack.length > 0;
    console.log('HistoryManager.canUndo:', result, 'undoStack size:', this.undoStack.length);
    return result;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    const result = this.redoStack.length > 0;
    console.log('HistoryManager.canRedo:', result, 'redoStack size:', this.redoStack.length);
    return result;
  }

  /**
   * 开始批量操作
   */
  beginBatch(): void {
    console.log('HistoryManager.beginBatch called');
    this.batchCommands = [];
  }

  /**
   * 结束批量操作
   */
  endBatch(): void {
    console.log('HistoryManager.endBatch called', {
      hasBatchCommands: !!this.batchCommands,
      batchCommandsLength: this.batchCommands?.length || 0
    });

    if (!this.batchCommands || this.batchCommands.length === 0) {
      this.batchCommands = null;
      return;
    }

    // 如果只有一个命令，直接添加
    if (this.batchCommands.length === 1) {
      console.log('HistoryManager.endBatch: only one command, pushing directly');
      this.push(this.batchCommands[0]);
    } else {
      const timestamp = Date.now();
      // 创建批量命令
      const batchCommand: BatchCommand = {
        type: OperationType.BATCH,
        timestamp,
        commands: this.batchCommands,

        execute() {
          this.commands.forEach((cmd) => cmd.execute());
        },

        undo() {
          // 反向执行撤销
          for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
          }
        },
      };
      console.log('HistoryManager.endBatch: creating batch command with', this.batchCommands.length, 'commands');
      this.batchCommands = null;
      this.push(batchCommand);
    }

    this.batchCommands = null;
  }

  /**
   * 取消批量操作
   */
  cancelBatch(): void {
    console.log('HistoryManager.cancelBatch called');
    this.batchCommands = null;
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    console.log('HistoryManager.clear called');
    this.undoStack = [];
    this.redoStack = [];
    this.notifyStateChange();
  }

  /**
   * 获取历史状态
   */
  getState(): HistoryState {
    const state = {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historySize: this.undoStack.length,
      currentIndex: this.undoStack.length,
    };
    console.log('HistoryManager.getState:', state);
    return state;
  }

  /**
   * 获取撤销栈大小
   */
  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * 获取重做栈大小
   */
  getRedoStackSize(): number {
    return this.redoStack.length;
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(): void {
    console.log('HistoryManager.notifyStateChange called');
    this.editor.emit('historyChange', this.getState());
  }

  /**
   * 销毁
   */
  destroy(): void {
    console.log('HistoryManager.destroy called');
    this.clear();
  }
}