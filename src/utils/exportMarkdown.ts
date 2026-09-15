// Markdown 导出 — 将简历数据序列化为标准 Markdown 文本（.md）
// 章节顺序遵循 sectionOrder，标题支持自定义模块名（与 Word / PDF 导出规则一致）

import type { ResumeData } from '../types'
import { getSectionLabel } from '../types'
import { downloadBlob } from './download'

// 多行文本拆为 Markdown 列表项：
// 有序行（1. / 1、/ 1)）保留原标记；无序行（- * • ·）标准化为 Markdown 标准的 "- "；普通行加 "- "
function toBulletList(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (/^\d+[.、)]\s+/.test(line)) return line
      if (/^[-*•·]\s+/.test(line)) return line.replace(/^[-*•·]\s+/, '- ')
      return `- ${line}`
    })
    .join('\n')
}

// 起止时间：如 "2021-03 — 至今"，两端都为空时返回空串
function dateRange(start: string, end: string): string {
  if (!start.trim() && !end.trim()) return ''
  return `${start.trim()} — ${end.trim()}`
}

function renderExperienceMd(data: ResumeData): string {
  if (data.experiences.length === 0) return ''
  const parts = [`## ${getSectionLabel('experience', data)}`]
  for (const exp of data.experiences) {
    const heading = [exp.company, exp.title].map((s) => s.trim()).filter(Boolean).join(' · ')
    if (heading) parts.push(`### ${heading}`)
    const dates = dateRange(exp.startDate, exp.endDate)
    if (dates) parts.push(dates)
    const bullets = toBulletList(exp.description)
    if (bullets) parts.push(bullets)
  }
  return parts.join('\n\n')
}

function renderProjectMd(data: ResumeData): string {
  if (data.projects.length === 0) return ''
  const parts = [`## ${getSectionLabel('projects', data)}`]
  for (const proj of data.projects) {
    const heading = [proj.name, proj.role].map((s) => s.trim()).filter(Boolean).join(' · ')
    if (heading) parts.push(`### ${heading}`)
    const dates = dateRange(proj.startDate, proj.endDate)
    if (dates) parts.push(dates)
    const bullets = toBulletList(proj.description)
    if (bullets) parts.push(bullets)
  }
  return parts.join('\n\n')
}

function renderEducationMd(data: ResumeData): string {
  if (data.education.length === 0) return ''
  const parts = [`## ${getSectionLabel('education', data)}`]
  for (const edu of data.education) {
    const heading = [edu.school, edu.degree, edu.major].map((s) => s.trim()).filter(Boolean).join(' · ')
    if (heading) parts.push(`### ${heading}`)
    const dates = dateRange(edu.startDate, edu.endDate)
    if (dates) parts.push(dates)
    const bullets = toBulletList(edu.description)
    if (bullets) parts.push(bullets)
  }
  return parts.join('\n\n')
}

function renderSkillsMd(data: ResumeData): string {
  const skills = data.skills
    .split(/[,，、\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (skills.length === 0) return ''
  return [`## ${getSectionLabel('skills', data)}`, skills.map((s) => `- ${s}`).join('\n')].join('\n\n')
}

function renderCustomMd(id: string, data: ResumeData): string {
  const custom = data.customSections.find((s) => s.id === id)
  if (!custom || !custom.content.trim()) return ''
  return `## ${custom.title}\n\n${custom.content.trim()}`
}

function renderSectionMd(id: string, data: ResumeData): string {
  switch (id) {
    case 'summary': {
      const content = data.summary.trim()
      if (!content) return ''
      return `## ${getSectionLabel('summary', data)}\n\n${content}`
    }
    case 'experience':
      return renderExperienceMd(data)
    case 'projects':
      return renderProjectMd(data)
    case 'education':
      return renderEducationMd(data)
    case 'skills':
      return renderSkillsMd(data)
    default:
      return renderCustomMd(id, data)
  }
}

// 简历数据 → Markdown 文本（纯函数，便于测试与复用）
export function resumeToMarkdown(data: ResumeData): string {
  const blocks: string[] = []

  // 头部：姓名 / 职位 / 联系方式（照片为二进制内容，Markdown 中不输出）
  const headerParts: string[] = []
  if (data.name.trim()) headerParts.push(`# ${data.name.trim()}`)
  if (data.title.trim()) headerParts.push(`**${data.title.trim()}**`)
  const contacts = [data.email, data.phone, data.location, data.website]
    .map((v) => v.trim())
    .filter(Boolean)
  if (contacts.length > 0) headerParts.push(contacts.join(' | '))
  if (headerParts.length > 0) blocks.push(headerParts.join('\n\n'))

  // 各章节按 sectionOrder 顺序输出
  for (const id of data.sectionOrder) {
    const section = renderSectionMd(id, data)
    if (section) blocks.push(section)
  }

  return `${blocks.join('\n\n')}\n`
}

// 导出并触发下载
export function exportMarkdownFile(data: ResumeData) {
  const markdown = resumeToMarkdown(data)
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  downloadBlob(blob, `${data.name.trim() || '简历'}.md`)
}
