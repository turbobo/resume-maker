import type { ResumeData } from '../types'

export async function exportDocx(data: ResumeData) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await import('docx')

  function sectionHeader(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: 22, font: 'Arial' })],
      spacing: { before: 240, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'e7e5e4' } },
    })
  }

  const paragraphs: InstanceType<typeof Paragraph>[] = []

  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: data.name, bold: true, size: 36, font: 'Arial' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }))

  if (data.title) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.title, size: 22, color: '57534e', font: 'Arial' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }))
  }

  const contactParts = [data.email, data.phone, data.location, data.website].filter(Boolean)
  if (contactParts.length > 0) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: contactParts.join('  |  '), size: 18, color: '57534e', font: 'Arial' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1c1917' } },
    }))
  }

  if (data.summary) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.summary, size: 19, color: '57534e', font: 'Arial' })],
      spacing: { after: 200 },
    }))
  }

  if (data.experiences.length > 0) {
    paragraphs.push(sectionHeader('工作经历'))
    for (const exp of data.experiences) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: exp.company, bold: true, size: 20, font: 'Arial' }),
          new TextRun({ text: `  ${exp.title}`, size: 19, color: '57534e', font: 'Arial' }),
          new TextRun({ text: `  ${exp.startDate} — ${exp.endDate}`, size: 16, color: 'a8a29e', font: 'Arial' }),
        ],
        spacing: { before: 80, after: 40 },
      }))
      if (exp.description) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: exp.description, size: 18, color: '57534e', font: 'Arial' })],
          spacing: { after: 80 },
        }))
      }
    }
  }

  if (data.projects.length > 0) {
    paragraphs.push(sectionHeader('项目经历'))
    for (const proj of data.projects) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: proj.name, bold: true, size: 20, font: 'Arial' }),
          new TextRun({ text: `  ${proj.role}`, size: 19, color: '57534e', font: 'Arial' }),
          new TextRun({ text: `  ${proj.startDate} — ${proj.endDate}`, size: 16, color: 'a8a29e', font: 'Arial' }),
        ],
        spacing: { before: 80, after: 40 },
      }))
      if (proj.description) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: proj.description, size: 18, color: '57534e', font: 'Arial' })],
          spacing: { after: 80 },
        }))
      }
    }
  }

  if (data.education.length > 0) {
    paragraphs.push(sectionHeader('教育背景'))
    for (const edu of data.education) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: edu.school, bold: true, size: 20, font: 'Arial' }),
          new TextRun({ text: `  ${edu.degree} · ${edu.major}`, size: 19, color: '57534e', font: 'Arial' }),
          new TextRun({ text: `  ${edu.startDate} — ${edu.endDate}`, size: 16, color: 'a8a29e', font: 'Arial' }),
        ],
        spacing: { before: 80, after: 80 },
      }))
    }
  }

  if (data.skills) {
    paragraphs.push(sectionHeader('技能'))
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.skills, size: 18, color: '57534e', font: 'Arial' })],
    }))
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
      },
      children: paragraphs,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.name || '简历'}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
