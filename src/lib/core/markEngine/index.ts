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

type DocCtx = { 
  view: Window
  document: Document 
}

// 块级元素标签集合
const BLOCK_TAGS = new Set([
  'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 
  'LI', 'BLOCKQUOTE', 'PRE', 'TABLE', 'TR', 'TD', 'TH'
])

// Mark 类型到样式的映射
const styleMap: Record<MarkType, (value?: string) => Record<string, string>> = {
  bold: () => ({ 'font-weight': 'bold' }),
  italic: () => ({ 'font-style': 'italic' }),
  underline: () => ({ 'text-decoration': 'underline' }),
  strike: () => ({ 'text-decoration': 'line-through' }),
  color: (v) => ({ color: v || '' }),
  background: (v) => ({ 'background-color': v || '' }),
  fontSize: (v) => ({ 'font-size': v || '' }),
  fontFamily: (v) => ({ 'font-family': v || '' }),
  highlight: (v) => ({ 'background-color': v || 'yellow' }),
  code: () => ({ 
    'font-family': 'monospace',
    'background-color': '#f5f5f5',
    'padding': '2px 4px',
    'border-radius': '3px'
  }),
  link: () => ({
    'color': '#0066cc',
    'text-decoration': 'underline',
    'cursor': 'pointer'
  })
}

// ==================== 选区相关工具函数 ====================

/** 检查是否为折叠选区 */
const isCollapsed = (ctx: DocCtx): boolean => {
  const sel = ctx.document.getSelection()
  return !sel || sel.rangeCount === 0 || sel.isCollapsed
}

/** 获取当前选区的 Range，带安全检查 */
const getRange = (ctx: DocCtx): Range | null => {
  const sel = ctx.document.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  return sel.getRangeAt(0)
}

/** 安全地设置选区 */
const setRange = (ctx: DocCtx, range: Range): void => {
  const sel = ctx.document.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}

// ==================== DOM 遍历工具函数 ====================

/** 向上查找最近的 span 元素 */
const ascendToSpan = (el: HTMLElement | null): HTMLElement | null => {
  while (el && el.tagName !== 'SPAN') {
    el = el.parentElement
  }
  return el
}

/** 基于计算样式查找最近的块级元素（非 inline 即视为块） */
const ascendToBlockByStyle = (ctx: DocCtx, el: HTMLElement | null): HTMLElement | null => {
  while (el) {
    const display = ctx.view.getComputedStyle(el).display
    if (display !== 'inline') return el
    el = el.parentElement
  }
  return ctx.document.body
}

/** 获取节点的容器元素（如果是文本节点则返回父元素） */
const getContainerElement = (node: Node): HTMLElement => {
  return node.nodeType === Node.ELEMENT_NODE 
    ? node as HTMLElement 
    : node.parentElement!
}

// ==================== Range 分析工具 ====================

/** 检查 Range 是否在同一个 span 内 */
const commonSpanForRange = (ctx: DocCtx, range: Range): HTMLElement | null => {
  const startEl = getContainerElement(range.startContainer)
  const endEl = getContainerElement(range.endContainer)
  
  const startSpan = ascendToSpan(startEl)
  const endSpan = ascendToSpan(endEl)
  
  if (startSpan && startSpan === endSpan) return startSpan
  return null
}

/** 检查 Range 是否在同一个块级元素内（使用计算样式判断） */
const isWithinSameBlock = (ctx: DocCtx, range: Range): boolean => {
  const startEl = getContainerElement(range.startContainer)
  const endEl = getContainerElement(range.endContainer)
  const startBlock = ascendToBlockByStyle(ctx, startEl)
  const endBlock = ascendToBlockByStyle(ctx, endEl)
  return startBlock === endBlock
}

/** 检查 Range 是否完全覆盖某个节点的内容 */
const coversNode = (ctx: DocCtx, range: Range, node: HTMLElement): boolean => {
  const testRange = ctx.document.createRange()
  testRange.selectNodeContents(node)
  
  return (
    range.compareBoundaryPoints(Range.START_TO_START, testRange) <= 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, testRange) >= 0
  )
}

// ==================== 样式检测工具 ====================

/** 样式计算缓存 */
class StyleCache {
  private cache = new WeakMap<HTMLElement, CSSStyleDeclaration>()
  private ctx: DocCtx
  
  constructor(ctx: DocCtx) {
    this.ctx = ctx
  }
  
  get(el: HTMLElement): CSSStyleDeclaration {
    if (!this.cache.has(el)) {
      this.cache.set(el, this.ctx.view.getComputedStyle(el))
    }
    return this.cache.get(el)!
  }
  
  clear(): void {
    this.cache = new WeakMap()
  }
}

/** 读取 text-decoration 中的装饰类型集合 */
const getDecoTokens = (ctx: DocCtx, el: HTMLElement): Set<string> => {
  const cs = ctx.view.getComputedStyle(el)
  const decoLine = (cs as any).textDecorationLine || ''
  const decoFull = (cs as any).textDecoration || el.style.textDecoration || ''
  const decoStr = (decoLine || decoFull).toLowerCase()
  
  const tokens = new Set<string>()
  if (decoStr.includes('underline')) tokens.add('underline')
  if (decoStr.includes('line-through')) tokens.add('line-through')
  
  return tokens
}

/** 检查是否为粗体（支持 bold/bolder/数值） */
const isComputedBold = (ctx: DocCtx, el: HTMLElement): boolean => {
  const cs = ctx.view.getComputedStyle(el)
  const fw = cs.fontWeight
  
  if (fw === 'bold' || fw === 'bolder') return true
  if (fw === 'normal' || fw === 'lighter') return false
  
  const num = parseInt(fw, 10)
  return !isNaN(num) && num >= 600
}

/** 检查是否为斜体 */
const isComputedItalic = (ctx: DocCtx, el: HTMLElement): boolean => {
  const cs = ctx.view.getComputedStyle(el)
  return cs.fontStyle === 'italic' || cs.fontStyle === 'oblique'
}

// ==================== DOM 操作工具 ====================

/** 创建克隆的 span，保留样式但允许修改特定属性 */
const cloneSpanWithStyle = (
  ctx: DocCtx,
  from: HTMLElement,
  modifications?: {
    removeProps?: string[]
    setProps?: Record<string, string>
    decoTokens?: Set<string>
  }
): HTMLElement => {
  const span = ctx.document.createElement('span')
  const styleAttr = from.getAttribute('style') || ''
  span.setAttribute('style', styleAttr)
  
  // 移除指定属性
  if (modifications?.removeProps) {
    modifications.removeProps.forEach(prop => span.style.removeProperty(prop))
  }
  
  // 设置指定属性
  if (modifications?.setProps) {
    Object.entries(modifications.setProps).forEach(([prop, value]) => {
      span.style.setProperty(prop, value)
    })
  }
  
  // 处理 text-decoration
  if (modifications?.decoTokens !== undefined) {
    span.style.removeProperty('text-decoration-line')
    span.style.removeProperty('text-decoration')
    span.style.removeProperty('text-decoration-color')
    span.style.removeProperty('text-decoration-style')
    
    const tokens = Array.from(modifications.decoTokens).join(' ')
    if (tokens) {
      span.style.textDecoration = tokens
    }
  }
  
  return span
}

/** 合并相邻且样式相同的 span 元素 */
const mergeAdjacentSpans = (ctx: DocCtx, el: HTMLElement): void => {
  const targetStyle = el.getAttribute('style')
  
  // 向前合并
  let prev = el.previousSibling
  while (prev && prev.nodeType === Node.ELEMENT_NODE) {
    const prevEl = prev as HTMLElement
    if (prevEl.tagName === 'SPAN' && prevEl.getAttribute('style') === targetStyle) {
      while (prevEl.firstChild) {
        el.insertBefore(prevEl.firstChild, el.firstChild)
      }
      const toRemove = prevEl
      prev = prevEl.previousSibling
      toRemove.remove()
    } else {
      break
    }
  }
  
  // 向后合并
  let next = el.nextSibling
  while (next && next.nodeType === Node.ELEMENT_NODE) {
    const nextEl = next as HTMLElement
    if (nextEl.tagName === 'SPAN' && nextEl.getAttribute('style') === targetStyle) {
      while (nextEl.firstChild) {
        el.appendChild(nextEl.firstChild)
      }
      const toRemove = nextEl
      next = nextEl.nextSibling
      toRemove.remove()
    } else {
      break
    }
  }
}

/** 规范化嵌套的 span（展平并合并样式） */
const normalizeNestedSpans = (ctx: DocCtx, container: Node): void => {
  const walker = ctx.document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const el = node as HTMLElement
        return el.tagName === 'SPAN' 
          ? NodeFilter.FILTER_ACCEPT 
          : NodeFilter.FILTER_SKIP
      }
    }
  )
  
  const spans: HTMLElement[] = []
  let node: Node | null
  while ((node = walker.nextNode())) {
    spans.push(node as HTMLElement)
  }
  
  // 从内向外处理，展平嵌套
  spans.reverse().forEach(span => {
    const parent = span.parentElement
    if (parent && parent.tagName === 'SPAN') {
      // 合并样式到子 span
      const parentStyle = parent.getAttribute('style') || ''
      const childStyle = span.getAttribute('style') || ''
      
      // 简单合并（子样式优先）
      const mergedStyle = parentStyle + ';' + childStyle
      span.setAttribute('style', mergedStyle)
      
      // 提升到父节点位置
      const fragment = ctx.document.createDocumentFragment()
      while (span.firstChild) {
        fragment.appendChild(span.firstChild)
      }
      parent.replaceChild(fragment, span)
    }
  })
}

// ==================== 选区包裹操作 ====================

/** 用 span 包裹选区并应用样式 */
const surroundSelection = (
  ctx: DocCtx, 
  styles: Record<string, string>
): HTMLElement | null => {
  if (isCollapsed(ctx)) return null
  
  const range = getRange(ctx)
  if (!range) return null
  
  // 检查是否在同一块级元素内
  if (!isWithinSameBlock(ctx, range)) {
    console.warn('不支持跨块级元素的格式化')
    return null
  }
  
  const existing = commonSpanForRange(ctx, range)
  
  // 如果选区完全覆盖已有 span，直接修改该 span
  if (existing && coversNode(ctx, range, existing)) {
    Object.entries(styles).forEach(([prop, value]) => {
      if (value) {
        existing.style.setProperty(prop, value)
      } else {
        existing.style.removeProperty(prop)
      }
    })
    
    const newRange = ctx.document.createRange()
    newRange.selectNodeContents(existing)
    setRange(ctx, newRange)
    
    return existing
  }
  
  // 创建新 span
  const span = ctx.document.createElement('span')
  Object.entries(styles).forEach(([prop, value]) => {
    if (value) {
      span.style.setProperty(prop, value)
    }
  })
  
  // 提取内容并包裹
  const fragment = range.extractContents()
  
  // 规范化嵌套
  normalizeNestedSpans(ctx, fragment)
  
  span.appendChild(fragment)
  range.insertNode(span)
  
  // 恢复选区
  const newRange = ctx.document.createRange()
  newRange.selectNodeContents(span)
  setRange(ctx, newRange)
  
  return span
}

// ==================== 局部样式移除（三段拆分） ====================

interface SplitResult {
  pre: DocumentFragment
  mid: DocumentFragment
  post: DocumentFragment
}

/** 将元素按 range 拆分为三段 */
const splitElementByRange = (
  ctx: DocCtx,
  range: Range,
  el: HTMLElement
): SplitResult => {
  // 前段：从元素开始到选区开始
  const preRange = ctx.document.createRange()
  preRange.setStart(el, 0)
  preRange.setEnd(range.startContainer, range.startOffset)
  
  // 后段：从选区结束到元素结束
  const postRange = ctx.document.createRange()
  postRange.setStart(range.endContainer, range.endOffset)
  postRange.setEnd(el, el.childNodes.length)
  
  return {
    pre: preRange.cloneContents(),
    mid: range.cloneContents(),
    post: postRange.cloneContents()
  }
}

/** 检查 fragment 是否为空（无文本内容） */
const isFragmentEmpty = (frag: DocumentFragment): boolean => {
  const text = frag.textContent || ''
  return text.trim().length === 0
}

/** 局部移除 text-decoration */
const splitRemoveDeco = (
  ctx: DocCtx,
  range: Range,
  el: HTMLElement,
  removeType: 'underline' | 'line-through'
): void => {
  const currentTokens = getDecoTokens(ctx, el)
  const split = splitElementByRange(ctx, range, el)
  const parent = el.parentNode!
  
  const sequence: Node[] = []
  
  // 前段：保留所有装饰
  if (!isFragmentEmpty(split.pre)) {
    const preSpan = cloneSpanWithStyle(ctx, el, {
      decoTokens: currentTokens
    })
    preSpan.appendChild(split.pre)
    sequence.push(preSpan)
  }
  
  // 中段：移除指定装饰
  const midTokens = new Set(currentTokens)
  midTokens.delete(removeType)
  
  let midNode: Node
  if (midTokens.size > 0 || el.getAttribute('style')?.replace(/text-decoration[^;]*(;|$)/g, '').trim()) {
    const midSpan = cloneSpanWithStyle(ctx, el, {
      decoTokens: midTokens
    })
    midSpan.appendChild(split.mid)
    midNode = midSpan
  } else {
    midNode = split.mid
  }
  sequence.push(midNode)
  
  // 后段：保留所有装饰
  if (!isFragmentEmpty(split.post)) {
    const postSpan = cloneSpanWithStyle(ctx, el, {
      decoTokens: currentTokens
    })
    postSpan.appendChild(split.post)
    sequence.push(postSpan)
  }
  
  // 替换原元素
  sequence.forEach(node => parent.insertBefore(node, el))
  parent.removeChild(el)
  
  // 恢复选区到中段
  const newRange = ctx.document.createRange()
  if (midNode.nodeType === Node.ELEMENT_NODE) {
    newRange.selectNodeContents(midNode as Element)
  } else if (midNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    const firstChild = midNode.firstChild
    const lastChild = midNode.lastChild
    if (firstChild && lastChild) {
      newRange.setStartBefore(firstChild)
      newRange.setEndAfter(lastChild)
    }
  }
  setRange(ctx, newRange)
}

/** 局部移除指定样式属性 */
const splitRemoveStyle = (
  ctx: DocCtx,
  range: Range,
  el: HTMLElement,
  property: string,
  overrideValue?: string
): void => {
  const split = splitElementByRange(ctx, range, el)
  const parent = el.parentNode!
  
  const sequence: Node[] = []
  
  // 前段：保留原样式
  if (!isFragmentEmpty(split.pre)) {
    const preSpan = cloneSpanWithStyle(ctx, el, {})
    preSpan.appendChild(split.pre)
    sequence.push(preSpan)
  }
  
  // 中段：移除或覆盖指定属性
  const midSpan = cloneSpanWithStyle(ctx, el, {})
  if (overrideValue !== undefined) {
    midSpan.style.setProperty(property, overrideValue)
  } else {
    midSpan.style.removeProperty(property)
  }
  
  let midNode: Node
  const hasStyle = midSpan.getAttribute('style')?.trim()
  if (hasStyle) {
    midSpan.appendChild(split.mid)
    midNode = midSpan
  } else {
    midNode = split.mid
  }
  sequence.push(midNode)
  
  // 后段：保留原样式
  if (!isFragmentEmpty(split.post)) {
    const postSpan = cloneSpanWithStyle(ctx, el, {})
    postSpan.appendChild(split.post)
    sequence.push(postSpan)
  }
  
  // 替换原元素
  sequence.forEach(node => parent.insertBefore(node, el))
  parent.removeChild(el)
  
  // 恢复选区
  const newRange = ctx.document.createRange()
  if (midNode.nodeType === Node.ELEMENT_NODE) {
    newRange.selectNodeContents(midNode as Element)
  } else if (midNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    const firstChild = midNode.firstChild
    const lastChild = midNode.lastChild
    if (firstChild && lastChild) {
      newRange.setStartBefore(firstChild)
      newRange.setEndAfter(lastChild)
    }
  }
  setRange(ctx, newRange)
}

// ==================== 核心 Mark Engine ====================

export class MarkEngine {
  private ctx: DocCtx
  private styleCache: StyleCache
  
  constructor(ctx: DocCtx) {
    this.ctx = ctx
    this.styleCache = new StyleCache(ctx)
  }
  
  /**
   * 切换指定标记的应用状态
   * @returns 是否成功执行操作
   */
  toggle(spec: MarkSpec): boolean {
    if (isCollapsed(this.ctx)) return false
    
    const range = getRange(this.ctx)
    if (!range) return false
    
    // 检查是否在同一块级元素内
    if (!isWithinSameBlock(this.ctx, range)) {
      return false
    }
    
    // 清除样式缓存
    this.styleCache.clear()
    
    // 根据不同类型执行不同逻辑
    if (spec.type === 'underline' || spec.type === 'strike') {
      return this.toggleDecoration(spec, range)
    }
    
    if (spec.type === 'bold' || spec.type === 'italic') {
      return this.toggleFontStyle(spec, range)
    }
    
    // 其他样式：直接应用
    return this.applyStyle(spec, range)
  }
  
  /**
   * 处理 text-decoration 类型的切换
   */
  private toggleDecoration(spec: MarkSpec, range: Range): boolean {
    const decoType = spec.type === 'underline' ? 'underline' : 'line-through'
    
    // 先尝试创建或获取包裹 span
    let targetSpan = commonSpanForRange(this.ctx, range)
    if (!targetSpan) {
      targetSpan = surroundSelection(this.ctx, {})
      if (!targetSpan) return false
    }
    
    const currentTokens = getDecoTokens(this.ctx, targetSpan)
    const isActive = currentTokens.has(decoType)
    const fullyCovered = coversNode(this.ctx, range, targetSpan)
    
    // 情况1：已激活且是局部选区 → 局部移除
    if (isActive && !fullyCovered) {
      splitRemoveDeco(this.ctx, range, targetSpan, decoType)
      return true
    }
    
    // 情况2：切换整个 span 的状态
    const newTokens = new Set(currentTokens)
    if (newTokens.has(decoType)) {
      newTokens.delete(decoType)
    } else {
      newTokens.add(decoType)
    }
    
    // 应用新的装饰
    const decoStr = Array.from(newTokens).join(' ')
    if (decoStr) {
      targetSpan.style.textDecoration = decoStr
    } else {
      targetSpan.style.removeProperty('text-decoration')
    }
    
    mergeAdjacentSpans(this.ctx, targetSpan)
    return true
  }
  
  /**
   * 处理 bold/italic 的切换
   */
  private toggleFontStyle(spec: MarkSpec, range: Range): boolean {
    const isBold = spec.type === 'bold'
    const property = isBold ? 'font-weight' : 'font-style'
    const activeValue = isBold ? 'bold' : 'italic'
    const inactiveValue = 'normal'
    
    // 先尝试创建或获取包裹 span
    let targetSpan = commonSpanForRange(this.ctx, range)
    if (!targetSpan) {
      targetSpan = surroundSelection(this.ctx, {})
      if (!targetSpan) return false
    }
    
    const isActive = isBold 
      ? isComputedBold(this.ctx, targetSpan)
      : isComputedItalic(this.ctx, targetSpan)
    const fullyCovered = coversNode(this.ctx, range, targetSpan)
    
    // 情况1：已激活且是局部选区 → 局部移除
    if (isActive && !fullyCovered) {
      splitRemoveStyle(this.ctx, range, targetSpan, property, inactiveValue)
      return true
    }
    
    // 情况2：切换整个 span 的状态
    const newValue = isActive ? inactiveValue : activeValue
    targetSpan.style.setProperty(property, newValue)
    
    mergeAdjacentSpans(this.ctx, targetSpan)
    return true
  }
  
  /**
   * 应用普通样式（颜色、字号等）
   */
  private applyStyle(spec: MarkSpec, range: Range): boolean {
    const styles = styleMap[spec.type](spec.value)
    const target = surroundSelection(this.ctx, styles)
    
    if (!target) return false
    
    // 如果是链接类型，添加额外属性
    if (spec.type === 'link' && spec.attrs?.href) {
      target.setAttribute('data-href', spec.attrs.href)
      target.style.cursor = 'pointer'
    }
    
    mergeAdjacentSpans(this.ctx, target)
    return true
  }
  
  /**
   * 移除选区的所有格式
   */
  clearFormat(): boolean {
    if (isCollapsed(this.ctx)) return false
    
    const range = getRange(this.ctx)
    if (!range) return false
    
    const span = commonSpanForRange(this.ctx, range)
    if (!span) return false
    
    if (coversNode(this.ctx, range, span)) {
      // 完全覆盖：移除 span
      const fragment = this.ctx.document.createDocumentFragment()
      while (span.firstChild) {
        fragment.appendChild(span.firstChild)
      }
      span.parentNode?.replaceChild(fragment, span)
    } else {
      // 局部覆盖：拆分并移除中段样式
      const split = splitElementByRange(this.ctx, range, span)
      const parent = span.parentNode!
      const sequence: Node[] = []
      
      if (!isFragmentEmpty(split.pre)) {
        const preSpan = cloneSpanWithStyle(this.ctx, span, {})
        preSpan.appendChild(split.pre)
        sequence.push(preSpan)
      }
      
      sequence.push(split.mid)
      
      if (!isFragmentEmpty(split.post)) {
        const postSpan = cloneSpanWithStyle(this.ctx, span, {})
        postSpan.appendChild(split.post)
        sequence.push(postSpan)
      }
      
      sequence.forEach(node => parent.insertBefore(node, span))
      parent.removeChild(span)
    }
    
    return true
  }
  
  /**
   * 获取当前选区的激活标记
   */
  getActiveMarks(): Set<MarkType> {
    const range = getRange(this.ctx)
    if (!range) return new Set()
    
    const span = commonSpanForRange(this.ctx, range)
    if (!span) return new Set()
    
    const active = new Set<MarkType>()
    
    if (isComputedBold(this.ctx, span)) active.add('bold')
    if (isComputedItalic(this.ctx, span)) active.add('italic')
    
    const decoTokens = getDecoTokens(this.ctx, span)
    if (decoTokens.has('underline')) active.add('underline')
    if (decoTokens.has('line-through')) active.add('strike')
    
    const cs = this.ctx.view.getComputedStyle(span)
    if (cs.color && cs.color !== 'rgb(0, 0, 0)') active.add('color')
    if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') active.add('background')
    
    return active
  }
}
