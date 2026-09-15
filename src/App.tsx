import { useState, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import EditorPanel from './components/EditorPanel'
import PreviewPanel from './components/PreviewPanel'
import EditorSplitter from './components/EditorSplitter'
import TopBar from './components/TopBar'
import MobileNav from './components/MobileNav'
import ErrorBoundary from './components/ErrorBoundary'
import { useStore } from './store'

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
  const editorWidth = useStore((s) => s.editorWidth)
  const layoutMode = useStore((s) => s.layoutMode)
  const setLayoutMode = useStore((s) => s.setLayoutMode)
  const containerRef = useRef<HTMLDivElement>(null)

  // 专注模式下按 Esc 退出
  useEffect(() => {
    if (layoutMode === 'split') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLayoutMode('split')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [layoutMode, setLayoutMode])

  const showEditor = isDesktop ? layoutMode !== 'focus-preview' : mobileView === 'editor'
  const showPreview = isDesktop ? layoutMode !== 'focus-editor' : mobileView === 'preview'
  const showSplitter = isDesktop && layoutMode === 'split'

  return (
    <div className="h-full flex flex-col bg-[var(--bg)]">
      <TopBar />
      <div
        ref={containerRef}
        className="flex-1 flex min-h-0"
        style={{ '--editor-width': `${editorWidth}px` } as CSSProperties}
      >
        {showEditor && <EditorPanel />}
        {showSplitter && <EditorSplitter containerRef={containerRef} />}
        {showPreview && <ErrorBoundary><PreviewPanel /></ErrorBoundary>}
      </div>
      {!isDesktop && (
        <MobileNav activeView={mobileView} onChangeView={setMobileView} />
      )}
    </div>
  )
}
