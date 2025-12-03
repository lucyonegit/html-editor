import { commonSpanForRange, coversNode, getRange, isCollapsed, setRange } from "../selection"
import { DocCtx, SplitResult } from "../type"

/** 检查 fragment 是否为空（无文本内容） */
export const isFragmentEmpty = (frag: DocumentFragment): boolean => {
  const text = frag.textContent || ''
  return text.trim().length === 0
}

/** 获取节点的容器元素（如果是文本节点则返回父元素） */
export const getContainerElement = (node: Node): HTMLElement => {
  return node.nodeType === Node.ELEMENT_NODE 
    ? node as HTMLElement 
    : node.parentElement!
}

/** 向上查找最近的 span 元素 */
export const ascendToSpan = (el: HTMLElement | null): HTMLElement | null => {
  while (el && el.tagName !== 'SPAN') {
    el = el.parentElement
  }
  return el
}

/** 基于计算样式查找最近的块级元素（非 inline 即视为块） */
export const ascendToBlockByStyle = (ctx: DocCtx, el: HTMLElement | null): HTMLElement | null => {
  while (el) {
    const display = ctx.view.getComputedStyle(el).display
    if (display !== 'inline') return el
    el = el.parentElement
  }
  return ctx.document.body
}

/** 检查 Range 是否在同一个块级元素内（使用计算样式判断） */
export const isWithinSameBlock = (ctx: DocCtx, range: Range): boolean => {
  const startEl = getContainerElement(range.startContainer)
  const endEl = getContainerElement(range.endContainer)
  const startBlock = ascendToBlockByStyle(ctx, startEl)
  const endBlock = ascendToBlockByStyle(ctx, endEl)
  return startBlock === endBlock
}

/** 规范化嵌套的 span（展平并合并样式） */
export const normalizeNestedSpans = (ctx: DocCtx, container: Node): void => {
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

/** 用 span 包裹选区并应用样式 */
export const surroundSelection = (
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

/** 创建克隆的 span，保留样式但允许修改特定属性 */
export const cloneSpanWithStyle = (
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
export const mergeAdjacentSpans = (el: HTMLElement): void => {
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

/** 将元素按 range 拆分为三段 */
export const splitElementByRange = (
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
