/**
 * History Manager Types
 * 历史记录管理相关类型定义
 */

/**
 * 操作类型枚举
 */
export enum OperationType {
  // 样式操作
  STYLE_CHANGE = 'style_change',
  // 内容操作
  CONTENT_CHANGE = 'content_change',
  // 元素操作
  ELEMENT_ADD = 'element_add',
  ELEMENT_DELETE = 'element_delete',
  ELEMENT_MOVE = 'element_move',
  // 批量操作
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
  merge?: (command: Command) => boolean; // 是否可以与其他命令合并
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
  elementHTML: string; // 保存完整HTML以便恢复
}

/**
 * 元素移动命令
 */
export interface ElementMoveCommand extends Command {
  type: OperationType.ELEMENT_MOVE;
  element: HTMLElement;
  oldParent: HTMLElement;
  newParent: HTMLElement;
  oldNextSibling: HTMLElement | null;
  newNextSibling: HTMLElement | null;
  oldPosition?: { x: number; y: number };
  newPosition?: { x: number; y: number };
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
  maxHistorySize?: number; // 最大历史记录数量
  mergeInterval?: number; // 合并操作的时间间隔（毫秒）
  enableAutoSnapshot?: boolean; // 是否启用自动快照
  snapshotInterval?: number; // 自动快照间隔（操作次数）
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
