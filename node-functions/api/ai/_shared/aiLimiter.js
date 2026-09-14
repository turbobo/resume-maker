// 全站共享的 AI 限流器（惰性初始化，同一实例内所有 AI 接口共用一份额度）
import { createRateLimiter } from './rateLimit.js'

const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_WINDOW_MAX = 8
const RATE_DAILY_MAX = 50
const RATE_GLOBAL_DAILY_MAX = 2000

let limiter = null

function intFromEnv(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

// 首次请求时读取环境变量覆盖默认阈值，之后复用同一实例
export function getAILimiter(env) {
  if (!limiter) {
    limiter = createRateLimiter({
      windowMs: RATE_WINDOW_MS,
      windowMax: intFromEnv(env?.AI_RATE_WINDOW_MAX, RATE_WINDOW_MAX),
      dailyMax: intFromEnv(env?.AI_RATE_DAILY_MAX, RATE_DAILY_MAX),
      globalDailyMax: intFromEnv(env?.AI_RATE_GLOBAL_DAILY_MAX, RATE_GLOBAL_DAILY_MAX),
    })
  }
  return limiter
}

// 从 context 提取客户端 IP：仅使用平台注入的 clientIp（权威值），
// 不读 x-forwarded-for 等请求头，避免伪造头绕过限流
// （极端情况下 clientIp 缺失则共享 'unknown' 额度，宁可收紧不可放空）
export function resolveClientIp(context) {
  return context?.clientIp || 'unknown'
}
