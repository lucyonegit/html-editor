/**
 * History Manager Types
 * 历史记录管理相关类型定义
 */

/**
 * 操作类型枚举
 */
export enum OperationType {
  STYLE_CHANGE = 'style_change',
  CONTENT_CHANGE = 'content_change',
  ELEMENT_ADD = 'element_add',
  ELEMENT_DELETE = 'element_delete',
  ELEMENT_MOVE = 'element_move',
  BATCH = 'batch',
}

/**
 * 操作命令基础接口
 */
export interface Command {
  type: OperationType;
  timestamp: number;
  execute: () => void;
  undo: () => void;
  merge?: (command: Command) => boolean;
}

/**
 * 样式变更命令
 */
export interface StyleChangeCommand extends Command {
  type: OperationType.STYLE_CHANGE;
  element: HTMLElement;
  property: string;
  oldValue: string;
  newValue: string;
}

/**
 * 内容变更命令
 */
export interface ContentChangeCommand extends Command {
  type: OperationType.CONTENT_CHANGE;
  element: HTMLElement;
  oldContent: string;
  newContent: string;
}

/**
 * 元素添加命令
 */
export interface ElementAddCommand extends Command {
  type: OperationType.ELEMENT_ADD;
  element: HTMLElement;
  parent: HTMLElement;
  nextSibling: HTMLElement | null;
}

/**
 * 元素删除命令
 */
export interface ElementDeleteCommand extends Command {
  type: OperationType.ELEMENT_DELETE;
  element: HTMLElement;
  parent: HTMLElement;
  nextSibling: HTMLElement | null;
  elementHTML: string;
}

/**
 * 批量操作命令
 */
export interface BatchCommand extends Command {
  type: OperationType.BATCH;
  commands: Command[];
}

/**
 * 历史记录管理器配置
 */
export interface HistoryManagerOptions {
  maxHistorySize?: number;
  mergeInterval?: number;
  enableAutoSnapshot?: boolean;
  snapshotInterval?: number;
}

/**
 * 历史状态
 */
export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  currentIndex: number;
}