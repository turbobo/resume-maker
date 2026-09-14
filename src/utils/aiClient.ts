// AI 接口统一客户端 — 通过服务端代理调用（API Key 不下发到前端）
// 统一处理：错误归一化、限流提示、网络异常

export class AIRequestError extends Error {
  code: string
  retryAfter?: number

  constructor(code: string, message: string, retryAfter?: number) {
    super(message)
    this.name = 'AIRequestError'
    this.code = code
    this.retryAfter = retryAfter
  }
}

interface APIResponse<T> {
  success: boolean
  code?: string
  message?: string
  retryAfter?: number
  data?: T
}

export async function postAI<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new AIRequestError('NETWORK_ERROR', '网络异常，请检查网络后重试')
  }

  let payload: APIResponse<T> | null = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok || !payload?.success) {
    const code = payload?.code || (response.status === 429 ? 'RATE_LIMITED' : 'SERVICE_ERROR')
    const message =
      payload?.message ||
      (response.status === 404 ? 'AI 服务不可用，请稍后再试' : '服务暂时不可用，请稍后再试')
    throw new AIRequestError(code, message, payload?.retryAfter)
  }

  return payload.data as T
}
