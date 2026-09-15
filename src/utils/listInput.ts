// 多行输入框的列表输入辅助（纯函数）
// 在支持列表的行按 Enter 时：自动延续有序（1. 2. 3.）/ 无序（- • * ·）列表；
// 空列表项按 Enter 则移除本行标记、退出列表。

export interface ListEnterResult {
  /** 是否接管了本次回车 */
  handled: boolean
  /** 处理后的完整文本 */
  value?: string
  /** 处理后的光标位置 */
  cursor?: number
}

const UNORDERED_RE = /^(\s*)([-*•·])\s+(.*)$/
// 有序列表：分隔符支持 . 、 )，其后空格可选（中文习惯 "1、内容" 无空格）
const ORDERED_RE = /^(\s*)(\d+)([.、)])\s*(.*)$/

/**
 * 处理列表行中的回车
 * @param value    当前完整文本
 * @param cursorPos 光标位置（selectionStart）
 * @param hasSelection 是否存在选区（有选区时不接管）
 */
export function handleListEnter(value: string, cursorPos: number, hasSelection = false): ListEnterResult {
  if (hasSelection) return { handled: false }

  const lineStart = value.lastIndexOf('\n', cursorPos - 1) + 1
  const currentLine = value.slice(lineStart, cursorPos)

  const unordered = currentLine.match(UNORDERED_RE)
  const ordered = currentLine.match(ORDERED_RE)
  if (!unordered && !ordered) return { handled: false }

  const isEmptyItem =
    (unordered !== null && !unordered[3].trim()) || (ordered !== null && !ordered[4].trim())

  if (isEmptyItem) {
    // 空列表项：删除本行标记，退出列表（光标后的内容保留）
    const nextValue = value.slice(0, lineStart) + value.slice(cursorPos)
    return { handled: true, value: nextValue, cursor: lineStart }
  }

  // 续行：插入换行 + 新标记（有序编号自动 +1）
  const marker = unordered
    ? `${unordered[1]}${unordered[2]} `
    : `${ordered![1]}${Number(ordered![2]) + 1}${ordered![3]} `
  const insert = `\n${marker}`
  return {
    handled: true,
    value: value.slice(0, cursorPos) + insert + value.slice(cursorPos),
    cursor: cursorPos + insert.length,
  }
}

// ─── 列表快捷按钮：对当前行或选中行应用/取消列表标记 ───

export type ListType = 'unordered' | 'ordered'

export interface ListApplyResult {
  value: string
  selectionStart: number
  selectionEnd: number
}

function hasMarker(line: string, type: ListType): boolean {
  return type === 'unordered' ? /^\s*[-*•·]\s+/.test(line) : /^\s*\d+[.、)]\s*/.test(line)
}

function stripMarker(line: string): string {
  return line.replace(/^(\s*)(?:[-*•·]\s+|\d+[.、)]\s*)/, '$1')
}

/**
 * 对选区（或光标所在行）应用列表标记：已是同类型列表则取消（toggle）；
 * 类型不同则替换标记；有序列表按行递增编号。
 */
export function applyListToggle(value: string, start: number, end: number, type: ListType): ListApplyResult {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  // 选区 end 恰好落在下一行行首时，不计入末行
  const effectiveEnd = end > start && value[end - 1] === '\n' ? end - 1 : end
  const nlAfter = value.indexOf('\n', effectiveEnd)
  const lineEnd = nlAfter === -1 ? value.length : nlAfter

  const lines = value.slice(lineStart, lineEnd).split('\n')
  const allTyped = lines.every((line) => hasMarker(line, type))

  let orderedIndex = 1
  const deltas: number[] = []
  const newLines = lines.map((line) => {
    const stripped = stripMarker(line)
    let next: string
    if (allTyped) {
      next = stripped
    } else if (type === 'unordered') {
      next = stripped.replace(/^(\s*)/, '$1- ')
    } else {
      next = stripped.replace(/^(\s*)/, `$1${orderedIndex}. `)
      orderedIndex += 1
    }
    deltas.push(next.length - line.length)
    return next
  })

  const nextValue = value.slice(0, lineStart) + newLines.join('\n') + value.slice(lineEnd)

  // 选区映射：按行内偏移 + 前缀变化量换算
  const startOffset = Math.min(Math.max(start - lineStart + deltas[0], 0), newLines[0].length)
  let endLineIdx = lines.length - 1
  {
    let begin = lineStart
    for (let i = 0; i < lines.length; i++) {
      if (effectiveEnd <= begin + lines[i].length) {
        endLineIdx = i
        break
      }
      begin += lines[i].length + 1
    }
  }
  const endLineOldBegin = lineStart + lines.slice(0, endLineIdx).reduce((sum, l) => sum + l.length + 1, 0)
  const endOffset = effectiveEnd - endLineOldBegin
  const endLineNewBegin = lineStart + newLines.slice(0, endLineIdx).reduce((sum, l) => sum + l.length + 1, 0)
  const newEndOffset = Math.min(Math.max(endOffset + deltas[endLineIdx], 0), newLines[endLineIdx].length)

  return {
    value: nextValue,
    selectionStart: lineStart + startOffset,
    selectionEnd: endLineNewBegin + newEndOffset,
  }
}
