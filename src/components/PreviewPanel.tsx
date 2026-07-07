import { useDeferredValue, useRef, useEffect, useState, lazy, Suspense } from 'react'
import { useStore } from '../store'

const ClassicTemplate = lazy(() => import('../templates/Classic'))
const MinimalTemplate = lazy(() => import('../templates/Minimal'))
const ModernTemplate = lazy(() => import('../templates/Modern'))
const CompactTemplate = lazy(() => import('../templates/Compact'))
const ExecutiveTemplate = lazy(() => import('../templates/Executive'))

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
      const w = el.clientWidth
      if (w === 0) return
      const available = w - 32
      setPageZoom(available < A4_WIDTH_PX ? available / A4_WIDTH_PX : 1)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const TemplateComponent =
    template === 'classic' ? ClassicTemplate :
    template === 'minimal' ? MinimalTemplate :
    template === 'compact' ? CompactTemplate :
    template === 'executive' ? ExecutiveTemplate :
    ModernTemplate

  return (
    <main ref={containerRef} className="flex-1 overflow-auto bg-[var(--bg)] flex justify-center items-start p-4 md:p-6">
      <div
        className="a4-page print-area shrink-0"
        style={pageZoom < 1 ? { zoom: pageZoom } : undefined}
      >
        <Suspense>
          <TemplateComponent data={deferredData} />
        </Suspense>
      </div>
    </main>
  )
}
