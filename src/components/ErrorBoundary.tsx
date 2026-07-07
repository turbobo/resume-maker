import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-[var(--text-2)]">
          <div>
            <p className="text-sm font-medium mb-2">预览渲染出错</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-xs px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
