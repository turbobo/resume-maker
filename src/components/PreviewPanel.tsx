import { useDeferredValue } from 'react'
import { useStore } from '../store'
import ClassicTemplate from '../templates/Classic'
import MinimalTemplate from '../templates/Minimal'
import ModernTemplate from '../templates/Modern'

export default function PreviewPanel() {
  const data = useStore((s) => s.data)
  const template = useStore((s) => s.template)
  const deferredData = useDeferredValue(data)

  const TemplateComponent =
    template === 'classic' ? ClassicTemplate :
    template === 'minimal' ? MinimalTemplate :
    ModernTemplate

  return (
    <main className="flex-1 overflow-auto bg-[var(--bg)] flex justify-center p-6">
      <div className="a4-page print-area shrink-0">
        <TemplateComponent data={deferredData} />
      </div>
    </main>
  )
}
