import { useState, useEffect } from 'react'
import EditorPanel from './components/EditorPanel'
import PreviewPanel from './components/PreviewPanel'
import TopBar from './components/TopBar'
import MobileNav from './components/MobileNav'
import ErrorBoundary from './components/ErrorBoundary'

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
      <div className="flex-1 flex min-h-0">
        {(isDesktop || mobileView === 'editor') && <EditorPanel />}
        {(isDesktop || mobileView === 'preview') && <ErrorBoundary><PreviewPanel /></ErrorBoundary>}
      </div>
      {!isDesktop && (
        <MobileNav activeView={mobileView} onChangeView={setMobileView} />
      )}
    </div>
  )
}
