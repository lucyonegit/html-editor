/**
 * Core Types: Moveable
 */
export interface MoveableOptions {
  draggable?: boolean;
  scalable?: boolean;
  resizable?: boolean;
  renderDirections?: Array<"nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e">;
  keepRatio?: boolean;
  throttleDrag?: number;
  throttleResize?: number;
  throttleScale?: number;
  origin?: boolean;
  // 吸附与标尺线相关
  snappable?: boolean;
  snapCenter?: boolean;
  snapThreshold?: number;
  snapGridWidth?: number;
  snapGridHeight?: number;
  snapContainer?: HTMLElement | null;
  elementGuidelines?: HTMLElement[];
  horizontalGuidelines?: number[];
  verticalGuidelines?: number[];
  snapDirections?: {
    left?: boolean;
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    center?: boolean;
    middle?: boolean;
  };
}