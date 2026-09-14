// AI 简历内容优化接口（服务端拼装 Prompt，前端只传结构化数据）
// POST /api/ai/rewrite  { action: string, payload: object }
// action 枚举：polishExperience | generateSummary | polishProject | suggestSkills | polishCustomSection
// 返回：{ success: true, data: { text: string } }

import { jsonResponse, errorResponse, readJsonBody, pickText } from './_shared/http.js'
import { readAIConfig, chatCompletion, UpstreamError } from './_shared/sensenova.js'
import { getAILimiter, resolveClientIp } from './_shared/aiLimiter.js'
import { rateLimitResponse } from './_shared/rateLimit.js'

const RESUME_SYSTEM = `你是一位资深简历顾问和职业写作专家。你的任务是帮助用户优化简历内容，使其更专业、更有吸引力。
写作原则：
- 使用 STAR 法则（情境-任务-行动-结果）
- 以强动词开头（主导、设计、搭建、优化、推动）
- 尽量量化成果（提升 X%、服务 X 用户、节省 X 成本）
- 简洁有力，每句话都有信息量
- 使用中文，保持专业但不过度正式`

function candidateLine(payload) {
  const name = pickText(payload?.candidate?.name, 50)
  const title = pickText(payload?.candidate?.title, 100)
  return `候选人: ${name || '（未填写）'}，${title || '（未填写）'}`
}

function experienceDigest(list, max = 8) {
  if (!Array.isArray(list)) return ''
  return list
    .slice(0, max)
    .map((e) => `${pickText(e?.company, 80)} ${pickText(e?.title, 80)} (${pickText(e?.startDate, 20)}-${pickText(e?.endDate, 20)})`)
    .filter((line) => line.trim())
    .join('\n')
}

// action 白名单：Prompt 模板固定在服务端，避免被当作任意 LLM 网关滥用
const ACTIONS = {
  polishExperience: {
    maxTokens: 1000,
    temperature: 0.7,
    build: (p) => `${candidateLine(p)}

请优化以下工作经历的描述，生成 3-5 个精炼的要点（每点一行，不要用 markdown 列表符号）：

公司: ${pickText(p?.company, 80)}
职位: ${pickText(p?.title, 80)}
时间: ${pickText(p?.startDate, 20)} - ${pickText(p?.endDate, 20)}
当前描述: ${pickText(p?.description, 2000) || '（暂无描述）'}

直接输出优化后的描述，每点一行，不要加序号或符号前缀。`,
  },
  generateSummary: {
    maxTokens: 600,
    temperature: 0.7,
    build: (p) => `请根据以下信息，生成一段 2-3 句的个人简介（80-150 字）：

姓名: ${pickText(p?.name, 50)}
目标职位: ${pickText(p?.title, 100)}
技能: ${pickText(p?.skills, 500) || '未填写'}
工作经历:
${experienceDigest(p?.experiences) || '（未填写）'}

要求：突出核心竞争力和职业亮点，直接输出简介文字，不要加标题或解释。`,
  },
  polishProject: {
    maxTokens: 1000,
    temperature: 0.7,
    build: (p) => `${candidateLine(p)}

请优化以下项目经历的描述，生成 2-4 个精炼的要点（每点一行，不要用 markdown 列表符号）：

项目名: ${pickText(p?.name, 80)}
角色: ${pickText(p?.role, 80)}
时间: ${pickText(p?.startDate, 20)} - ${pickText(p?.endDate, 20)}
当前描述: ${pickText(p?.description, 2000) || '（暂无描述）'}

直接输出优化后的描述，每点一行，不要加序号或符号前缀。`,
  },
  suggestSkills: {
    maxTokens: 400,
    temperature: 0.7,
    build: (p) => {
      const expText = Array.isArray(p?.experiences)
        ? p.experiences
            .slice(0, 8)
            .map((e) => `${pickText(e?.title, 80)}@${pickText(e?.company, 80)}: ${pickText(e?.description, 200)}`)
            .join('\n')
        : ''
      return `根据以下工作经历，推荐该候选人应该补充的技能关键词：

当前技能: ${pickText(p?.skills, 500) || '未填写'}
工作经历:
${expText || '（未填写）'}

输出 8-15 个技能关键词，用逗号分隔，不要重复已有技能，不要加解释。`
    },
  },
  polishCustomSection: {
    maxTokens: 800,
    temperature: 0.7,
    build: (p) => `${candidateLine(p)}

请优化以下「${pickText(p?.title, 40) || '自定义模块'}」部分的内容，使其更专业、更有说服力：

当前内容: ${pickText(p?.content, 2000) || '（暂无内容）'}

直接输出优化后的文字，不要加标题或解释。`,
  },
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

  const action = ACTIONS[body.action]
  if (!action) {
    return errorResponse('INVALID_ACTION', '不支持的操作类型', 400)
  }

  const rate = getAILimiter(env).check(resolveClientIp(context))
  if (!rate.allowed) {
    return rateLimitResponse(rate)
  }

  const userPrompt = action.build(body.payload || {})
  try {
    const text = await chatCompletion(config, {
      system: RESUME_SYSTEM,
      user: userPrompt,
      maxTokens: action.maxTokens,
      temperature: action.temperature,
    })
    return jsonResponse({ text })
  } catch (err) {
    if (err instanceof UpstreamError) {
      return errorResponse(err.code, err.message, err.status)
    }
    console.error(`[ai/rewrite] requestId=${context?.server?.requestId || '-'} action=${body.action} error=${err?.message}`)
    return errorResponse('INTERNAL_ERROR', '服务异常，请稍后重试', 500)
  }
}
