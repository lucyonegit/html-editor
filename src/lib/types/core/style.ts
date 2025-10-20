/**
 * Core Types: Style
 */
export interface StyleChange {
  [key: string]: string;
}

export interface ElementStyles {
  fontSize: string;
  color: string;
  fontWeight: string;
  backgroundColor: string;
  borderWidth: string;
  padding: string;
  margin: string;
  borderRadius: string;
}

export interface EditorStyleConfig {
  // Hover 样式配置
  hover: {
    outline?: string;
    outlineOffset?: string;
    cursor?: string;
    backgroundColor?: string;
  };
  // Focus/Selected 样式配置
  selected: {
    outline?: string;
    outlineOffset?: string;
    cursor?: string;
    backgroundColor?: string;
  };
  // 角标样式配置
  badge: {
    enabled?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    offset?: {
      top?: string;
      left?: string;
      right?: string;
      bottom?: string;
    };
    background?: string;
    color?: string;
    padding?: string;
    borderRadius?: string;
    fontSize?: string;
    fontFamily?: string;
    zIndex?: number;
  };
}