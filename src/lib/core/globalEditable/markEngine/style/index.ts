import { cloneSpanWithStyle, isFragmentEmpty, splitElementByRange } from "../dom"
import { setRange } from "../selection"
import { DocCtx } from "../type"

/** 检查是否为粗体（支持 bold/bolder/数值） */
export const isComputedBold = (ctx: DocCtx, el: HTMLElement): boolean => {
  const cs = ctx.view.getComputedStyle(el)
  const fw = cs.fontWeight
  
  if (fw === 'bold' || fw === 'bolder') return true
  if (fw === 'normal' || fw === 'lighter') return false
  
  const num = parseInt(fw, 10)
  return !isNaN(num) && num >= 600
}

/** 检查是否为斜体 */
export const isComputedItalic = (ctx: DocCtx, el: HTMLElement): boolean => {
  const cs = ctx.view.getComputedStyle(el)
  return cs.fontStyle === 'italic' || cs.fontStyle === 'oblique'
}

/** 读取 text-decoration 中的装饰类型集合 */
export const getDecoTokens = (ctx: DocCtx, el: HTMLElement): Set<string> => {
  const cs = ctx.view.getComputedStyle(el)
  const decoLine = (cs as any).textDecorationLine || ''
  const decoFull = (cs as any).textDecoration || el.style.textDecoration || ''
  const decoStr = (decoLine || decoFull).toLowerCase()
  
  const tokens = new Set<string>()
  if (decoStr.includes('underline')) tokens.add('underline')
  if (decoStr.includes('line-through')) tokens.add('line-through')
  
  return tokens
}

/** 局部移除 text-decoration */
export const splitRemoveDeco = (
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
export const splitRemoveStyle = (
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