export type MarkType = 
  | 'bold' 
  | 'italic' 
  | 'underline' 
  | 'strike' 
  | 'color' 
  | 'background' 
  | 'fontSize' 
  | 'fontFamily' 
  | 'highlight'
  | 'code'
  | 'link'

export type MarkSpec = {
  type: MarkType
  value?: string
  attrs?: Record<string, string> // 用于 link 等需要额外属性的标记
}

export type DocCtx = { 
  view: Window
  document: Document 
}

/** 将元素按 range 拆分为三段 */
export interface SplitResult {
  pre: DocumentFragment
  mid: DocumentFragment
  post: DocumentFragment
}