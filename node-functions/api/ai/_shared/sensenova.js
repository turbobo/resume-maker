// 商汤日日新（SenseNova）API 调用封装
// 接口兼容 OpenAI Chat Completions 协议，Key 由服务端环境变量提供，不下发到前端。
//
// 默认模型 deepseek-v4-flash（Token Plan 免费档：150 次 / 5 小时；支持思考模式与工具调用）
// 网关约束（官方文档）：请求参数表未列出的字段一律拒收（如 response_format），
// 因此请求体保持最小集：model / messages / temperature / max_tokens；
// 边界：temperature ∈ [0,2]，max_tokens ∈ [1, 65536]。

const DEFAULT_BASE_URL = 'https://token.sensenova.cn/v1'
const DEFAULT_MODEL = 'deepseek-v4-flash'
const REQUEST_TIMEOUT_MS = 55 * 1000

export class UpstreamError extends Error {
  constructor(message, { status = 502, code = 'UPSTREAM_ERROR' } = {}) {
    super(message)
    this.name = 'UpstreamError'
    this.status = status
    this.code = code
  }
}

// 从环境变量读取 AI 配置（每次请求读取，支持控制台改动态生效）
export function readAIConfig(env) {
  const apiKey = String(env?.SENSENOVA_API_KEY || '').trim()
  const baseUrl = String(env?.SENSENOVA_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, '')
  const model = String(env?.SENSENOVA_MODEL || DEFAULT_MODEL).trim()
  return { apiKey, baseUrl, model, configured: apiKey.length > 0 }
}

// 提取上游错误体的可读信息（商汤网关错误体形如 {"error":{"message":"..."}}）
function extractUpstreamMessage(bodyText) {
  try {
    const parsed = JSON.parse(bodyText)
    const message = parsed?.error?.message
    if (typeof message === 'string' && message.trim()) return message.trim()
  } catch {
    // 非 JSON 错误体，按原文截断
  }
  return bodyText.slice(0, 200)
}

/**
 * 调用商汤 Chat Completions
 * @returns {Promise<string>} 模型输出正文
 */
export async function chatCompletion(config, { system, user, maxTokens = 2000, temperature = 0.7 }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '')
      if (response.status === 429) {
        throw new UpstreamError('AI 服务繁忙，请稍后重试', { status: 429, code: 'UPSTREAM_RATE_LIMITED' })
      }
      if (response.status === 401) {
        throw new UpstreamError('AI 服务鉴权失败，请检查服务端 API Key', { status: 502, code: 'UPSTREAM_AUTH_ERROR' })
      }
      throw new UpstreamError(`AI 服务返回 ${response.status}: ${extractUpstreamMessage(bodyText)}`, { status: 502 })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      throw new UpstreamError('AI 返回内容为空', { status: 502, code: 'UPSTREAM_EMPTY' })
    }
    return content.trim()
  } catch (err) {
    if (err instanceof UpstreamError) throw err
    if (err.name === 'AbortError') {
      throw new UpstreamError('AI 请求超时，请稍后重试', { status: 504, code: 'UPSTREAM_TIMEOUT' })
    }
    throw new UpstreamError(`AI 服务连接失败: ${err.message}`, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}

// 从模型输出中提取 JSON（兼容 ```json 代码块包裹等常见格式）
export function extractJson(text) {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1].trim() : trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    return null
  }
}
