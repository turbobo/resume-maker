import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { checkATS } from '../utils/atsChecker'
import type { ATSSeverity } from '../utils/atsChecker'

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function getScoreLabel(score: number): string {
  if (score >= 85) return '优秀'
  if (score >= 70) return '良好'
  if (score >= 55) return '待改善'
  return '较差'
}

function ScoreRing({ score }: { score: number }) {
  const size = 44
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = getScoreColor(score)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  )
}

const SEVERITY_STYLES: Record<ATSSeverity, { bg: string; icon: string }> = {
  error:   { bg: 'bg-red-500',   icon: '✕' },
  warning: { bg: 'bg-amber-400', icon: '!' },
  tip:     { bg: 'bg-blue-400',  icon: '↑' },
}

const BREAKDOWN_ITEMS = [
  { key: 'contactScore'    as const, label: '联系方式', max: 25 },
  { key: 'experienceScore' as const, label: '工作经历', max: 25 },
  { key: 'educationScore'  as const, label: '教育背景', max: 20 },
  { key: 'skillsScore'     as const, label: '技能',     max: 15 },
  { key: 'summaryScore'    as const, label: '个人简介', max: 10 },
  { key: 'qualityScore'    as const, label: '内容质量', max: 5  },
]

export default function ATSPanel() {
  const data = useStore((s) => s.data)
  const [open, setOpen] = useState(false)
  const result = useMemo(() => checkATS(data), [data])

  const errorCount = result.issues.filter((i) => i.severity === 'error').length
  const label = getScoreLabel(result.score)
  const color = getScoreColor(result.score)

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3 hover:bg-[var(--bg)] transition-colors text-left"
      >
        <ScoreRing score={result.score} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] md:text-[12px] font-semibold text-[var(--text)]">简历体检</div>
          <div className="text-[11px] md:text-[10px] text-[var(--text-3)] mt-0.5">
            {errorCount > 0 ? `${errorCount} 个问题需处理` : result.issues.length > 0 ? `${result.issues.length} 条建议` : 'ATS 兼容性良好'}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[12px] md:text-[11px] font-semibold" style={{ color }}>{label}</span>
          <svg
            className={`w-4 h-4 text-[var(--text-3)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--border)]">
          {/* Issues list */}
          <div className="px-3 pt-3 pb-2 space-y-2">
            {result.issues.length === 0 ? (
              <p className="text-[12px] md:text-[11px] text-[var(--text-3)] text-center py-1">
                各项完整，ATS 兼容性良好 ✓
              </p>
            ) : (
              result.issues.map((issue) => {
                const s = SEVERITY_STYLES[issue.severity]
                return (
                  <div key={issue.id} className="flex gap-2.5 items-start">
                    <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5 ${s.bg}`}>
                      {s.icon}
                    </span>
                    <span className="text-[12px] md:text-[11px] text-[var(--text-2)] leading-relaxed">{issue.message}</span>
                  </div>
                )
              })
            )}
          </div>

          {/* Score breakdown */}
          <div className="mx-3 mb-3 mt-1 pt-3 border-t border-[var(--border)] grid grid-cols-3 gap-y-2">
            {BREAKDOWN_ITEMS.map(({ key, label, max }) => {
              const val = result[key]
              const pct = Math.round((val / max) * 100)
              return (
                <div key={key} className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-[var(--text-3)]">{label}</span>
                  <div className="w-full max-w-[60px] h-1 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: getScoreColor(pct) }}
                    />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: getScoreColor(pct) }}>
                    {val}<span className="text-[var(--text-3)] font-normal">/{max}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
