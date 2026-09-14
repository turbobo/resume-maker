// IP 限流器 — 内存滑动窗口（EdgeOne Cloud Functions 实例级）
//
// 说明：Cloud Functions 多实例部署且实例内存独立，本限流拦截单实例上的高频调用，
// 作为防刷第一道防线；实例回收后计数清零属预期行为。
// 时间维度：短窗口（突发保护）+ 每日上限（北京时间 0 点重置）+ 全站每日总上限。

import { errorResponse } from './http.js'

const DAY_MS = 24 * 60 * 60 * 1000
const TZ_OFFSET_MS = 8 * 60 * 60 * 1000 // 北京时间（UTC+8）

function toDayKey(now) {
  return new Date(now + TZ_OFFSET_MS).toISOString().slice(0, 10)
}

function msUntilNextDay(now) {
  return DAY_MS - ((now + TZ_OFFSET_MS) % DAY_MS)
}

/**
 * @param {object} options
 * @param {number} options.windowMs     短窗口时长（毫秒）
 * @param {number} options.windowMax    短窗口内单 IP 最大次数
 * @param {number} options.dailyMax     单 IP 每日最大次数
 * @param {number} options.globalDailyMax 全站每日最大次数
 */
export function createRateLimiter({ windowMs, windowMax, dailyMax, globalDailyMax }) {
  const ipRecords = new Map()
  let globalDay = ''
  let globalCount = 0

  // 清理过期记录，避免 Map 无限增长（仅在规模较大时全量扫描）
  function prune(now) {
    if (ipRecords.size < 2000) return
    const day = toDayKey(now)
    for (const [ip, rec] of ipRecords) {
      const lastHit = rec.hits[rec.hits.length - 1] || 0
      if (now - lastHit > windowMs && rec.day !== day) ipRecords.delete(ip)
    }
  }

  /**
   * @param {string} ip
   * @param {number} [now]
   * @returns {{ allowed: boolean, scope?: string, retryAfterSec?: number }}
   */
  function check(ip, now = Date.now()) {
    const day = toDayKey(now)

    if (globalDay !== day) {
      globalDay = day
      globalCount = 0
    }
    if (globalDailyMax > 0 && globalCount >= globalDailyMax) {
      return { allowed: false, scope: 'global', retryAfterSec: Math.ceil(msUntilNextDay(now) / 1000) }
    }

    let rec = ipRecords.get(ip)
    if (!rec) {
      rec = { hits: [], day, dayCount: 0 }
      ipRecords.set(ip, rec)
    }
    if (rec.day !== day) {
      rec.day = day
      rec.dayCount = 0
      rec.hits = []
    }

    if (rec.hits.length > 0) {
      const cutoff = now - windowMs
      rec.hits = rec.hits.filter((t) => t > cutoff)
    }
    if (dailyMax > 0 && rec.dayCount >= dailyMax) {
      return { allowed: false, scope: 'daily', retryAfterSec: Math.ceil(msUntilNextDay(now) / 1000) }
    }
    if (windowMax > 0 && rec.hits.length >= windowMax) {
      const retryAfterSec = Math.max(1, Math.ceil((rec.hits[0] + windowMs - now) / 1000))
      return { allowed: false, scope: 'burst', retryAfterSec }
    }

    rec.hits.push(now)
    rec.dayCount += 1
    globalCount += 1
    prune(now)
    return { allowed: true }
  }

  return { check }
}

// 将限流结果转为 429 响应（含 Retry-After 头）
const SCOPE_MESSAGES = {
  burst: (retryAfterSec) => `操作过于频繁，请 ${retryAfterSec} 秒后重试`,
  daily: () => '今日 AI 使用次数已达上限，请明日再试',
  global: () => '今日全站 AI 额度已用完，请明日再试',
}

export function rateLimitResponse(rate) {
  const retryAfterSec = rate.retryAfterSec || 60
  const message = (SCOPE_MESSAGES[rate.scope] || SCOPE_MESSAGES.burst)(retryAfterSec)
  return errorResponse('RATE_LIMITED', message, 429, { retryAfter: retryAfterSec }, { 'Retry-After': String(retryAfterSec) })
}
