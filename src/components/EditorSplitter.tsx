// 编辑区与预览区之间的拖拽分隔条（仅桌面端）
// 拖拽期间直接修改容器的 CSS 变量（避免高频写 store 触发整页持久化），松开时一次性写入 store
import { useCallback, useRef } from 'react'
import { MAX_EDITOR_WIDTH, MIN_EDITOR_WIDTH, useStore } from '../store'

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export default function EditorSplitter({ containerRef }: Props) {
  const setEditorWidth = useStore((s) => s.setEditorWidth)
  const dragRef = useRef({ startX: 0, startWidth: 0, current: 0 })

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const container = containerRef.current
      if (!container) return

      const startWidth = useStore.getState().editorWidth
      dragRef.current = { startX: e.clientX, startWidth, current: startWidth }

      const onMove = (ev: PointerEvent) => {
        const next = Math.min(
          MAX_EDITOR_WIDTH,
          Math.max(MIN_EDITOR_WIDTH, dragRef.current.startWidth + (ev.clientX - dragRef.current.startX)),
        )
        dragRef.current.current = next
        container.style.setProperty('--editor-width', `${next}px`)
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        // 拖动结束一次性持久化（store 重渲染后的变量值与手动设置值一致，无跳变）
        setEditorWidth(dragRef.current.current)
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [containerRef, setEditorWidth],
  )

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="拖动调整编辑区宽度"
      onPointerDown={handlePointerDown}
      className="hidden md:block w-1 shrink-0 cursor-col-resize relative group"
    >
      {/* 扩大拖拽命中区域 */}
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-[var(--border)] group-hover:bg-[var(--accent)]/40 group-active:bg-[var(--accent)]/70 transition-colors" />
    </div>
  )
}
