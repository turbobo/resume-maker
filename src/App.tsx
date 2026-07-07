import EditorPanel from './components/EditorPanel'
import PreviewPanel from './components/PreviewPanel'
import TopBar from './components/TopBar'

export default function App() {
  return (
    <div className="h-full flex flex-col bg-[var(--bg)]">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <EditorPanel />
        <PreviewPanel />
      </div>
    </div>
  )
}
