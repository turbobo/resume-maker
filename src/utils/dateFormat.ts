/**
 * Normalize date strings to YYYY-MM or YYYY format
 * Examples:
 *   "2021年3月" → "2021-03"
 *   "2021.03" → "2021-03"
 *   "2021/3" → "2021-03"
 *   "2021 年 3 月" → "2021-03"
 *   "至今" → "至今" (unchanged)
 */
export function normalizeDate(input: string): string {
  const trimmed = input.trim()

  // Keep special values unchanged
  if (/^(至今|现在|present|current)$/i.test(trimmed)) {
    return trimmed
  }

  // Already in YYYY-MM format
  if (/^\d{4}-\d{1,2}$/.test(trimmed)) {
    const [y, m] = trimmed.split('-')
    return `${y}-${m.padStart(2, '0')}`
  }

  // YYYY.MM or YYYY/MM or YYYY年M月
  const match = trimmed.match(/^(\d{4})[\s.\/年]+(\d{1,2})[\s月]*$/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}`
  }

  // Just year (YYYY)
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed
  }

  // Can't parse — return unchanged
  return trimmed
}