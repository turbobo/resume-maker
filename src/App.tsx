import { useState } from 'react'
import EditorPanel from './components/EditorPanel'
import PreviewPanel from './components/PreviewPanel'
import TopBar from './components/TopBar'

export default function App() {
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')

  return (
    <div className="h-full flex flex-col bg-[var(--bg)]">
      <TopBar />
      <div className="md:hidden flex shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
        <button
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2 text-[12px] font-medium transition-colors ${
            mobileView === 'editor'
              ? 'text-[var(--text)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-3)]'
          }`}
        >
          编辑
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2 text-[12px] font-medium transition-colors ${
            mobileView === 'preview'
              ? 'text-[var(--text)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-3)]'
          }`}
        >
          预览
        </button>
      </div>
      <div className="flex-1 flex min-h-0">
        <div className={`${mobileView !== 'editor' ? 'hidden' : 'contents'} md:contents`}>
          <EditorPanel />
        </div>
        <div className={`${mobileView !== 'preview' ? 'hidden' : 'contents'} md:contents`}>
          <PreviewPanel />
        </div>
      </div>
    </div>
  )
}
