/**
 * Core Types: Editor Events
 * 集中事件相关类型
 */

import type { HistoryState } from './history';

// 事件名类型（可按需扩展）
export type EditorEventName =
  | "ready"
  | "hover"
  | "elementSelect"
  | "styleChange"
  | "contentChange"
  | "historyChange";

// 自定义事件 detail 结构
export interface EditorEventDetail {
  editor: unknown; // 避免循环依赖，保持通用；需要时可在使用点断言为 HTMLEditor
  args: any[];
}

// 回调签名统一声明（供 HTMLEditorOptions 参考或复用）
export type OnElementSelect = (element: HTMLElement | null, position?: { top: number; left: number; width: number; height: number; bottom: number; right: number }) => void;
export type OnStyleChange = (element: HTMLElement, styles: Record<string, string>) => void;
export type OnContentChange = () => void;
export type OnReady = () => void;
export type OnHistoryChange = (state: HistoryState) => void;