// AI 分析准入检查 — 体检分数 + 信息完整性双重门禁
//
// 目的：确保分析输入的质量。内容残缺的简历，AI 建议与体检提示高度重复，
// 还会浪费有限的大模型配额；因此设置严门槛，引导用户先完善简历。
//
// 门槛（两者同时满足才允许分析）：
// 1. 简历体检分 >= 90
// 2. 核心信息完整：姓名 / 有效邮箱 / 手机号 / 简介（40 字+）/
//    首段完整经历（公司、职位、起止时间、50 字以上描述）/ 首段完整教育（学校、学历、起止时间）/ 技能 6 个+

import type { ResumeData } from '../types'
import { checkATS, isValidEmail } from './atsChecker'

export const AI_MIN_SCORE = 90
export const AI_MIN_SUMMARY_LEN = 40
export const AI_MIN_SKILLS = 6
export const AI_MIN_EXP_DESC_LEN = 50

export interface AIAccessResult {
  allowed: boolean
  score: number
  blockers: string[]
}

export function checkAIAnalysisAccess(data: ResumeData): AIAccessResult {
  const ats = checkATS(data)
  const blockers: string[] = []

  // ── 硬性完整性校验 ──
  if (!data.name.trim()) blockers.push('填写姓名')
  if (!isValidEmail(data.email)) blockers.push('填写有效邮箱')
  if (!data.phone.trim()) blockers.push('填写手机号')

  const summaryLen = data.summary.trim().length
  if (summaryLen < AI_MIN_SUMMARY_LEN) {
    blockers.push(`个人简介需 ${AI_MIN_SUMMARY_LEN} 字以上（当前 ${summaryLen} 字）`)
  }

  const skillCount = data.skills
    .split(/[,，、\n]/)
    .map((s) => s.trim())
    .filter(Boolean).length
  if (skillCount < AI_MIN_SKILLS) {
    blockers.push(`技能关键词需 ${AI_MIN_SKILLS} 个以上（当前 ${skillCount} 个）`)
  }

  const exp = data.experiences[0]
  if (!exp || !exp.company.trim() || !exp.title.trim() || !exp.startDate.trim() || !exp.endDate.trim()) {
    blockers.push('至少一段工作经历需含公司、职位、起止时间')
  } else {
    const descLen = exp.description.trim().length
    if (descLen < AI_MIN_EXP_DESC_LEN) {
      blockers.push(`首段工作描述需 ${AI_MIN_EXP_DESC_LEN} 字以上（当前 ${descLen} 字）`)
    }
  }

  const edu = data.education[0]
  if (!edu || !edu.school.trim() || !edu.degree.trim() || !edu.startDate.trim() || !edu.endDate.trim()) {
    blockers.push('教育背景需含学校、学历、起止时间')
  }

  // ── 分数门槛 ──
  if (ats.score < AI_MIN_SCORE) {
    blockers.push(`简历体检需 ${AI_MIN_SCORE} 分以上（当前 ${ats.score} 分，按上方提示补全可提升）`)
  }

  return { allowed: blockers.length === 0, score: ats.score, blockers }
}
