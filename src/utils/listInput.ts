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
