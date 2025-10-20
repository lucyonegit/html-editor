/**
 * 公共类型定义：编辑器相关类型
 */

import type { EditorStyleConfig } from "./style";
import type { MoveableOptions } from "./moveable";
import type { OnElementSelect, OnStyleChange, OnContentChange, OnReady } from "./events";

export interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export interface HTMLEditorOptions {
  container?: HTMLElement | string | null;
  enableMoveable?: boolean;
  theme?: string;
  autoSave?: boolean;
  styleConfig?: EditorStyleConfig;
  enableContentEditable?: boolean; // 是否启用contenteditable编辑
  onElementSelect?: OnElementSelect | null;
  onStyleChange?: OnStyleChange | null;
  onContentChange?: OnContentChange | null;
  onReady?: OnReady | null;
  // Moveable 配置透传
  moveableOptions?: MoveableOptions;
}