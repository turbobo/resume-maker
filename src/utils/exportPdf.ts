// PDF 导出 — html2canvas 截图 A4 预览区，jsPDF 生成分页 A4 文档
// 优化点：
// 1. 输出 JPEG(0.95) 控制文件体积（同等清晰度下 PNG 常达 10MB+）
// 2. 渲染超时保护，避免异常环境下按钮无限卡在"导出中"
// 3. 等待预览区挂载（移动端从编辑页切换过来时为懒加载）

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const RENDER_TIMEOUT_MS = 30 * 1000

// 等待预览区挂载完成：模板组件为 React lazy 懒加载，
// 移动端从编辑页切换过来时 .print-area 外壳会先出现，
// 必须等内部内容（h1 姓名）就绪再截图，否则会截到空白页
async function waitForPrintArea(timeoutMs = 5000): Promise<HTMLElement | null> {
  const start = Date.now()
  for (;;) {
    const el = document.querySelector('.print-area') as HTMLElement | null
    if (el && el.querySelector('h1')) return el
    if (Date.now() - start >= timeoutMs) return null
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

function withTimeout<T>(task: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs)
    task.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        window.clearTimeout(timer)
        reject(err)
      },
    )
  })
}

export async function exportPdf() {
  const element = await waitForPrintArea()
  if (!element) {
    alert('预览未就绪，请切换到「预览」标签后重试')
    return
  }

  const savedZoom = element.style.zoom
  if (savedZoom && savedZoom !== '1') {
    element.style.zoom = '1'
    // 等两帧让布局生效；隐藏页面 rAF 可能暂停，超时后继续
    await withTimeout(
      new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
      1000,
      'layout wait timeout',
    ).catch(() => {})
  }

  const nameEl = element.querySelector('h1')
  const name = nameEl?.textContent?.trim() || '简历'

  // 等待字体加载完成（最多 5 秒：字体由外网 CDN 提供，加载失败时用回退字体继续导出）
  if (document.fonts?.ready) {
    await withTimeout(document.fonts.ready, 5000, 'fonts timeout').catch(() => {})
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  try {
    const canvas = await withTimeout(
      html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // 克隆节点保留预览态的缩放与阴影，导出前还原到标准 A4 状态
          const clonedPage = clonedDoc.querySelector('.print-area') as HTMLElement
          if (clonedPage) {
            clonedPage.style.zoom = '1'
            clonedPage.style.transform = 'none'
            clonedPage.style.boxShadow = 'none'
          }
          // html2canvas 对行内 SVG 的垂直对齐处理存在缺陷（图标整体偏上），
          // 导出时直接对克隆的图标元素应用像素级 translateY 补偿（数值经实测校准）；
          // 预览不受影响
          clonedDoc.querySelectorAll('svg.contact-icon').forEach((el) => {
            const icon = el as SVGElement
            icon.style.transform = 'translateY(1.6px)'
          })
        },
      }),
      RENDER_TIMEOUT_MS,
      '导出超时，请重试',
    )

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const imgHeightMm = (canvas.height / canvas.width) * A4_WIDTH_MM

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    if (imgHeightMm <= A4_HEIGHT_MM) {
      pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, imgHeightMm)
    } else {
      const pageCount = Math.ceil(imgHeightMm / A4_HEIGHT_MM)
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, -(i * A4_HEIGHT_MM), A4_WIDTH_MM, imgHeightMm)
      }
    }

    pdf.save(`${name}.pdf`)
  } finally {
    // 无论成功失败都恢复预览缩放
    if (savedZoom && savedZoom !== '1') {
      element.style.zoom = savedZoom
    }
  }
}
