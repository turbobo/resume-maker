import { useState, useRef } from 'react'
import { useStore } from '../store'
import { FONT_OPTIONS } from '../types'

interface Props {
  activeView: 'editor' | 'preview'
  onChangeView: (view: 'editor' | 'preview') => void
}

function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-x-0 bottom-0 bg-[var(--surface)] rounded-t-2xl transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-8 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>
        <h3 className="px-5 pb-3 text-[14px] font-semibold text-[var(--text)]">{title}</h3>
        <div className="px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function MobileNav({ activeView, onChangeView }: Props) {
  const [sheet, setSheet] = useState<'export' | 'settings' | null>(null)
  const headingFont = useStore((s) => s.data.headingFont)
  const bodyFont = useStore((s) => s.data.bodyFont)
  const setHeadingFont = useStore((s) => s.setHeadingFont)
  const setBodyFont = useStore((s) => s.setBodyFont)
  const importData = useStore((s) => s.importData)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExportPdf = async () => {
    setSheet(null)
    const { exportPdf } = await import('../utils/exportPdf')
    exportPdf()
  }

  const handleExportDocx = async () => {
    setSheet(null)
    const { exportDocx } = await import('../utils/exportDocx')
    exportDocx(useStore.getState().data)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { importWordFile } = await import('../utils/importWord')
      const parsed = await importWordFile(file)
      importData(parsed)
    } catch {
      alert('导入失败，请检查文件格式')
    }
    e.target.value = ''
    setSheet(null)
  }

  return (
    <>
      <nav className="shrink-0 flex items-end justify-around border-t border-[var(--border)] bg-[var(--surface)] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => onChangeView('editor')}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 min-w-[60px] transition-colors ${
            activeView === 'editor' ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeView === 'editor' ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span className="text-[10px] font-medium">编辑</span>
        </button>

        <button
          onClick={() => onChangeView('preview')}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 min-w-[60px] transition-colors ${
            activeView === 'preview' ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeView === 'preview' ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="text-[10px] font-medium">预览</span>
        </button>

        <button
          onClick={() => setSheet('export')}
          className="flex flex-col items-center gap-0.5 py-1 px-4 min-w-[60px] text-[var(--text-3)] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="text-[10px] font-medium">导出</span>
        </button>

        <button
          onClick={() => setSheet('settings')}
          className="flex flex-col items-center gap-0.5 py-1 px-4 min-w-[60px] text-[var(--text-3)] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          <span className="text-[10px] font-medium">设置</span>
        </button>
      </nav>

      <input ref={fileRef} type="file" accept=".docx,.doc" className="hidden" onChange={handleImport} />

      <BottomSheet open={sheet === 'export'} onClose={() => setSheet(null)} title="导出简历">
        <div className="space-y-2.5">
          <button onClick={handleExportPdf} className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-[var(--accent)] text-white text-[14px] font-medium active:opacity-80 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            导出 PDF
          </button>
          <button onClick={handleExportDocx} className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-[var(--border)] text-[14px] font-medium text-[var(--text)] active:bg-[var(--bg)] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            导出 Word
          </button>
          <button
            onClick={() => { setSheet(null); setTimeout(() => fileRef.current?.click(), 100) }}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-[var(--border)] text-[14px] font-medium text-[var(--text)] active:bg-[var(--bg)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            导入 Word
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'settings'} onClose={() => setSheet(null)} title="设置">
        <div className="space-y-5">
          <div>
            <label className="text-[12px] font-medium text-[var(--text-2)] mb-2 block">标题字体</label>
            <select
              value={headingFont}
              onChange={(e) => setHeadingFont(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-[14px] bg-[var(--surface)] appearance-none"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--text-2)] mb-2 block">正文字体</label>
            <select
              value={bodyFont}
              onChange={(e) => setBodyFont(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-[14px] bg-[var(--surface)] appearance-none"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
