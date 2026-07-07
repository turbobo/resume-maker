const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

export async function exportPdf() {
  const element = document.querySelector('.print-area') as HTMLElement
  if (!element) {
    alert('找不到预览区域')
    return
  }

  const savedZoom = element.style.zoom
  if (savedZoom && savedZoom !== '1') {
    element.style.zoom = '1'
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  }

  const nameEl = element.querySelector('h1')
  const name = nameEl?.textContent?.trim() || '简历'

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  if (savedZoom && savedZoom !== '1') {
    element.style.zoom = savedZoom
  }

  const imgData = canvas.toDataURL('image/png')
  const imgHeightMm = (canvas.height / canvas.width) * A4_WIDTH_MM

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  if (imgHeightMm <= A4_HEIGHT_MM) {
    pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_MM, imgHeightMm)
  } else {
    const pageCount = Math.ceil(imgHeightMm / A4_HEIGHT_MM)
    for (let i = 0; i < pageCount; i++) {
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, -(i * A4_HEIGHT_MM), A4_WIDTH_MM, imgHeightMm)
    }
  }

  pdf.save(`${name}.pdf`)
}
