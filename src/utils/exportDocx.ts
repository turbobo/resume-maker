import type { ResumeData } from '../types'
import { resolveFontFamily } from '../types'

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

export async function exportDocx(data: ResumeData) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ImageRun } = await import('docx')
  const headingFont = extractFontName(data.headingFont)
  const bodyFont = extractFontName(data.bodyFont)

  function sectionHeader(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: 22, font: headingFont })],
      spacing: { before: 240, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'e7e5e4' } },
    })
  }

  const paragraphs: InstanceType<typeof Paragraph>[] = []

  // Photo
  if (data.photo) {
    try {
      const photoData = dataUrlToBuffer(data.photo)
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new ImageRun({
              data: photoData,
              transformation: { width: 105, height: 140 },
              type: 'png',
            }),
          ],
        }),
      )
    } catch {
      // ignore photo export errors
    }
  }

  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: data.name, bold: true, size: 36, font: headingFont })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }))

  if (data.title) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.title, size: 22, color: '57534e', font: bodyFont })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }))
  }

  const contactParts = [data.email, data.phone, data.location, data.website].filter(Boolean)
  if (contactParts.length > 0) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: contactParts.join('  |  '), size: 18, color: '57534e', font: bodyFont })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1c1917' } },
    }))
  }

  if (data.summary) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.summary, size: 19, color: '57534e', font: bodyFont })],
      spacing: { after: 200 },
    }))
  }

  for (const sectionId of data.sectionOrder) {
    switch (sectionId) {
      case 'summary':
        break

      case 'experience':
        if (data.experiences.length > 0) {
          paragraphs.push(sectionHeader('工作经历'))
          for (const exp of data.experiences) {
            paragraphs.push(new Paragraph({
              children: [
                new TextRun({ text: exp.company, bold: true, size: 20, font: headingFont }),
                new TextRun({ text: `  ${exp.title}`, size: 19, color: '57534e', font: bodyFont }),
                new TextRun({ text: `  ${exp.startDate} — ${exp.endDate}`, size: 16, color: 'a8a29e', font: bodyFont }),
              ],
              spacing: { before: 80, after: 40 },
            }))
            if (exp.description) {
              paragraphs.push(new Paragraph({
                children: [new TextRun({ text: exp.description, size: 18, color: '57534e', font: bodyFont })],
                spacing: { after: 80 },
              }))
            }
          }
        }
        break

      case 'projects':
        if (data.projects.length > 0) {
          paragraphs.push(sectionHeader('项目经历'))
          for (const proj of data.projects) {
            paragraphs.push(new Paragraph({
              children: [
                new TextRun({ text: proj.name, bold: true, size: 20, font: headingFont }),
                new TextRun({ text: `  ${proj.role}`, size: 19, color: '57534e', font: bodyFont }),
                new TextRun({ text: `  ${proj.startDate} — ${proj.endDate}`, size: 16, color: 'a8a29e', font: bodyFont }),
              ],
              spacing: { before: 80, after: 40 },
            }))
            if (proj.description) {
              paragraphs.push(new Paragraph({
                children: [new TextRun({ text: proj.description, size: 18, color: '57534e', font: bodyFont })],
                spacing: { after: 80 },
              }))
            }
          }
        }
        break

      case 'education':
        if (data.education.length > 0) {
          paragraphs.push(sectionHeader('教育背景'))
          for (const edu of data.education) {
            paragraphs.push(new Paragraph({
              children: [
                new TextRun({ text: edu.school, bold: true, size: 20, font: headingFont }),
                new TextRun({ text: `  ${edu.degree} · ${edu.major}`, size: 19, color: '57534e', font: bodyFont }),
                new TextRun({ text: `  ${edu.startDate} — ${edu.endDate}`, size: 16, color: 'a8a29e', font: bodyFont }),
              ],
              spacing: { before: 80, after: 80 },
            }))
          }
        }
        break

      case 'skills':
        if (data.skills) {
          paragraphs.push(sectionHeader('技能'))
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: data.skills, size: 18, color: '57534e', font: bodyFont })],
          }))
        }
        break

      default: {
        const custom = data.customSections.find((s) => s.id === sectionId)
        if (custom && custom.content) {
          paragraphs.push(sectionHeader(custom.title))
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: custom.content, size: 18, color: '57534e', font: bodyFont })],
          }))
        }
        break
      }
    }
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
