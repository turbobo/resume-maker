import { useRef, useEffect } from 'react'
import { useStore } from '../store'
import type { TemplateId } from '../types'
import { FONT_OPTIONS } from '../types'
import { useResumeActions } from '../hooks/useResumeActions'

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'classic', label: '经典' },
  { id: 'minimal', label: '极简' },
  { id: 'modern', label: '现代' },
]

export default function TopBar() {
  const template = useStore((s) => s.template)
  const setTemplate = useStore((s) => s.setTemplate)
  const headingFont = useStore((s) => s.data.headingFont)
  const bodyFont = useStore((s) => s.data.bodyFont)
  const setHeadingFont = useStore((s) => s.setHeadingFont)
  const setBodyFont = useStore((s) => s.setBodyFont)
  const fileRef = useRef<HTMLInputElement>(null)
  const { handleImport, handleExportDocx, handleExportPdf } = useResumeActions()

  useEffect(() => {
    const activeIds = new Set([headingFont, bodyFont])
    activeIds.forEach((id) => {
      const font = FONT_OPTIONS.find((f) => f.id === id)
      if (font?.import) {
        const linkId = `gf-${id}`
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link')
          link.id = linkId
          link.rel = 'stylesheet'
          link.href = `https://fonts.googleapis.com/css2?family=${font.import}&display=swap`
          document.head.appendChild(link)
        }
      }
    })
    document.querySelectorAll('link[id^="gf-"]').forEach((el) => {
      const fontId = el.id.replace('gf-', '')
      if (!activeIds.has(fontId)) el.remove()
    })
  }, [headingFont, bodyFont])

  return (
    <header className="h-12 shrink-0 flex items-center justify-between px-3 md:px-4 border-b border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Left: Brand + Template */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <svg aria-hidden="true" className="hidden md:block" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span className="text-sm font-semibold tracking-tight">简履</span>
          <span className="hidden md:inline text-[10px] text-[var(--text-3)] font-mono">Resume</span>
        </div>
        <span className="text-[var(--border-strong)]">|</span>
        <div className="flex gap-0.5 shrink-0">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`px-1.5 md:px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                template === t.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-2)] hover:bg-[var(--bg)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Font selectors — desktop only */}
        <span className="hidden md:inline text-[var(--border-strong)]">|</span>
        <div className="hidden md:flex items-center gap-1.5">
          <label htmlFor="heading-font-select" className="text-[10px] text-[var(--text-3)]">标题</label>
          <select
            id="heading-font-select"
            value={headingFont}
            onChange={(e) => setHeadingFont(e.target.value)}
            className="px-1.5 py-1 rounded border border-[var(--border)] text-[11px] bg-[var(--surface)] cursor-pointer"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          <label htmlFor="body-font-select" className="text-[10px] text-[var(--text-3)]">正文</label>
          <select
            id="body-font-select"
            value={bodyFont}
            onChange={(e) => setBodyFont(e.target.value)}
            className="px-1.5 py-1 rounded border border-[var(--border)] text-[11px] bg-[var(--surface)] cursor-pointer"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Actions — desktop only */}
      <div className="hidden md:flex items-center gap-2 shrink-0 ml-2">
        <input ref={fileRef} type="file" accept=".docx,.doc" className="hidden" onChange={handleImport} />
        <button
          onClick={() => fileRef.current?.click()}
          className="px-3 py-1.5 rounded text-[11px] font-medium text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
        >
          导入 Word
        </button>
        <button
          onClick={handleExportDocx}
          className="px-3 py-1.5 rounded text-[11px] font-medium text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
        >
          导出 Word
        </button>
        <button
          onClick={handleExportPdf}
          className="px-3 py-1.5 rounded text-[11px] font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          导出 PDF
        </button>
      </div>
    </header>
  )
}
