import { useState, useEffect } from 'react'
import EditorPanel from './components/EditorPanel'
import PreviewPanel from './components/PreviewPanel'
import TopBar from './components/TopBar'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])
  return matches
}

export default function App() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')

  return (
    <div className="h-full flex flex-col bg-[var(--bg)]">
      <TopBar />
      {!isDesktop && (
        <div className="flex shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
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
      )}
      <div className="flex-1 flex min-h-0">
        {(isDesktop || mobileView === 'editor') && <EditorPanel />}
        {(isDesktop || mobileView === 'preview') && <PreviewPanel />}
      </div>
    </div>
  )
}
