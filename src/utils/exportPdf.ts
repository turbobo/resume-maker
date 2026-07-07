export async function exportPdf() {
  const element = document.querySelector('.print-area') as HTMLElement
  if (!element) {
    alert('找不到预览区域')
    return
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

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
  pdf.save(`${name}.pdf`)
}
