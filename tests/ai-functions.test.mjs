// AI 接口与限流逻辑测试（Node 内置 test runner，零依赖）
// 运行：npm test

import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { createRateLimiter } from '../node-functions/api/ai/_shared/rateLimit.js'
import { extractJson } from '../node-functions/api/ai/_shared/sensenova.js'
import { onRequestPost as analyzeHandler } from '../node-functions/api/ai/analyze.js'
import { onRequestPost as rewriteHandler } from '../node-functions/api/ai/rewrite.js'

const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
})

function makeContext(body, { clientIp = '10.0.0.1', env = { SENSENOVA_API_KEY: 'test-key' }, url = 'https://example.com/api/ai/analyze' } = {}) {
  return {
    request: new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    env,
    clientIp,
  }
}

function mockModelContent(content) {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
}

const RESUME = {
  name: '张三',
  title: '前端工程师',
  summary: '8 年前端经验',
  skills: 'React, TypeScript',
  experiences: [{ company: 'A 公司', title: '前端', startDate: '2021-03', endDate: '至今', description: '负责核心系统' }],
  projects: [],
  education: [],
  customSections: [],
}

// ─── 限流器 ───

test('限流器：短窗口内超过阈值被拦截，窗口滑动后恢复', () => {
  const limiter = createRateLimiter({ windowMs: 1000, windowMax: 2, dailyMax: 100, globalDailyMax: 1000 })
  const t0 = Date.now()
  assert.equal(limiter.check('ip-1', t0).allowed, true)
  assert.equal(limiter.check('ip-1', t0 + 100).allowed, true)
  const blocked = limiter.check('ip-1', t0 + 200)
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.scope, 'burst')
  assert.ok(blocked.retryAfterSec >= 1)
  // 窗口滑动后恢复
  assert.equal(limiter.check('ip-1', t0 + 1100).allowed, true)
})

test('限流器：每日上限独立于短窗口', () => {
  const limiter = createRateLimiter({ windowMs: 1000, windowMax: 10, dailyMax: 3, globalDailyMax: 1000 })
  const t0 = Date.now()
  assert.equal(limiter.check('ip-2', t0).allowed, true)
  assert.equal(limiter.check('ip-2', t0 + 5000).allowed, true)
  assert.equal(limiter.check('ip-2', t0 + 10000).allowed, true)
  const blocked = limiter.check('ip-2', t0 + 15000)
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.scope, 'daily')
})

test('限流器：全站每日总量限制', () => {
  const limiter = createRateLimiter({ windowMs: 1000, windowMax: 10, dailyMax: 10, globalDailyMax: 2 })
  const t0 = Date.now()
  assert.equal(limiter.check('ip-a', t0).allowed, true)
  assert.equal(limiter.check('ip-b', t0 + 10).allowed, true)
  const blocked = limiter.check('ip-c', t0 + 20)
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.scope, 'global')
})

test('限流器：不同 IP 互不影响', () => {
  const limiter = createRateLimiter({ windowMs: 1000, windowMax: 1, dailyMax: 100, globalDailyMax: 1000 })
  const t0 = Date.now()
  assert.equal(limiter.check('ip-x', t0).allowed, true)
  assert.equal(limiter.check('ip-y', t0).allowed, true)
  assert.equal(limiter.check('ip-x', t0 + 1).allowed, false)
})

// ─── extractJson ───

test('extractJson：解析纯 JSON / 代码块包裹 / 前后带文字', () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 })
  assert.deepEqual(extractJson('```json\n{"a": 2}\n```'), { a: 2 })
  assert.deepEqual(extractJson('好的，结果如下：\n{"a":3}\n以上。'), { a: 3 })
  assert.equal(extractJson('不是 JSON'), null)
  assert.equal(extractJson(''), null)
})

// ─── analyze 接口 ───

test('analyze：未配置 API Key 返回 503', async () => {
  globalThis.fetch = async () => {
    throw new Error('不应发起上游请求')
  }
  const res = await analyzeHandler(makeContext({ industry: '互联网 / IT', data: RESUME }, { env: {}, clientIp: '10.9.0.1' }))
  assert.equal(res.status, 503)
  const body = await res.json()
  assert.equal(body.success, false)
  assert.equal(body.code, 'AI_NOT_CONFIGURED')
  assert.ok(body.message)
})

test('analyze：无效行业返回 400', async () => {
  const res = await analyzeHandler(makeContext({ industry: '不存在的行业', data: RESUME }, { clientIp: '10.9.0.2' }))
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.code, 'INVALID_INDUSTRY')
})

test('analyze：非法 JSON 请求体返回 400', async () => {
  const res = await analyzeHandler(makeContext('not-json', { clientIp: '10.9.0.3' }))
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.code, 'INVALID_BODY')
})

test('analyze：正常返回结构化结果并做字段归一化', async () => {
  mockModelContent(
    JSON.stringify({
      score: 182,
      industryFit: -5,
      verdict: '整体良好',
      highlights: ['量化成果多', '', 123],
      issues: [
        { severity: 'boom', message: '技能太泛', suggestion: '聚焦核心' },
        { severity: 'error', message: '', suggestion: 'x' },
      ],
      suggestions: [{ title: '补充数据', detail: '在简介中加入指标' }],
      keywords: ['React', 'TypeScript'],
    }),
  )
  const res = await analyzeHandler(makeContext({ industry: '互联网 / IT', data: RESUME }, { clientIp: '10.9.0.4' }))
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.equal(body.data.score, 100) // 超上限被 clamp
  assert.equal(body.data.industryFit, 0) // 负数被 clamp
  assert.deepEqual(body.data.highlights, ['量化成果多']) // 空串与非字符串被过滤
  assert.equal(body.data.issues.length, 1) // 空 message 被过滤
  assert.equal(body.data.issues[0].severity, 'tip') // 非法 severity 回退
  assert.equal(body.data.suggestions[0].title, '补充数据')
})

test('analyze：模型输出非 JSON 返回 AI_PARSE_ERROR', async () => {
  mockModelContent('抱歉，我无法分析。')
  const res = await analyzeHandler(makeContext({ industry: '互联网 / IT', data: RESUME }, { clientIp: '10.9.0.5' }))
  assert.equal(res.status, 502)
  const body = await res.json()
  assert.equal(body.code, 'AI_PARSE_ERROR')
})

test('analyze：超过短窗口限额返回 429 且带 Retry-After', async () => {
  mockModelContent(JSON.stringify({ score: 60, verdict: 'ok' }))
  const ip = '10.9.9.9'
  let lastRes = null
  for (let i = 0; i < 9; i++) {
    lastRes = await analyzeHandler(makeContext({ industry: '互联网 / IT', data: RESUME }, { clientIp: ip }))
    if (lastRes.status === 429) break
  }
  assert.equal(lastRes.status, 429)
  assert.ok(Number(lastRes.headers.get('Retry-After')) >= 1)
  const body = await lastRes.json()
  assert.equal(body.code, 'RATE_LIMITED')
  assert.ok(body.retryAfter > 0)
})

// ─── rewrite 接口 ───

test('rewrite：不支持的 action 返回 400', async () => {
  const res = await rewriteHandler(
    makeContext({ action: 'hackTheWorld', payload: {} }, { clientIp: '10.8.0.1', url: 'https://example.com/api/ai/rewrite' }),
  )
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.code, 'INVALID_ACTION')
})

test('rewrite：正常返回优化文本', async () => {
  mockModelContent('- 主导核心系统重构，性能提升 60%')
  const res = await rewriteHandler(
    makeContext(
      { action: 'polishExperience', payload: { company: 'A 公司', title: '前端', description: '负责系统' } },
      { clientIp: '10.8.0.2', url: 'https://example.com/api/ai/rewrite' },
    ),
  )
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.ok(body.data.text.includes('主导'))
})

test('rewrite：上游 401 转为 502 鉴权错误', async () => {
  globalThis.fetch = async () => new Response('{"error":{"message":"invalid key"}}', { status: 401 })
  const res = await rewriteHandler(
    makeContext({ action: 'generateSummary', payload: { name: '张三' } }, { clientIp: '10.8.0.3', url: 'https://example.com/api/ai/rewrite' }),
  )
  assert.equal(res.status, 502)
  const body = await res.json()
  assert.equal(body.code, 'UPSTREAM_AUTH_ERROR')
})

test('rewrite：上游 429 透传为 UPSTREAM_RATE_LIMITED', async () => {
  globalThis.fetch = async () => new Response('rate limited', { status: 429 })
  const res = await rewriteHandler(
    makeContext({ action: 'generateSummary', payload: { name: '张三' } }, { clientIp: '10.8.0.4', url: 'https://example.com/api/ai/rewrite' }),
  )
  assert.equal(res.status, 429)
  const body = await res.json()
  assert.equal(body.code, 'UPSTREAM_RATE_LIMITED')
})

test('rewrite：上游 400 错误体提取可读信息', async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ error: { message: 'invalid temperature, should in [0,2].', type: 'invalid_request_error', code: '3' } }),
      { status: 400 },
    )
  const res = await rewriteHandler(
    makeContext({ action: 'generateSummary', payload: { name: '张三' } }, { clientIp: '10.8.0.5', url: 'https://example.com/api/ai/rewrite' }),
  )
  assert.equal(res.status, 502)
  const body = await res.json()
  assert.ok(body.message.includes('invalid temperature'))
})
