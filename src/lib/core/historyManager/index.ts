/**
 * History Manager 历史记录管理
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
    if (this.isExecuting) {
      return;
    }

    // 如果在批量操作中，暂存命令
    if (this.batchCommands) {
      this.batchCommands.push(command);
      return;
    }
    const lastCommand = this.undoStack[this.undoStack.length - 1];
    if (lastCommand?.merge && lastCommand.merge(command)) {
      this.notifyStateChange();
      return;
    }
    this.undoStack.push(command);
    
    // 清空重做栈
    this.redoStack = [];
    if (this.undoStack.length > this.options.maxHistorySize) {
      this.undoStack.shift();
    }
    this.notifyStateChange();
  }

  /**
   * 撤销操作
   */
  undo(): boolean {
    if (!this.canUndo()) return false;

    const command = this.undoStack.pop()!;
    this.isExecuting = true;
    try {
      command.undo();
      if(command.type === OperationType.ELEMENT_ADD) {
        // 如果是添加元素操作，撤销时选中添加前的元素
        this.editor.selectElement(command.selectedElement || null);
      }
      this.redoStack.push(command);
      this.notifyStateChange(true);
      return true;
    } catch (error) {
      this.undoStack.push(command);
      return false;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * 重做操作
   */
  redo(): boolean {
    if (!this.canRedo()) return false;

    const command = this.redoStack.pop()!;
    this.isExecuting = true;
    try {
      command.execute();
      this.undoStack.push(command);
      this.notifyStateChange(true);
      return true;
    } catch (error) {
      this.redoStack.push(command);
      return false;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    const result = this.undoStack.length > 0;
    return result;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    const result = this.redoStack.length > 0;
    return result;
  }

  /**
   * 开始批量操作
   */
  beginBatch(): void {
    this.batchCommands = [];
  }

  /**
   * 结束批量操作
   */
  endBatch(): void {
    if (!this.batchCommands || this.batchCommands.length === 0) {
      this.batchCommands = null;
      return;
    }

    // 如果只有一个命令，直接添加
    if (this.batchCommands.length === 1) {
      const command = this.batchCommands[0];
      this.batchCommands = null;
      this.push(command);
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
      this.batchCommands = null;
      this.push(batchCommand);
    }

    this.batchCommands = null;
  }

  /**
   * 取消批量操作
   */
  cancelBatch(): void {
    this.batchCommands = null;
  }

  /**
   * 清空历史记录
   */
  clear(): void {
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
  private notifyStateChange(contentChange?: boolean): void {
    this.editor.emit('historyChange', this.getState());
    if (contentChange) {
      // 临时处理，之后所有的操作都需要通知
      this.editor.emit('contentChange');
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.clear();
  }
}