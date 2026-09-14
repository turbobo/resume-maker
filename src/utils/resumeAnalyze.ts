// AI 简历行业分析 — 客户端调用
// 服务端：cloud-functions/api/ai/analyze.js（Prompt 与行业白名单在服务端）

import type { ResumeData } from '../types'
import { postAI } from './aiClient'

// 行业选项（需与 cloud-functions/api/ai/analyze.js 的 INDUSTRIES 白名单保持一致）
export const INDUSTRY_OPTIONS = [
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
] as const

export type IndustryOption = (typeof INDUSTRY_OPTIONS)[number]

export interface AnalyzeIssue {
  severity: 'error' | 'warning' | 'tip'
  message: string
  suggestion: string
}

export interface AnalyzeSuggestion {
  title: string
  detail: string
}

export interface AnalyzeResult {
  score: number
  industryFit: number
  verdict: string
  highlights: string[]
  issues: AnalyzeIssue[]
  suggestions: AnalyzeSuggestion[]
  keywords: string[]
}

// 精简后的简历数据（剔除照片 base64、字体等非内容字段，控制请求体量）
function toPayload(data: ResumeData) {
  return {
    name: data.name,
    title: data.title,
    location: data.location,
    summary: data.summary,
    skills: data.skills,
    experiences: data.experiences,
    projects: data.projects,
    education: data.education,
    customSections: data.customSections,
  }
}

export async function analyzeResume(
  industry: string,
  data: ResumeData,
  signal?: AbortSignal,
): Promise<AnalyzeResult> {
  return postAI<AnalyzeResult>('/api/ai/analyze', { industry, data: toPayload(data) }, signal)
}
