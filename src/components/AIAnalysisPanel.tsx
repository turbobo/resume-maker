// AI 行业分析面板 — 选择目标行业，由大模型按行业给出简历优化建议
// 服务端代理调用商汤 API，前端不接触 API Key

import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { AIRequestError } from '../utils/aiClient'
import { analyzeResume, INDUSTRY_OPTIONS } from '../utils/resumeAnalyze'
import type { AnalyzeIssue, AnalyzeResult } from '../utils/resumeAnalyze'

const SEVERITY_STYLES: Record<AnalyzeIssue['severity'], { bg: string; icon: string }> = {
  error: { bg: 'bg-red-500', icon: '✕' },
  warning: { bg: 'bg-amber-400', icon: '!' },
  tip: { bg: 'bg-blue-400', icon: '↑' },
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function ScoreItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
      <span className="text-[22px] md:text-[20px] font-bold leading-none" style={{ color: scoreColor(value) }}>
        {value}
      </span>
      <span className="text-[10px] text-[var(--text-3)]">{label}</span>
    </div>
  )
}

export default function AIAnalysisPanel() {
  const data = useStore((s) => s.data)
  const [open, setOpen] = useState(false)
  const [industry, setIndustry] = useState<string>(INDUSTRY_OPTIONS[0])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const handleAnalyze = async () => {
    if (loading) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const res = await analyzeResume(industry, data, controller.signal)
      setResult(res)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(err instanceof AIRequestError ? err.message : '分析失败，请稍后重试')
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }

  const selectIndustry = (option: string) => {
    setIndustry(option)
    setResult(null)
    setError(null)
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3 hover:bg-[var(--bg)] transition-colors text-left"
      >
        <div className="w-11 h-11 md:w-11 md:h-11 shrink-0 rounded-lg bg-[var(--accent)] flex items-center justify-center">
          <svg aria-hidden="true" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
            <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] md:text-[12px] font-semibold text-[var(--text)]">AI 行业分析</div>
          <div className="text-[11px] md:text-[10px] text-[var(--text-3)] mt-0.5 truncate">
            {result
              ? `综合评分 ${result.score} · 行业匹配度 ${result.industryFit}`
              : '选择目标行业，获取针对性优化建议'}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {result && (
            <span className="text-[12px] md:text-[11px] font-semibold" style={{ color: scoreColor(result.score) }}>
              {result.score} 分
            </span>
          )}
          <svg
            aria-hidden="true"
            className={`w-4 h-4 text-[var(--text-3)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--border)] px-3 pt-3 pb-3.5">
          {/* 行业选择 */}
          <h4 className="text-[11px] md:text-[10px] font-medium text-[var(--text-3)] mb-1.5">目标行业</h4>
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRY_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => selectIndustry(option)}
                className={`px-2 py-1.5 md:py-1 rounded text-[12px] md:text-[11px] border transition-colors ${
                  industry === option
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'text-[var(--text-2)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* 分析按钮 */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full mt-2.5 flex items-center justify-center gap-2 px-3 py-2.5 md:py-2 rounded-lg bg-[var(--accent)] text-white text-[13px] md:text-[12px] font-medium cursor-pointer hover:bg-[var(--accent-hover)] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                正在分析，约需 10-30 秒…
              </>
            ) : result ? (
              '重新分析'
            ) : (
              '开始分析'
            )}
          </button>

          {error && !loading && (
            <p className="mt-2 text-[12px] md:text-[11px] text-red-500 leading-relaxed">{error}</p>
          )}

          {loading && !result && (
            <p className="mt-2 text-[11px] md:text-[10px] text-[var(--text-3)] leading-relaxed">
              将分析简历内容并按{industry}招聘标准给出建议
            </p>
          )}

          {result && !loading && (
            <div className="mt-3 space-y-3 fade-in">
              {/* 评分 + 总评 */}
              <div className="rounded-lg bg-[var(--bg)] px-3 py-2.5">
                <div className="flex items-center gap-4">
                  <ScoreItem value={result.score} label="综合评分" />
                  <div className="w-px h-9 bg-[var(--border)]" />
                  <ScoreItem value={result.industryFit} label="行业匹配度" />
                </div>
                {result.verdict && (
                  <p className="mt-2 pt-2 border-t border-[var(--border)] text-[12px] md:text-[11px] text-[var(--text-2)] leading-relaxed">
                    {result.verdict}
                  </p>
                )}
              </div>

              {/* 亮点 */}
              {result.highlights.length > 0 && (
                <div>
                  <h4 className="text-[12px] md:text-[11px] font-semibold text-[var(--text)] mb-1.5">亮点</h4>
                  <ul className="space-y-1">
                    {result.highlights.map((item, i) => (
                      <li key={i} className="flex gap-2 text-[12px] md:text-[11px] text-[var(--text-2)] leading-relaxed">
                        <span className="text-green-500 shrink-0 font-bold">✓</span>
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 问题诊断 */}
              {result.issues.length > 0 && (
                <div>
                  <h4 className="text-[12px] md:text-[11px] font-semibold text-[var(--text)] mb-1.5">问题诊断</h4>
                  <div className="space-y-2">
                    {result.issues.map((issue, i) => {
                      const s = SEVERITY_STYLES[issue.severity]
                      return (
                        <div key={i} className="flex gap-2.5 items-start">
                          <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5 ${s.bg}`}>
                            {s.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[12px] md:text-[11px] text-[var(--text-2)] leading-relaxed">{issue.message}</div>
                            {issue.suggestion && (
                              <div className="text-[11px] md:text-[10px] text-[var(--text-3)] leading-relaxed mt-0.5">
                                建议：{issue.suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 优化建议 */}
              {result.suggestions.length > 0 && (
                <div>
                  <h4 className="text-[12px] md:text-[11px] font-semibold text-[var(--text)] mb-1.5">
                    面向{industry}的优化建议
                  </h4>
                  <div className="space-y-2">
                    {result.suggestions.map((item, i) => (
                      <div key={i} className="flex gap-2.5 items-start">
                        <span className="shrink-0 w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center text-[9px] font-bold text-white mt-0.5">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[12px] md:text-[11px] font-medium text-[var(--text)] leading-relaxed">{item.title}</div>
                          {item.detail && (
                            <div className="text-[11px] md:text-[10px] text-[var(--text-2)] leading-relaxed mt-0.5">{item.detail}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 行业关键词 */}
              {result.keywords.length > 0 && (
                <div>
                  <h4 className="text-[12px] md:text-[11px] font-semibold text-[var(--text)] mb-1.5">建议关键词</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.map((word, i) => (
                      <span key={i} className="text-[11px] md:text-[10px] px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text-2)]">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-[var(--text-3)]">由 AI 生成，仅供优化参考</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
