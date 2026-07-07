import type { ResumeData } from '../types'

export type ATSSeverity = 'error' | 'warning' | 'tip'

export interface ATSIssue {
  id: string
  severity: ATSSeverity
  message: string
}

export interface ATSResult {
  score: number
  issues: ATSIssue[]
  contactScore: number    // 0-25
  experienceScore: number // 0-25
  educationScore: number  // 0-20
  skillsScore: number     // 0-15
  summaryScore: number    // 0-10
  qualityScore: number    // 0-5
}

const CN_ACTION_VERBS = [
  '负责', '主导', '开发', '设计', '优化', '实现', '构建', '搭建', '完成',
  '提升', '降低', '管理', '协调', '推动', '建立', '创建', '维护', '领导',
  '独立', '参与', '改进', '重构', '部署', '分析', '规划',
]

function hasActionVerb(text: string): boolean {
  return CN_ACTION_VERBS.some((v) => text.startsWith(v)) ||
    /^(led|built|developed|designed|implemented|created|managed|improved|reduced|increased|achieved)/i.test(text.trim())
}

function splitSkills(raw: string): string[] {
  return raw.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean)
}

export function checkATS(data: ResumeData): ATSResult {
  const issues: ATSIssue[] = []

  // ── Contact (0-25) ──
  let contactScore = 0

  if (data.name.trim()) {
    contactScore += 8
  } else {
    issues.push({ id: 'no-name', severity: 'error', message: '未填写姓名，ATS 无法识别候选人' })
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    contactScore += 6
  } else if (data.email.trim()) {
    contactScore += 3
    issues.push({ id: 'bad-email', severity: 'warning', message: '邮箱格式不正确，请检查' })
  } else {
    issues.push({ id: 'no-email', severity: 'error', message: '未填写邮箱，招聘方无法联系你' })
  }

  if (data.phone.trim()) {
    contactScore += 5
  } else {
    issues.push({ id: 'no-phone', severity: 'warning', message: '未填写手机号，建议添加' })
  }

  if (data.location.trim()) {
    contactScore += 3
  } else {
    issues.push({ id: 'no-location', severity: 'tip', message: '填写所在城市有助于匹配本地职位' })
  }

  if (data.website.trim()) {
    contactScore += 3
  } else {
    issues.push({ id: 'no-website', severity: 'tip', message: '添加 GitHub / 作品集链接可提升竞争力' })
  }

  // ── Summary (0-10) ──
  let summaryScore = 0
  const summaryLen = data.summary.trim().length

  if (summaryLen >= 80) {
    summaryScore = 10
  } else if (summaryLen >= 30) {
    summaryScore = 5
    issues.push({ id: 'short-summary', severity: 'tip', message: '个人简介较短，建议扩展到 80 字以上' })
  } else if (summaryLen > 0) {
    summaryScore = 2
    issues.push({ id: 'very-short-summary', severity: 'warning', message: '个人简介过短，请详细描述你的核心优势' })
  } else {
    issues.push({ id: 'no-summary', severity: 'warning', message: '缺少个人简介，ATS 关键词匹配得分会降低' })
  }

  // ── Experience (0-25) ──
  let experienceScore = 0

  if (data.experiences.length === 0) {
    issues.push({ id: 'no-exp', severity: 'error', message: '未添加工作经历，简历竞争力严重不足' })
  } else {
    experienceScore += 5

    const first = data.experiences[0]
    if (first.company.trim() && first.title.trim()) {
      experienceScore += 5
    } else {
      issues.push({ id: 'exp-missing-basic', severity: 'error', message: '工作经历缺少公司名或职位名' })
    }

    if (first.startDate.trim() && first.endDate.trim()) {
      experienceScore += 5
    } else {
      issues.push({ id: 'exp-no-dates', severity: 'warning', message: '工作经历缺少时间段，ATS 无法解析工龄' })
    }

    const descLen = first.description.trim().length
    if (descLen >= 50) {
      experienceScore += 5
      if (hasActionVerb(first.description.trim())) {
        experienceScore += 5
      } else {
        issues.push({ id: 'exp-no-verbs', severity: 'tip', message: '工作描述建议以行动动词开头（如"负责""主导""优化"）' })
      }
    } else if (descLen > 0) {
      experienceScore += 2
      issues.push({ id: 'exp-short-desc', severity: 'warning', message: '工作内容描述过短，建议详细描述职责和成果（50 字以上）' })
    } else {
      issues.push({ id: 'exp-no-desc', severity: 'error', message: '工作经历缺少内容描述，是 ATS 评分的重要因素' })
    }

    const incompleteOthers = data.experiences.slice(1).filter((e) => !e.description.trim()).length
    if (incompleteOthers > 0) {
      issues.push({ id: 'exp-others-no-desc', severity: 'warning', message: `还有 ${incompleteOthers} 条工作经历缺少内容描述` })
    }
  }

  // ── Education (0-20) ──
  let educationScore = 0

  if (data.education.length === 0) {
    issues.push({ id: 'no-edu', severity: 'warning', message: '未添加教育背景' })
  } else {
    educationScore += 5
    const first = data.education[0]

    if (first.school.trim()) {
      educationScore += 5
    } else {
      issues.push({ id: 'edu-no-school', severity: 'error', message: '教育经历缺少学校名称' })
    }

    if (first.degree.trim()) {
      educationScore += 5
    } else {
      issues.push({ id: 'edu-no-degree', severity: 'warning', message: '教育经历缺少学历信息（本科/硕士等）' })
    }

    if (first.startDate.trim() && first.endDate.trim()) {
      educationScore += 5
    } else {
      issues.push({ id: 'edu-no-dates', severity: 'tip', message: '教育经历建议填写入学和毕业时间' })
    }
  }

  // ── Skills (0-15) ──
  let skillsScore = 0
  const skillList = splitSkills(data.skills)

  if (skillList.length === 0) {
    issues.push({ id: 'no-skills', severity: 'error', message: '缺少技能关键词，ATS 关键词匹配将大幅降分' })
  } else if (skillList.length < 3) {
    skillsScore = 8
    issues.push({ id: 'few-skills', severity: 'warning', message: `技能关键词仅 ${skillList.length} 个，建议增加到 6 个以上` })
  } else if (skillList.length < 6) {
    skillsScore = 12
    issues.push({ id: 'more-skills', severity: 'tip', message: '建议添加更多技能关键词（6 个以上）提升匹配率' })
  } else {
    skillsScore = 15
  }

  // ── Quality bonus (0-5) ──
  let qualityScore = 0
  const totalContentLen = [data.summary, ...data.experiences.map((e) => e.description)].join('').length
  if (totalContentLen >= 300) qualityScore += 3
  if (data.experiences.length >= 2 && data.education.length >= 1) qualityScore += 2

  const score = Math.min(100, contactScore + summaryScore + experienceScore + educationScore + skillsScore + qualityScore)

  // Sort: errors → warnings → tips
  const severityOrder: Record<ATSSeverity, number> = { error: 0, warning: 1, tip: 2 }
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return { score, issues, contactScore, experienceScore, educationScore, skillsScore, summaryScore, qualityScore }
}
