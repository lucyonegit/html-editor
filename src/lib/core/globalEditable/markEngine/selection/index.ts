import { DocCtx } from "../type"

/** 检查 Range 是否在同一个 span 内 */
export const commonSpanForRange = (ctx: DocCtx, range: Range): HTMLElement | null => {
  void ctx
  const collectAncestorSpans = (node: Node): HTMLElement[] => {
    const spans: HTMLElement[] = []
    let cur: Node | null = node
    if (cur.nodeType === Node.TEXT_NODE) cur = cur.parentNode
    while (cur && cur.nodeType === Node.ELEMENT_NODE) {
      const el = cur as HTMLElement
      if (el.tagName === 'SPAN') spans.push(el)
      cur = el.parentNode
    }
    return spans
  }

  const startSpans = collectAncestorSpans(range.startContainer)
  const endSpans = collectAncestorSpans(range.endContainer)

  for (let i = 0; i < startSpans.length; i++) {
    const candidate = startSpans[i]
    if (endSpans.includes(candidate)) return candidate
  }
  return null
}

/** 检查是否为折叠选区 */
export const isCollapsed = (ctx: DocCtx): boolean => {
  const sel = ctx.document.getSelection()
  return !sel || sel.rangeCount === 0 || sel.isCollapsed
}

/** 获取当前选区的 Range，带安全检查 */
export const getRange = (ctx: DocCtx): Range | null => {
  const sel = ctx.document.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  return sel.getRangeAt(0)
}

/** 安全地设置选区 */
export const setRange = (ctx: DocCtx, range: Range): void => {
  const sel = ctx.document.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}

/** 检查 Range 是否完全覆盖某个节点的内容 */
export const coversNode = (ctx: DocCtx, range: Range, node: HTMLElement): boolean => {
  const testRange = ctx.document.createRange()
  testRange.selectNodeContents(node)
  
  return (
    range.compareBoundaryPoints(Range.START_TO_START, testRange) <= 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, testRange) >= 0
  )
}

export const normalizeRangeBoundaries = (ctx: DocCtx, range: Range): Range => {
  const normalizeBoundary = (container: Node, offset: number, isStart: boolean): { container: Node, offset: number } => {
    if (container.nodeType === Node.TEXT_NODE) {
      const text = container as Text
      if (offset <= 0) return { container: text, offset: 0 }
      if (offset >= text.length) return { container: text, offset: text.length }
      const right = text.splitText(offset)
      return isStart ? { container: right, offset: 0 } : { container: text, offset: text.length }
    }
    return { container, offset }
  }

  const s = normalizeBoundary(range.startContainer, range.startOffset, true)
  const e = normalizeBoundary(range.endContainer, range.endOffset, false)
  const newRange = ctx.document.createRange()
  newRange.setStart(s.container, s.offset)
  newRange.setEnd(e.container, e.offset)
  setRange(ctx, newRange)
  return newRange
}
