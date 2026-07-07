import type { ResumeData } from '../types'
import { uid } from '../types'

export async function importWordFile(file: File): Promise<Partial<ResumeData>> {
  const arrayBuffer = await file.arrayBuffer()
  const mammoth = await import('mammoth')
  const result = await mammoth.default.extractRawText({ arrayBuffer })
  const text = result.value.trim()

  if (!text) throw new Error('文档内容为空')

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const partial: Partial<ResumeData> = {}

  // 尝试提取姓名（通常是第一行，且较短）
  if (lines.length > 0 && lines[0].length < 20 && !lines[0].includes('@')) {
    partial.name = lines[0]
  }

  // 提取邮箱
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
  if (emailMatch) partial.email = emailMatch[0]

  // 提取电话
  const phoneMatch = text.match(/1[3-9]\d{9}|(?:\d{3,4}[-\s]?\d{7,8})|(?:\d{3}[-\s]?\d{4}[-\s]?\d{4})/)
  if (phoneMatch) partial.phone = phoneMatch[0]

  // 按段落关键词分区
  let currentSection = ''
  const sectionLines: Record<string, string[]> = {}

  for (const line of lines) {
    if (isSectionHeader(line)) {
      currentSection = normalizeSectionName(line)
      sectionLines[currentSection] = sectionLines[currentSection] || []
    } else if (currentSection) {
      sectionLines[currentSection] = sectionLines[currentSection] || []
      sectionLines[currentSection].push(line)
    }
  }

  // 提取个人简介
  const summaryText = sectionLines['summary'] || sectionLines['简介'] || sectionLines['个人简介'] || sectionLines['自我介绍']
  if (summaryText) partial.summary = summaryText.join(' ')

  // 提取技能
  const skillText = sectionLines['skills'] || sectionLines['技能'] || sectionLines['专业技能'] || sectionLines['技术栈']
  if (skillText) partial.skills = skillText.join(', ')

  // 提取工作经历
  const expText = sectionLines['experience'] || sectionLines['工作经历'] || sectionLines['工作经验'] || sectionLines['职业经历']
  if (expText && expText.length > 0) {
    partial.experiences = parseExperiences(expText)
  }

  // 提取教育背景
  const eduText = sectionLines['education'] || sectionLines['教育背景'] || sectionLines['教育经历'] || sectionLines['学历']
  if (eduText && eduText.length > 0) {
    partial.education = parseEducation(eduText)
  }

  // 提取项目经历
  const projText = sectionLines['projects'] || sectionLines['项目经历'] || sectionLines['项目经验'] || sectionLines['项目']
  if (projText && projText.length > 0) {
    partial.projects = parseProjects(projText)
  }

  return partial
}

function isSectionHeader(line: string): boolean {
  const headers = [
    '工作经历', '工作经验', '职业经历', 'experience',
    '教育背景', '教育经历', '学历', 'education',
    '项目经历', '项目经验', '项目', 'projects',
    '技能', '专业技能', '技术栈', 'skills',
    '个人简介', '自我介绍', '简介', 'summary', 'profile', 'about',
  ]
  const lower = line.toLowerCase().replace(/[：:]/g, '').trim()
  return headers.some((h) => lower === h.toLowerCase()) || (line.length < 12 && /^[A-Z\u4e00-\u9fa5]/.test(line) && !line.includes('·') && !line.includes('@'))
}

function normalizeSectionName(line: string): string {
  const lower = line.toLowerCase().replace(/[：:]/g, '').trim()
  if (['工作经历', '工作经验', '职业经历', 'experience'].includes(lower)) return 'experience'
  if (['教育背景', '教育经历', '学历', 'education'].includes(lower)) return 'education'
  if (['项目经历', '项目经验', '项目', 'projects'].includes(lower)) return 'projects'
  if (['技能', '专业技能', '技术栈', 'skills'].includes(lower)) return 'skills'
  if (['个人简介', '自我介绍', '简介', 'summary', 'profile', 'about'].includes(lower)) return 'summary'
  return lower
}

function parseExperiences(lines: string[]): ResumeData['experiences'] {
  const items: ResumeData['experiences'] = []
  let current: ResumeData['experiences'][0] | null = null

  for (const line of lines) {
    const dateMatch = line.match(/(\d{4}[\.\-/年]\d{1,2})\s*[—\-~至到]\s*(\d{4}[\.\-/年]\d{1,2}|至今|present|now|现在)/i)
    if (dateMatch && !current) {
      current = { id: uid(), company: '', title: '', startDate: dateMatch[1], endDate: dateMatch[2], description: '' }
      const remaining = line.replace(dateMatch[0], '').trim()
      if (remaining) current.company = remaining
    } else if (dateMatch && current) {
      items.push(current)
      current = { id: uid(), company: '', title: '', startDate: dateMatch[1], endDate: dateMatch[2], description: '' }
      const remaining = line.replace(dateMatch[0], '').trim()
      if (remaining) current.company = remaining
    } else if (!current) {
      current = { id: uid(), company: line, title: '', startDate: '', endDate: '', description: '' }
    } else if (!current.title) {
      current.title = line
    } else {
      current.description += (current.description ? ' ' : '') + line
    }
  }
  if (current) items.push(current)
  return items
}

function parseEducation(lines: string[]): ResumeData['education'] {
  const items: ResumeData['education'] = []
  let current: ResumeData['education'][0] | null = null

  for (const line of lines) {
    const dateMatch = line.match(/(\d{4}[\.\-/年]\d{1,2})\s*[—\-~至到]\s*(\d{4}[\.\-/年]\d{1,2})/)
    if (!current) {
      current = { id: uid(), school: '', degree: '', major: '', startDate: '', endDate: '', description: '' }
      if (dateMatch) {
        current.startDate = dateMatch[1]
        current.endDate = dateMatch[2]
        current.school = line.replace(dateMatch[0], '').trim()
      } else {
        current.school = line
      }
    } else if (!current.degree && !current.major) {
      const parts = line.split(/[·\s,，、]/)
      current.degree = parts[0] || ''
      current.major = parts.slice(1).join('') || ''
      items.push(current)
      current = null
    } else {
      items.push(current)
      current = { id: uid(), school: line, degree: '', major: '', startDate: '', endDate: '', description: '' }
    }
  }
  if (current) items.push(current)
  return items
}

function parseProjects(lines: string[]): ResumeData['projects'] {
  const items: ResumeData['projects'] = []
  let current: ResumeData['projects'][0] | null = null

  for (const line of lines) {
    const dateMatch = line.match(/(\d{4}[\.\-/年]\d{1,2})\s*[—\-~至到]\s*(\d{4}[\.\-/年]\d{1,2})/)
    if (!current) {
      current = { id: uid(), name: '', role: '', startDate: '', endDate: '', description: '' }
      if (dateMatch) {
        current.startDate = dateMatch[1]
        current.endDate = dateMatch[2]
        current.name = line.replace(dateMatch[0], '').trim()
      } else {
        current.name = line
      }
    } else if (!current.role) {
      current.role = line
    } else {
      current.description += (current.description ? ' ' : '') + line
      items.push(current)
      current = null
    }
  }
  if (current) items.push(current)
  return items
}
