import { ascendToSpan, getContainerElement } from "../dom"
import { DocCtx } from "../type"

/** 检查 Range 是否在同一个 span 内 */
export const commonSpanForRange = (ctx: DocCtx, range: Range): HTMLElement | null => {
  const startEl = getContainerElement(range.startContainer)
  const endEl = getContainerElement(range.endContainer)
  
  const startSpan = ascendToSpan(startEl)
  const endSpan = ascendToSpan(endEl)
  debugger
  
  if (startSpan && startSpan === endSpan) return startSpan
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