// Word 导出 — 按模板类型生成对应的 DOCX 版式
// 双栏模板（modern / executive / minimal）：左/右侧栏 + 主内容用两列表格实现
// 单栏模板（classic / compact）：照片 + 标题区 + 按 sectionOrder 顺序输出

import type { ResumeData, TemplateId } from '../types'
import { resolveFontFamily, getSectionLabel, SIDEBAR_SECTIONS } from '../types'

const BODY_COLOR = '57534e'
const MUTED_COLOR = 'a8a29e'

function extractFontName(fontId: string): string {
  const family = resolveFontFamily(fontId)
  const match = family.match(/^"([^"]+)"/)
  return match ? match[1] : family.split(',')[0].trim()
}

function dataUrlToBuffer(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // 延迟释放，避免下载尚未开始时 URL 已被回收
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportDocx(data: ResumeData, template: TemplateId) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ImageRun, Table, TableRow, TableCell, TableLayoutType, WidthType } = await import('docx')
  const headingFont = extractFontName(data.headingFont)
  const bodyFont = extractFontName(data.bodyFont)

  type ParagraphNode = InstanceType<typeof Paragraph>
  type HeaderBuilder = (text: string) => ParagraphNode

  // 主内容标题（大标题 + 下划线）
  const sectionHeader: HeaderBuilder = (text) =>
    new Paragraph({
      children: [new TextRun({ text, bold: true, size: 22, font: headingFont })],
      spacing: { before: 240, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'e7e5e4' } },
    })

  // 侧栏标题（小标题 + 浅色下划线）
  const sidebarHeader: HeaderBuilder = (text) =>
    new Paragraph({
      children: [new TextRun({ text, bold: true, size: 16, font: headingFont })],
      spacing: { before: 160, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'd6d3d1' } },
    })

  // 文本按行拆分为多个段落（与预览 whitespace-pre-line 的效果一致）
  function textParagraphs(text: string, size = 18, after = 60): ParagraphNode[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map(
        (line) =>
          new Paragraph({
            children: [new TextRun({ text: line, size, color: BODY_COLOR, font: bodyFont })],
            spacing: { after },
          }),
      )
  }

  // 条目标题行：主标题 + 副标题 + 日期（如：公司 职位 起止时间）
  function itemTitleParagraph(main: string, sub: string, dates: string): ParagraphNode {
    const children = [new TextRun({ text: main, bold: true, size: 20, font: headingFont })]
    if (sub) {
      children.push(new TextRun({ text: `  ${sub}`, size: 19, color: BODY_COLOR, font: bodyFont }))
    }
    if (dates) {
      children.push(new TextRun({ text: `  ${dates}`, size: 16, color: MUTED_COLOR, font: bodyFont }))
    }
    return new Paragraph({ children, spacing: { before: 80, after: 40 } })
  }

  function makePhotoParagraph(alignRight = false): ParagraphNode | null {
    if (!data.photo) return null
    try {
      const photoData = dataUrlToBuffer(data.photo)
      return new Paragraph({
        alignment: alignRight ? AlignmentType.RIGHT : AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new ImageRun({
            data: photoData,
            transformation: { width: 105, height: 140 },
            type: 'png',
          }),
        ],
      })
    } catch {
      return null
    }
  }

  function makeSummaryParagraphs(header: HeaderBuilder): ParagraphNode[] {
    if (!data.summary) return []
    return [header(getSectionLabel('summary', data)), ...textParagraphs(data.summary, 19, 100)]
  }

  function makeExperienceParagraphs(header: HeaderBuilder): ParagraphNode[] {
    if (data.experiences.length === 0) return []
    const result: ParagraphNode[] = [header(getSectionLabel('experience', data))]
    for (const exp of data.experiences) {
      result.push(itemTitleParagraph(exp.company, exp.title, `${exp.startDate} — ${exp.endDate}`))
      result.push(...textParagraphs(exp.description, 18, 80))
    }
    return result
  }

  function makeProjectParagraphs(header: HeaderBuilder): ParagraphNode[] {
    if (data.projects.length === 0) return []
    const result: ParagraphNode[] = [header(getSectionLabel('projects', data))]
    for (const proj of data.projects) {
      result.push(itemTitleParagraph(proj.name, proj.role, `${proj.startDate} — ${proj.endDate}`))
      result.push(...textParagraphs(proj.description, 18, 80))
    }
    return result
  }

  function makeEducationParagraphs(header: HeaderBuilder): ParagraphNode[] {
    if (data.education.length === 0) return []
    const result: ParagraphNode[] = [header(getSectionLabel('education', data))]
    for (const edu of data.education) {
      result.push(itemTitleParagraph(edu.school, [edu.degree, edu.major].filter(Boolean).join(' · '), `${edu.startDate} — ${edu.endDate}`))
      result.push(...textParagraphs(edu.description, 18, 80))
    }
    return result
  }

  function makeSkillsParagraphs(header: HeaderBuilder): ParagraphNode[] {
    if (!data.skills) return []
    return [header(getSectionLabel('skills', data)), ...textParagraphs(data.skills, 18, 80)]
  }

  function makeCustomSectionParagraphs(id: string, header: HeaderBuilder): ParagraphNode[] {
    const custom = data.customSections.find((s) => s.id === id)
    if (!custom || !custom.content) return []
    return [header(custom.title), ...textParagraphs(custom.content, 18, 80)]
  }

  function makeContentParagraphs(sectionId: string, header: HeaderBuilder): ParagraphNode[] {
    switch (sectionId) {
      case 'summary': return makeSummaryParagraphs(header)
      case 'experience': return makeExperienceParagraphs(header)
      case 'projects': return makeProjectParagraphs(header)
      case 'education': return makeEducationParagraphs(header)
      case 'skills': return makeSkillsParagraphs(header)
      default: return makeCustomSectionParagraphs(sectionId, header)
    }
  }

  const isSidebarSection = (id: string) => (SIDEBAR_SECTIONS as Set<string>).has(id)
  const filename = `${data.name || '简历'}.docx`

  // ── 双栏模板：modern / executive / minimal ──

  if (template === 'modern' || template === 'executive' || template === 'minimal') {
    const sidebarParagraphs: ParagraphNode[] = []
    const mainParagraphs: ParagraphNode[] = []

    // 侧栏头部：照片 + 姓名 + 职位 + 联系方式
    const photoPara = makePhotoParagraph()
    if (photoPara) sidebarParagraphs.push(photoPara)
    sidebarParagraphs.push(
      new Paragraph({ children: [new TextRun({ text: data.name, bold: true, size: 24, font: headingFont })] }),
      new Paragraph({
        children: [new TextRun({ text: data.title, size: 18, color: '78716c', font: bodyFont })],
        spacing: { after: 160 },
      }),
    )
    const contactItems = [data.email, data.phone, data.location, data.website].filter(Boolean)
    if (contactItems.length > 0) {
      sidebarParagraphs.push(sidebarHeader('联系方式'))
      for (const item of contactItems) {
        sidebarParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: item, size: 16, color: BODY_COLOR, font: bodyFont })],
            spacing: { after: 40 },
          }),
        )
      }
    }

    // 侧栏章节：所有双栏模板均跟随 sectionOrder 中的侧栏模块顺序
    const sidebarSectionIds = data.sectionOrder.filter(isSidebarSection)
    for (const id of sidebarSectionIds) {
      sidebarParagraphs.push(...makeContentParagraphs(id, sidebarHeader))
    }

    // 主栏章节：
    // - modern / executive：简介固定在顶部，其余按 sectionOrder
    // - minimal：按 sectionOrder（含简介）
    if (template !== 'minimal') {
      mainParagraphs.push(...makeSummaryParagraphs(sectionHeader))
    }
    const mainSectionIds = data.sectionOrder.filter(
      (id) => !isSidebarSection(id) && (template === 'minimal' || id !== 'summary'),
    )
    for (const id of mainSectionIds) {
      mainParagraphs.push(...makeContentParagraphs(id, sectionHeader))
    }
    if (mainParagraphs.length === 0) {
      mainParagraphs.push(new Paragraph({ children: [] }))
    }

    const sidebarCell = new TableCell({
      width: { size: 2600, type: WidthType.DXA },
      shading: template === 'minimal' ? undefined : { fill: 'f5f5f4' },
      margins: { top: 400, right: 300, bottom: 400, left: 300 },
      children: sidebarParagraphs,
    })

    const mainCell = new TableCell({
      width: { size: 6600, type: WidthType.DXA },
      margins: { top: 400, right: 300, bottom: 400, left: 300 },
      children: mainParagraphs,
    })

    const table = new Table({
      width: { size: 9200, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      rows: [new TableRow({ children: [sidebarCell, mainCell] })],
    })

    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 360, right: 360, bottom: 360, left: 360 } },
        },
        children: [table],
      }],
    })

    downloadBlob(await Packer.toBlob(doc), filename)
    return
  }

  // ── 单栏模板：classic / compact ──

  const paragraphs: ParagraphNode[] = []

  // 紧凑模板照片居右（与模板头部布局一致），其余模板居中
  const photoPara = makePhotoParagraph(template === 'compact')
  if (photoPara) paragraphs.push(photoPara)

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: data.name, bold: true, size: 36, font: headingFont })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
  )

  if (data.title) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: data.title, size: 22, color: BODY_COLOR, font: bodyFont })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
    )
  }

  const contactParts = [data.email, data.phone, data.location, data.website].filter(Boolean)
  if (contactParts.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join('  |  '), size: 18, color: BODY_COLOR, font: bodyFont })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1c1917' } },
      }),
    )
  }

  // 所有章节按 sectionOrder 顺序输出（含简介，与模板渲染顺序一致）
  for (const sectionId of data.sectionOrder) {
    paragraphs.push(...makeContentParagraphs(sectionId, sectionHeader))
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
      },
      children: paragraphs,
    }],
  })

  downloadBlob(await Packer.toBlob(doc), filename)
}
