// AI 简历行业分析接口
// POST /api/ai/analyze  { industry: string, data: ResumeData }
// 返回：评分、行业匹配度、亮点、问题、按行业的优化建议、关键词

import { jsonResponse, errorResponse, readJsonBody, pickText } from './_shared/http.js'
import { readAIConfig, chatCompletion, extractJson, UpstreamError } from './_shared/sensenova.js'
import { getAILimiter, resolveClientIp } from './_shared/aiLimiter.js'
import { rateLimitResponse } from './_shared/rateLimit.js'

// 行业白名单（需与前端 src/utils/resumeAnalyze.ts 的 INDUSTRY_OPTIONS 保持一致）
const INDUSTRIES = [
  '互联网 / IT',
  '人工智能 / 数据',
  '金融 / 财务',
  '教育培训',
  '医疗健康',
  '制造业',
  '消费零售',
  '传媒 / 广告',
  '法律 / 合规',
  '人力资源',
  '咨询 / 服务',
  '其他行业',
]

const RESUME_MAX_CHARS = 8000
const FIELD_MAX_CHARS = 400

const SYSTEM_PROMPT = `你是一位有 15 年经验的资深招聘官和简历顾问，精通各行业（互联网、金融、制造、医疗、教育等）的招聘标准与筛选偏好。你的任务是对候选人的简历做专业诊断，并针对其目标行业给出可落地的优化建议。
要求：
- 严格输出 JSON，不要输出 markdown 代码块、注释或任何额外文字
- 所有文案使用简体中文
- 建议必须具体可执行，写明"改成什么"而不是空泛口号`

// 简历对象序列化为紧凑文本，控制 prompt 体量
function buildResumeText(data) {
  const lines = []
  lines.push(`姓名: ${pickText(data.name, 50) || '（未填写）'}`)
  lines.push(`目标职位: ${pickText(data.title, 100) || '（未填写）'}`)
  lines.push(`所在地: ${pickText(data.location, 50) || '（未填写）'}`)
  lines.push(`个人简介: ${pickText(data.summary, 600) || '（未填写）'}`)
  lines.push(`技能: ${pickText(data.skills, 500) || '（未填写）'}`)

  const experiences = Array.isArray(data.experiences) ? data.experiences.slice(0, 10) : []
  if (experiences.length > 0) {
    lines.push('工作经历:')
    experiences.forEach((e, i) => {
      lines.push(`${i + 1}. ${pickText(e?.company, 80)} | ${pickText(e?.title, 80)} | ${pickText(e?.startDate, 20)} - ${pickText(e?.endDate, 20)}`)
      const desc = pickText(e?.description, FIELD_MAX_CHARS)
      if (desc) lines.push(`   内容: ${desc}`)
    })
  }

  const projects = Array.isArray(data.projects) ? data.projects.slice(0, 10) : []
  if (projects.length > 0) {
    lines.push('项目经历:')
    projects.forEach((p, i) => {
      lines.push(`${i + 1}. ${pickText(p?.name, 80)} | ${pickText(p?.role, 80)} | ${pickText(p?.startDate, 20)} - ${pickText(p?.endDate, 20)}`)
      const desc = pickText(p?.description, FIELD_MAX_CHARS)
      if (desc) lines.push(`   内容: ${desc}`)
    })
  }

  const education = Array.isArray(data.education) ? data.education.slice(0, 5) : []
  if (education.length > 0) {
    lines.push('教育背景:')
    education.forEach((e, i) => {
      lines.push(`${i + 1}. ${pickText(e?.school, 80)} | ${pickText(e?.degree, 40)} | ${pickText(e?.major, 80)} | ${pickText(e?.startDate, 20)} - ${pickText(e?.endDate, 20)}`)
    })
  }

  const customSections = Array.isArray(data.customSections) ? data.customSections.slice(0, 5) : []
  customSections.forEach((s) => {
    const content = pickText(s?.content, FIELD_MAX_CHARS)
    if (content) lines.push(`${pickText(s?.title, 40) || '自定义模块'}: ${content}`)
  })

  const text = lines.join('\n')
  return text.length > RESUME_MAX_CHARS ? text.slice(0, RESUME_MAX_CHARS) : text
}

function buildUserPrompt(industry, resumeText) {
  return `【目标行业】${industry}

【简历全文】
${resumeText}

请以该行业招聘官的视角分析这份简历，按以下 JSON 结构输出（字段名严格一致）：
{
  "score": 综合质量评分，0-100 的整数,
  "industryFit": 与目标行业的匹配度，0-100 的整数,
  "verdict": "一句话总评，40 字以内",
  "highlights": ["简历中已有的优势或亮点，2-5 条"],
  "issues": [{"severity": "error | warning | tip", "message": "问题描述", "suggestion": "具体修改建议"}],
  "suggestions": [{"title": "建议标题，10 字以内", "detail": "结合该行业招聘偏好的具体改法，50-100 字"}],
  "keywords": ["该行业简历应出现的关键词，5-10 个"]
}

要求：
- issues 给 3-6 条，severity 为 error 表示硬伤（如缺失关键信息、明显减分项）
- suggestions 给 3-5 条，优先给该行业最重要的改进项
- 只输出 JSON，不要任何其他文字`
}

function clampScore(value) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

function stringList(value, maxItems, itemMaxChars) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => pickText(item, itemMaxChars))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeResult(raw) {
  const issues = Array.isArray(raw?.issues)
    ? raw.issues
        .map((item) => ({
          severity: ['error', 'warning', 'tip'].includes(item?.severity) ? item.severity : 'tip',
          message: pickText(item?.message, 200),
          suggestion: pickText(item?.suggestion, 300),
        }))
        .filter((item) => item.message)
        .slice(0, 6)
    : []

  const suggestions = Array.isArray(raw?.suggestions)
    ? raw.suggestions
        .map((item) => ({
          title: pickText(item?.title, 40),
          detail: pickText(item?.detail, 400),
        }))
        .filter((item) => item.title || item.detail)
        .slice(0, 5)
    : []

  return {
    score: clampScore(raw?.score),
    industryFit: clampScore(raw?.industryFit),
    verdict: pickText(raw?.verdict, 100),
    highlights: stringList(raw?.highlights, 5, 150),
    issues,
    suggestions,
    keywords: stringList(raw?.keywords, 12, 30),
  }
}

export const onRequestPost = async (context) => {
  const { request, env } = context

  const config = readAIConfig(env)
  if (!config.configured) {
    return errorResponse('AI_NOT_CONFIGURED', '服务端未配置 AI Key', 503)
  }

  const body = await readJsonBody(request)
  if (!body || typeof body !== 'object') {
    return errorResponse('INVALID_BODY', '请求体必须是合法 JSON', 400)
  }
  const industry = pickText(body.industry, 30)
  if (!INDUSTRIES.includes(industry)) {
    return errorResponse('INVALID_INDUSTRY', '请选择有效的目标行业', 400)
  }
  if (!body.data || typeof body.data !== 'object') {
    return errorResponse('INVALID_RESUME', '缺少简历数据', 400)
  }

  const resumeText = buildResumeText(body.data)
  if (!resumeText.trim()) {
    return errorResponse('EMPTY_RESUME', '简历内容为空，请先填写后再分析', 400)
  }

  const rate = getAILimiter(env).check(resolveClientIp(context))
  if (!rate.allowed) {
    return rateLimitResponse(rate)
  }

  try {
    const output = await chatCompletion(config, {
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(industry, resumeText),
      maxTokens: 2400,
      temperature: 0.5,
    })
    const parsed = extractJson(output)
    if (!parsed) {
      throw new UpstreamError('AI 输出格式异常，请重试', { status: 502, code: 'AI_PARSE_ERROR' })
    }
    return jsonResponse(normalizeResult(parsed))
  } catch (err) {
    if (err instanceof UpstreamError) {
      return errorResponse(err.code, err.message, err.status)
    }
    console.error(`[ai/analyze] requestId=${context?.server?.requestId || '-'} error=${err?.message}`)
    return errorResponse('INTERNAL_ERROR', '服务异常，请稍后重试', 500)
  }
}
