import { useDeferredValue, useRef, useEffect, useState } from 'react'
import { useStore } from '../store'
import ClassicTemplate from '../templates/Classic'
import MinimalTemplate from '../templates/Minimal'
import ModernTemplate from '../templates/Modern'

const A4_WIDTH_PX = 794

export default function PreviewPanel() {
  const data = useStore((s) => s.data)
  const template = useStore((s) => s.template)
  const deferredData = useDeferredValue(data)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pageZoom, setPageZoom] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const available = el.clientWidth - 32
      setPageZoom(available < A4_WIDTH_PX ? available / A4_WIDTH_PX : 1)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const TemplateComponent =
    template === 'classic' ? ClassicTemplate :
    template === 'minimal' ? MinimalTemplate :
    ModernTemplate

  return (
    <main ref={containerRef} className="flex-1 overflow-auto bg-[var(--bg)] flex justify-center items-start p-4 md:p-6">
      <div
        className="a4-page print-area shrink-0"
        style={pageZoom < 1 ? { zoom: pageZoom } : undefined}
      >
        <TemplateComponent data={deferredData} />
      </div>
    </main>
  )
}
