import { ascendToBlockByStyle, cloneSpanWithStyle, getContainerElement, isFragmentEmpty, isWithinSameBlock, mergeAdjacentSpans, splitElementByRange, surroundSelection } from "./dom"
import { commonSpanForRange, coversNode, getRange, isCollapsed, normalizeRangeBoundaries, setRange } from "./selection"
import { getDecoTokens, isComputedBold, isComputedItalic, splitRemoveDeco, splitRemoveStyle } from "./style"
import { DocCtx, MarkSpec, MarkType } from "./type"


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


export class MarkEngine {
  private ctx: DocCtx
  private styleCache: StyleCache
  
  constructor(ctx: DocCtx) {
    this.ctx = ctx
    this.styleCache = new StyleCache(ctx)
  }
  // 处理非跨块元素的样式
  private toggleWithinBlock(spec: MarkSpec, range: Range) {
    if (spec.type === 'underline' || spec.type === 'strike') {
        return this.toggleDecoration(spec, range)
      }
      if (spec.type === 'bold' || spec.type === 'italic') {
        return this.toggleFontStyle(spec, range)
      }
      return this.applyStyle(spec)
  } 
  // 处理跨块元素的样式
  private toggleAcrossBlocks(spec: MarkSpec, range: Range) {
    if (spec.type === 'underline' || spec.type === 'strike') {
        return this.toggleDecorationAcrossBlocks(spec, range)
      }
      if (spec.type === 'bold' || spec.type === 'italic') {
        return this.toggleFontStyleAcrossBlocks(spec, range)
      }
      const segments = this.collectBlockSubRanges(range)
      const styles = styleMap[spec.type](spec.value)
      let applied = false
      segments.forEach(r => {
        setRange(this.ctx, r)
        const created = surroundSelection(this.ctx, styles)
        if (created) {
          mergeAdjacentSpans(created)
          applied = true
        }
      })
      return applied
  }
  /**
   * 切换指定标记的应用状态
   * @returns 是否成功执行操作
   */
  toggle(spec: MarkSpec): boolean {
    if (isCollapsed(this.ctx)) return false
    
    const range = getRange(this.ctx)
    if (!range) return false
    const normalized = normalizeRangeBoundaries(this.ctx, range)

    const withinSame = isWithinSameBlock(this.ctx, normalized)
    
    // 检查是否在同一块级元素内
    if (!withinSame) {
      return false
    }
    
    // 清除样式缓存
    this.styleCache.clear()

    if (withinSame) {
      return this.toggleWithinBlock(spec, normalized)
    } else {
      return this.toggleAcrossBlocks(spec, normalized)
    }
  }
  
  /** 处理 text-decoration 类型的切换 */
  private toggleDecoration(spec: MarkSpec, range: Range): boolean {
    const decoType = spec.type === 'underline' ? 'underline' : 'line-through'

    let targetSpan = commonSpanForRange(this.ctx, range)
    if (!targetSpan) {
      targetSpan = surroundSelection(this.ctx, {})
      if (!targetSpan) return false
    }

    const currentTokens = getDecoTokens(this.ctx, targetSpan)
    const isActive = currentTokens.has(decoType)
    const fullyCovered = coversNode(this.ctx, range, targetSpan)

    if (!isActive && !fullyCovered) {
      const selSpan = surroundSelection(this.ctx, {})
      if (!selSpan) return false
      const newTokens = new Set(currentTokens)
      newTokens.add(decoType)
      const decoStr = Array.from(newTokens).join(' ')
      if (decoStr) {
        selSpan.style.textDecoration = decoStr
      } else {
        selSpan.style.removeProperty('text-decoration')
      }
      mergeAdjacentSpans(selSpan)
      return true
    }

    if (isActive && !fullyCovered) {
      splitRemoveDeco(this.ctx, range, targetSpan, decoType)
      return true
    }

    const newTokens = new Set(currentTokens)
    if (newTokens.has(decoType)) {
      newTokens.delete(decoType)
    } else {
      newTokens.add(decoType)
    }
    const decoStr = Array.from(newTokens).join(' ')
    if (decoStr) {
      targetSpan.style.textDecoration = decoStr
    } else {
      targetSpan.style.removeProperty('text-decoration')
    }
    mergeAdjacentSpans(targetSpan)
    return true
  }
  
  /** 处理 bold/italic 的切换 */
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
    
    mergeAdjacentSpans(targetSpan)
    return true
  }


  private collectBlockSubRanges(range: Range): Range[] {
    const startEl = getContainerElement(range.startContainer)
    const endEl = getContainerElement(range.endContainer)
    const startBlock = ascendToBlockByStyle(this.ctx, startEl)
    const endBlock = ascendToBlockByStyle(this.ctx, endEl)
    if (!startBlock || !endBlock) return [range.cloneRange()]
    if (startBlock === endBlock) return [range.cloneRange()]
    const ranges: Range[] = []
    const first = this.ctx.document.createRange()
    first.setStart(range.startContainer, range.startOffset)
    first.setEnd(startBlock, startBlock.childNodes.length)
    ranges.push(first)
    const walker = this.ctx.document.createTreeWalker(
      this.ctx.document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const el = node as HTMLElement
          const display = this.ctx.view.getComputedStyle(el).display
          return display !== 'inline' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
        }
      }
    )
    ;(walker as any).currentNode = startBlock
    let node: Node | null
    while ((node = walker.nextNode())) {
      if (node === endBlock) break
      const mid = this.ctx.document.createRange()
      mid.selectNodeContents(node as Element)
      ranges.push(mid)
    }
    const last = this.ctx.document.createRange()
    last.setStart(endBlock, 0)
    last.setEnd(range.endContainer, range.endOffset)
    ranges.push(last)
    return ranges
  }

  private isRangeActiveDeco(range: Range, deco: 'underline' | 'line-through'): boolean {
    const span = commonSpanForRange(this.ctx, range)
    if (!span) return false
    if (!coversNode(this.ctx, range, span)) return false
    const tokens = getDecoTokens(this.ctx, span)
    return tokens.has(deco)
  }

  private isRangeActiveFont(range: Range, isBold: boolean): boolean {
    const span = commonSpanForRange(this.ctx, range)
    if (!span) return false
    if (!coversNode(this.ctx, range, span)) return false
    return isBold ? isComputedBold(this.ctx, span) : isComputedItalic(this.ctx, span)
  }

  private toggleDecorationAcrossBlocks(spec: MarkSpec, range: Range): boolean {
    this.normalizeInlineTagsInRange(range)
    const deco = spec.type === 'underline' ? 'underline' : 'line-through'
    const segments = this.collectBlockSubRanges(range)
    const activeAll = segments.length > 0 && segments.every(r => this.isRangeActiveDeco(r, deco))
    if (activeAll) {
      segments.forEach(r => {
        const span = commonSpanForRange(this.ctx, r)
        if (span && coversNode(this.ctx, r, span)) {
          splitRemoveDeco(this.ctx, r, span, deco)
        }
      })
      return true
    }
    segments.forEach(r => {
      let span = commonSpanForRange(this.ctx, r)
      if (span && coversNode(this.ctx, r, span)) {
        const tokens = getDecoTokens(this.ctx, span)
        const newTokens = new Set(tokens)
        newTokens.add(deco)
        const str = Array.from(newTokens).join(' ')
        span.style.textDecoration = str
        mergeAdjacentSpans(span)
      } else {
        const created = surroundSelection(this.ctx, {})
        if (created) {
          const tokens = getDecoTokens(this.ctx, created)
          const newTokens = new Set(tokens)
          newTokens.add(deco)
          const str = Array.from(newTokens).join(' ')
          created.style.textDecoration = str
          mergeAdjacentSpans(created)
        }
      }
    })
    return true
  }

  private toggleFontStyleAcrossBlocks(spec: MarkSpec, range: Range): boolean {
    this.normalizeInlineTagsInRange(range)
    const isBold = spec.type === 'bold'
    const property = isBold ? 'font-weight' : 'font-style'
    const activeValue = isBold ? 'bold' : 'italic'
    const inactiveValue = 'normal'
    const segments = this.collectBlockSubRanges(range)
    const activeAll = segments.length > 0 && segments.every(r => this.isRangeActiveFont(r, isBold))
    if (activeAll) {
      segments.forEach(r => {
        const span = commonSpanForRange(this.ctx, r)
        if (span && coversNode(this.ctx, r, span)) {
          splitRemoveStyle(this.ctx, r, span, property, inactiveValue)
        }
      })
      return true
    }
    segments.forEach(r => {
      let span = commonSpanForRange(this.ctx, r)
      if (span && coversNode(this.ctx, r, span)) {
        span.style.setProperty(property, activeValue)
        mergeAdjacentSpans(span)
      } else {
        const created = surroundSelection(this.ctx, {})
        if (created) {
          created.style.setProperty(property, activeValue)
          mergeAdjacentSpans(created)
        }
      }
    })
    return true
  }

  private normalizeInlineTagsInRange(range: Range): void {
    const body = this.ctx.document.body
    const walker = this.ctx.document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT)
    let node: Node | null
    const map: Record<string, { prop: string, value: string }> = {
      B: { prop: 'font-weight', value: 'bold' },
      STRONG: { prop: 'font-weight', value: 'bold' },
      I: { prop: 'font-style', value: 'italic' },
      EM: { prop: 'font-style', value: 'italic' },
      U: { prop: 'text-decoration', value: 'underline' },
      S: { prop: 'text-decoration', value: 'line-through' },
      STRIKE: { prop: 'text-decoration', value: 'line-through' }
    }
    while ((node = walker.nextNode())) {
      const el = node as HTMLElement
      const tag = el.tagName
      if (!map[tag]) continue
      const inter = (range as any).intersectsNode ? (range as any).intersectsNode(el) : true
      if (!inter) continue
      const span = this.ctx.document.createElement('span')
      const styleAttr = el.getAttribute('style') || ''
      if (styleAttr) span.setAttribute('style', styleAttr)
      span.style.setProperty(map[tag].prop, map[tag].value)
      while (el.firstChild) span.appendChild(el.firstChild)
      el.parentNode?.replaceChild(span, el)
    }
  }
  
  /**
   * 应用普通样式（颜色、字号等）
   */
  private applyStyle(spec: MarkSpec): boolean {
    const styles = styleMap[spec.type](spec.value)
    const range = getRange(this.ctx)
    if (!range) return false

    const normalized = normalizeRangeBoundaries(this.ctx, range)

    let targetSpan = commonSpanForRange(this.ctx, normalized)

    if (!targetSpan) {
      const created = surroundSelection(this.ctx, styles)
      if (!created) return false
      if (spec.type === 'link' && spec.attrs?.href) {
        created.setAttribute('data-href', spec.attrs.href)
        created.style.cursor = 'pointer'
      }
      // 合并子元素
      mergeAdjacentSpans(created)
       //清空所有子元素的样式，只应用父节点的样式
      Array.from(created.children).forEach(child => {
        child.removeAttribute('style')
      })
      return true
    }

    const fullyCovered = coversNode(this.ctx, normalized, targetSpan)

    if (fullyCovered) {
      Object.entries(styles).forEach(([prop, value]) => {
        if (value) {
          targetSpan.style.setProperty(prop, value)
        } else {
          targetSpan.style.removeProperty(prop)
        }
      })
      if (spec.type === 'link' && spec.attrs?.href) {
        targetSpan.setAttribute('data-href', spec.attrs.href)
        targetSpan.style.cursor = 'pointer'
      }
      mergeAdjacentSpans(targetSpan)
      const newRange = this.ctx.document.createRange()
      newRange.selectNodeContents(targetSpan)
      setRange(this.ctx, newRange)
      return true
    }
    

    const split = splitElementByRange(this.ctx, normalized, targetSpan)
    const parent = targetSpan.parentNode!
    const sequence: Node[] = []

    if (!isFragmentEmpty(split.pre)) {
      const preSpan = cloneSpanWithStyle(this.ctx, targetSpan, {})
      preSpan.appendChild(split.pre)
      sequence.push(preSpan)
    }

    const midSpan = cloneSpanWithStyle(this.ctx, targetSpan, {})
    Object.entries(styles).forEach(([prop, value]) => {
      if (value) {
        midSpan.style.setProperty(prop, value)
      } else {
        midSpan.style.removeProperty(prop)
      }
    })
    if (spec.type === 'link' && spec.attrs?.href) {
      midSpan.setAttribute('data-href', spec.attrs.href)
      midSpan.style.cursor = 'pointer'
    }
    let midNode: Node
    const hasStyle = (midSpan.getAttribute('style') || '').trim()
    if (hasStyle) {
      midSpan.appendChild(split.mid)
      midNode = midSpan
    } else {
      midNode = split.mid
    }
    sequence.push(midNode)

    if (!isFragmentEmpty(split.post)) {
      const postSpan = cloneSpanWithStyle(this.ctx, targetSpan, {})
      postSpan.appendChild(split.post)
      sequence.push(postSpan)
    }

    sequence.forEach(node => parent.insertBefore(node, targetSpan))
    parent.removeChild(targetSpan)

    if (midNode.nodeType === Node.ELEMENT_NODE) {
      mergeAdjacentSpans(midNode as HTMLElement)
    }

    const newRange = this.ctx.document.createRange()
    if (midNode.nodeType === Node.ELEMENT_NODE) {
      newRange.selectNodeContents(midNode as Element)
    } else if (midNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      const firstChild = (midNode as DocumentFragment).firstChild
      const lastChild = (midNode as DocumentFragment).lastChild
      if (firstChild && lastChild) {
        newRange.setStartBefore(firstChild)
        newRange.setEndAfter(lastChild)
      }
    }
    setRange(this.ctx, newRange)
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
