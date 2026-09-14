// HTTP 响应工具 — 统一 JSON 响应格式
// 成功: { success: true, data }
// 失败: { success: false, code, message }

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' }

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  })
}

export function errorResponse(code, message, status = 400, extra = {}, extraHeaders = {}) {
  return new Response(JSON.stringify({ success: false, code, message, ...extra }), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  })
}

// 读取 JSON 请求体，解析失败返回 null
export async function readJsonBody(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

// 安全取字符串字段：非字符串返回空串，超长截断
export function pickText(value, maxLength = 500) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed
}
