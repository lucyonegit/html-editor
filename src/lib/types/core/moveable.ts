/**
 * Core Types: Moveable
 */
export interface MoveableOptions {
  renderDirections?: Array<"nw" | "ne" | "sw" | "se">;
  keepRatio?: boolean;
  throttleDrag?: number;
  throttleResize?: number;
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