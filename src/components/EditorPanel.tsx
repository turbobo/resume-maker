import { useState, useRef, memo, useCallback } from 'react'
import { useStore, type EditFocus } from '../store'
import type { Experience, Education, Project, SectionId } from '../types'
import { SECTION_LABELS } from '../types'
import ATSPanel from './ATSPanel'
import { normalizeDate } from '../utils/dateFormat'
import { compressPhoto } from '../utils/photoCompress'

// ─── Generic drag-to-reorder hook ───

function useDragSort<T extends { id: string }>(
  items: T[],
  reorder: (newItems: T[]) => void
) {
  const [dragging, setDragging] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const stateRef = useRef({ items, fromIdx: null as number | null })
  stateRef.current.items = items

  const getDropIndex = useCallback((clientY: number) => {
    let best = 0, bestDist = Infinity
    itemRefs.current.forEach((el, i) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const dist = Math.abs(clientY - (rect.top + rect.height / 2))
      if (dist < bestDist) { bestDist = dist; best = i }
    })
    return best
  }, [])

  const startDrag = useCallback((e: React.PointerEvent, idx: number) => {
    e.preventDefault()
    stateRef.current.fromIdx = idx
    setDragging(idx)

    const onMove = (ev: PointerEvent) => setDropTarget(getDropIndex(ev.clientY))
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const from = stateRef.current.fromIdx
      const to = getDropIndex(ev.clientY)
      stateRef.current.fromIdx = null
      setDragging(null)
      setDropTarget(null)
      if (from !== null && from !== to) {
        const next = [...stateRef.current.items]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        reorder(next)
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [getDropIndex, reorder])

  return { dragging, dropTarget, itemRefs, startDrag }
}

// ─── Edit focus hook ───

function useEditFocus(section: SectionId, itemId?: string) {
  const setEditFocus = useStore((s) => s.setEditFocus)
  return {
    onFocus: useCallback(() => setEditFocus({ section, itemId }), [setEditFocus, section, itemId]),
    onBlur: useCallback(() => setEditFocus(null), [setEditFocus]),
  }
}

// ─── Helper components ───

const Input = memo(function Input({ label, value, onChange, placeholder, type = 'text', onFocus, onBlur }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; onFocus?: () => void; onBlur?: () => void
}) {
  return (
    <label className="block">
      <span className="text-[13px] md:text-[11px] font-medium text-[var(--text-2)] mb-1 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full px-3 md:px-2.5 py-2 md:py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-base md:text-[13px] transition-colors"
      />
    </label>
  )
})

const DateInput = memo(function DateInput({ label, value, onChange, placeholder, onFocus, onBlur }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; onFocus?: () => void; onBlur?: () => void
}) {
  const handleBlur = useCallback(() => {
    const normalized = normalizeDate(value)
    if (normalized !== value) onChange(normalized)
    onBlur?.()
  }, [value, onChange, onBlur])

  return (
    <label className="block">
      <span className="text-[13px] md:text-[11px] font-medium text-[var(--text-2)] mb-1 block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full px-3 md:px-2.5 py-2 md:py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-base md:text-[13px] transition-colors"
      />
    </label>
  )
})

const TextArea = memo(function TextArea({ label, value, onChange, placeholder, rows = 3, onFocus, onBlur }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; onFocus?: () => void; onBlur?: () => void
}) {
  return (
    <label className="block">
      <span className="text-[13px] md:text-[11px] font-medium text-[var(--text-2)] mb-1 block">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 md:px-2.5 py-2 md:py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-base md:text-[13px] resize-none transition-colors"
      />
    </label>
  )
})

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-[14px] md:text-[12px] font-semibold text-[var(--text)]">{title}</h3>
      <button onClick={onAdd} className="text-[13px] md:text-[11px] px-2.5 py-1.5 md:px-0 md:py-0 rounded md:rounded-none text-[var(--text-3)] hover:text-[var(--text)] active:bg-[var(--bg)] md:active:bg-transparent transition-colors">
        + 添加
      </button>
    </div>
  )
}

const GripIcon = () => (
  <svg aria-hidden="true" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
  </svg>
)

function ItemCard({ children, onRemove, dragHandle, isDragging, isDropTarget }: {
  children: React.ReactNode
  onRemove: () => void
  dragHandle?: (e: React.PointerEvent) => void
  isDragging?: boolean
  isDropTarget?: boolean
}) {
  return (
    <div className={`relative p-3 rounded-lg border bg-[var(--surface)] mb-2 group transition-all select-none
      ${isDragging ? 'opacity-40 scale-[0.98] border-[var(--border)]' :
        isDropTarget ? 'border-[var(--accent)] shadow-sm' : 'border-[var(--border)]'}`}
    >
      <button
        onClick={onRemove}
        aria-label="删除此项"
        className="absolute top-2 right-2 w-7 h-7 md:w-5 md:h-5 rounded flex items-center justify-center text-[11px] md:text-[10px] text-[var(--text-3)] hover:text-red-500 hover:bg-red-50 md:opacity-0 md:group-hover:opacity-100 transition-all"
      >
        ✕
      </button>
      <div className="flex items-start gap-2">
        {dragHandle && (
          <div
            onPointerDown={dragHandle}
            style={{ touchAction: 'none' }}
            aria-label="拖拽排序"
            className="mt-1 shrink-0 cursor-grab active:cursor-grabbing p-0.5 text-[var(--text-3)] md:opacity-0 md:group-hover:opacity-100 hover:text-[var(--text-2)] transition-all"
          >
            <GripIcon />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}

const ExperienceCard = memo(function ExperienceCard({ item, dragHandle, isDragging, isDropTarget }: {
  item: Experience
  dragHandle?: (e: React.PointerEvent) => void
  isDragging?: boolean
  isDropTarget?: boolean
}) {
  const updateExperience = useStore((s) => s.updateExperience)
  const removeExperience = useStore((s) => s.removeExperience)
  const onRemove = useCallback(() => removeExperience(item.id), [removeExperience, item.id])
  const { onFocus, onBlur } = useEditFocus('experience', item.id)

  return (
    <ItemCard onRemove={onRemove} dragHandle={dragHandle} isDragging={isDragging} isDropTarget={isDropTarget}>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input label="公司" value={item.company} onChange={(v) => updateExperience(item.id, { company: v })} placeholder="公司名称" onFocus={onFocus} onBlur={onBlur} />
          <Input label="职位" value={item.title} onChange={(v) => updateExperience(item.id, { title: v })} placeholder="职位名称" onFocus={onFocus} onBlur={onBlur} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <DateInput label="开始" value={item.startDate} onChange={(v) => updateExperience(item.id, { startDate: v })} placeholder="2021-03" onFocus={onFocus} onBlur={onBlur} />
          <DateInput label="结束" value={item.endDate} onChange={(v) => updateExperience(item.id, { endDate: v })} placeholder="至今" onFocus={onFocus} onBlur={onBlur} />
        </div>
        <TextArea label="工作内容" value={item.description} onChange={(v) => updateExperience(item.id, { description: v })} placeholder="描述主要职责和成果..." rows={2} onFocus={onFocus} onBlur={onBlur} />
      </div>
    </ItemCard>
  )
})

const EducationCard = memo(function EducationCard({ item, dragHandle, isDragging, isDropTarget }: {
  item: Education
  dragHandle?: (e: React.PointerEvent) => void
  isDragging?: boolean
  isDropTarget?: boolean
}) {
  const updateEducation = useStore((s) => s.updateEducation)
  const removeEducation = useStore((s) => s.removeEducation)
  const onRemove = useCallback(() => removeEducation(item.id), [removeEducation, item.id])
  const { onFocus, onBlur } = useEditFocus('education', item.id)

  return (
    <ItemCard onRemove={onRemove} dragHandle={dragHandle} isDragging={isDragging} isDropTarget={isDropTarget}>
      <div className="space-y-2">
        <Input label="学校" value={item.school} onChange={(v) => updateEducation(item.id, { school: v })} placeholder="学校名称" onFocus={onFocus} onBlur={onBlur} />
        <div className="grid grid-cols-2 gap-2">
          <Input label="学历" value={item.degree} onChange={(v) => updateEducation(item.id, { degree: v })} placeholder="本科" onFocus={onFocus} onBlur={onBlur} />
          <Input label="专业" value={item.major} onChange={(v) => updateEducation(item.id, { major: v })} placeholder="专业名称" onFocus={onFocus} onBlur={onBlur} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <DateInput label="开始" value={item.startDate} onChange={(v) => updateEducation(item.id, { startDate: v })} placeholder="2014-09" onFocus={onFocus} onBlur={onBlur} />
          <DateInput label="结束" value={item.endDate} onChange={(v) => updateEducation(item.id, { endDate: v })} placeholder="2018-06" onFocus={onFocus} onBlur={onBlur} />
        </div>
      </div>
    </ItemCard>
  )
})

const ProjectCard = memo(function ProjectCard({ item, dragHandle, isDragging, isDropTarget }: {
  item: Project
  dragHandle?: (e: React.PointerEvent) => void
  isDragging?: boolean
  isDropTarget?: boolean
}) {
  const updateProject = useStore((s) => s.updateProject)
  const removeProject = useStore((s) => s.removeProject)
  const onRemove = useCallback(() => removeProject(item.id), [removeProject, item.id])
  const { onFocus, onBlur } = useEditFocus('projects', item.id)

  return (
    <ItemCard onRemove={onRemove} dragHandle={dragHandle} isDragging={isDragging} isDropTarget={isDropTarget}>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input label="项目名" value={item.name} onChange={(v) => updateProject(item.id, { name: v })} placeholder="项目名称" onFocus={onFocus} onBlur={onBlur} />
          <Input label="角色" value={item.role} onChange={(v) => updateProject(item.id, { role: v })} placeholder="技术负责人" onFocus={onFocus} onBlur={onBlur} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <DateInput label="开始" value={item.startDate} onChange={(v) => updateProject(item.id, { startDate: v })} placeholder="2022-01" onFocus={onFocus} onBlur={onBlur} />
          <DateInput label="结束" value={item.endDate} onChange={(v) => updateProject(item.id, { endDate: v })} placeholder="2023-06" onFocus={onFocus} onBlur={onBlur} />
        </div>
        <TextArea label="项目描述" value={item.description} onChange={(v) => updateProject(item.id, { description: v })} placeholder="描述项目内容和你的贡献..." rows={2} onFocus={onFocus} onBlur={onBlur} />
      </div>
    </ItemCard>
  )
})

// ─── Drag-to-reorder section order ───

function SectionOrder() {
  const sectionOrder = useStore((s) => s.data.sectionOrder)
  const reorderSections = useStore((s) => s.reorderSections)
  const [dragging, setDragging] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const dragIndexRef = useRef<number | null>(null)
  const sectionOrderRef = useRef(sectionOrder)
  sectionOrderRef.current = sectionOrder

  const getDropIndex = useCallback((clientY: number): number => {
    const rects = itemRefs.current.map((el) => el?.getBoundingClientRect())
    let best = 0
    let bestDist = Infinity
    rects.forEach((rect, i) => {
      if (!rect) return
      const mid = rect.top + rect.height / 2
      const dist = Math.abs(clientY - mid)
      if (dist < bestDist) { bestDist = dist; best = i }
    })
    return best
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent, idx: number) => {
    e.preventDefault()
    dragIndexRef.current = idx
    setDragging(idx)

    const onMove = (ev: PointerEvent) => {
      const target = getDropIndex(ev.clientY)
      setDropTarget(target)
    }

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const from = dragIndexRef.current
      const to = getDropIndex(ev.clientY)
      setDragging(null)
      setDropTarget(null)
      dragIndexRef.current = null
      if (from !== null && from !== to) {
        const newOrder = [...sectionOrderRef.current]
        const [moved] = newOrder.splice(from, 1)
        newOrder.splice(to, 0, moved)
        reorderSections(newOrder)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [getDropIndex, reorderSections])

  const moveUp = (idx: number) => {
    if (idx === 0) return
    const newOrder = [...sectionOrder]
    ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
    reorderSections(newOrder)
  }

  const moveDown = (idx: number) => {
    if (idx === sectionOrder.length - 1) return
    const newOrder = [...sectionOrder]
    ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
    reorderSections(newOrder)
  }

  return (
    <section>
      <h3 className="text-[14px] md:text-[12px] font-semibold text-[var(--text)] mb-2">模块排序</h3>
      <p className="text-[12px] md:text-[10px] text-[var(--text-3)] mb-2">拖拽或使用箭头调整简历模块顺序</p>
      <div className="space-y-1.5 md:space-y-1">
        {sectionOrder.map((id, idx) => (
          <div
            key={id}
            ref={(el) => { itemRefs.current[idx] = el }}
            className={`flex items-center gap-2 px-3 md:px-2.5 py-2.5 md:py-1.5 rounded border bg-[var(--surface)] transition-all select-none
              ${dragging === idx ? 'opacity-40 scale-[0.97] border-[var(--border)]' :
                dropTarget === idx && dragging !== null ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm' :
                'border-[var(--border)] hover:border-[var(--border-strong)]'}`}
          >
            <div
              onPointerDown={(e) => handlePointerDown(e, idx)}
              aria-label="拖拽排序"
              style={{ touchAction: 'none' }}
              className="cursor-grab active:cursor-grabbing p-0.5 -ml-0.5 rounded hover:bg-[var(--bg)] transition-colors"
            >
              <svg aria-hidden="true" className="w-4 h-4 md:w-3.5 md:h-3.5 text-[var(--text-3)]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
              </svg>
            </div>
            <span className="text-[14px] md:text-[12px] font-medium flex-1">{SECTION_LABELS[id]}</span>
            <div className="flex gap-1 md:gap-0.5">
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                aria-label={`上移${SECTION_LABELS[id]}`}
                className="w-8 h-8 md:w-5 md:h-5 rounded flex items-center justify-center text-[14px] md:text-[10px] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg)] disabled:opacity-30 transition-colors"
              >
                ↑
              </button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === sectionOrder.length - 1}
                aria-label={`下移${SECTION_LABELS[id]}`}
                className="w-8 h-8 md:w-5 md:h-5 rounded flex items-center justify-center text-[14px] md:text-[10px] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg)] disabled:opacity-30 transition-colors"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Sub-section components with granular selectors ───

function BasicInfoSection() {
  const name = useStore((s) => s.data.name)
  const title = useStore((s) => s.data.title)
  const email = useStore((s) => s.data.email)
  const phone = useStore((s) => s.data.phone)
  const location = useStore((s) => s.data.location)
  const website = useStore((s) => s.data.website)
  const photo = useStore((s) => s.data.photo)
  const update = useStore((s) => s.update)
  const setPhoto = useStore((s) => s.setPhoto)
  const photoRef = useRef<HTMLInputElement>(null)
  const { onFocus, onBlur } = useEditFocus('basic')

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await compressPhoto(file)
      setPhoto(dataUrl)
    } catch { /* ignore */ }
    e.target.value = ''
  }, [setPhoto])

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] md:text-[12px] font-semibold text-[var(--text)]">基本信息</h3>
      </div>
      <div className="flex gap-3 mb-2">
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        <button
          onClick={() => photoRef.current?.click()}
          className="shrink-0 w-16 h-16 md:w-14 md:h-14 rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface)] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[var(--accent)] transition-colors group"
        >
          {photo ? (
            <img src={photo} alt="照片" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <svg aria-hidden="true" className="w-5 h-5 text-[var(--text-3)] group-hover:text-[var(--text-2)] mx-auto mb-0.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
              </svg>
              <span className="text-[9px] text-[var(--text-3)]">照片</span>
            </div>
          )}
        </button>
        {photo && (
          <button
            onClick={() => setPhoto('')}
            className="self-start text-[11px] text-[var(--text-3)] hover:text-red-500 transition-colors"
          >
            移除
          </button>
        )}
        <div className="flex-1 grid grid-cols-2 gap-2">
          <Input label="姓名" value={name} onChange={(v) => update({ name: v })} placeholder="张三" onFocus={onFocus} onBlur={onBlur} />
          <Input label="职位" value={title} onChange={(v) => update({ title: v })} placeholder="前端工程师" onFocus={onFocus} onBlur={onBlur} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input label="邮箱" value={email} onChange={(v) => update({ email: v })} placeholder="email@example.com" type="email" onFocus={onFocus} onBlur={onBlur} />
          <Input label="电话" value={phone} onChange={(v) => update({ phone: v })} placeholder="138-0000-0000" onFocus={onFocus} onBlur={onBlur} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="所在地" value={location} onChange={(v) => update({ location: v })} placeholder="北京" onFocus={onFocus} onBlur={onBlur} />
          <Input label="网站" value={website} onChange={(v) => update({ website: v })} placeholder="github.com/xxx" onFocus={onFocus} onBlur={onBlur} />
        </div>
      </div>
    </section>
  )
}

function SummarySection() {
  const summary = useStore((s) => s.data.summary)
  const update = useStore((s) => s.update)
  const { onFocus, onBlur } = useEditFocus('summary')

  return (
    <section>
      <TextArea label="个人简介" value={summary} onChange={(v) => update({ summary: v })} placeholder="简要描述你的职业背景和核心优势..." rows={3} onFocus={onFocus} onBlur={onBlur} />
    </section>
  )
}

function SkillsEditorSection() {
  const skills = useStore((s) => s.data.skills)
  const update = useStore((s) => s.update)
  const { onFocus, onBlur } = useEditFocus('skills')

  return (
    <section>
      <TextArea label="技能（逗号分隔）" value={skills} onChange={(v) => update({ skills: v })} placeholder="React, TypeScript, Node.js..." rows={2} onFocus={onFocus} onBlur={onBlur} />
    </section>
  )
}

function ExperiencesSection() {
  const experiences = useStore((s) => s.data.experiences)
  const addExperience = useStore((s) => s.addExperience)
  const reorderExperiences = useStore((s) => s.reorderExperiences)
  const { dragging, dropTarget, itemRefs, startDrag } = useDragSort(experiences, reorderExperiences)

  return (
    <section>
      <SectionHeader title="工作经历" onAdd={addExperience} />
      {experiences.map((exp, idx) => (
        <div key={exp.id} ref={(el) => { itemRefs.current[idx] = el }}>
          <ExperienceCard
            item={exp}
            dragHandle={(e) => startDrag(e, idx)}
            isDragging={dragging === idx}
            isDropTarget={dropTarget === idx && dragging !== null}
          />
        </div>
      ))}
    </section>
  )
}

function EducationEditorSection() {
  const education = useStore((s) => s.data.education)
  const addEducation = useStore((s) => s.addEducation)
  const reorderEducation = useStore((s) => s.reorderEducation)
  const { dragging, dropTarget, itemRefs, startDrag } = useDragSort(education, reorderEducation)

  return (
    <section>
      <SectionHeader title="教育背景" onAdd={addEducation} />
      {education.map((edu, idx) => (
        <div key={edu.id} ref={(el) => { itemRefs.current[idx] = el }}>
          <EducationCard
            item={edu}
            dragHandle={(e) => startDrag(e, idx)}
            isDragging={dragging === idx}
            isDropTarget={dropTarget === idx && dragging !== null}
          />
        </div>
      ))}
    </section>
  )
}

function ProjectsSection() {
  const projects = useStore((s) => s.data.projects)
  const addProject = useStore((s) => s.addProject)
  const reorderProjects = useStore((s) => s.reorderProjects)
  const { dragging, dropTarget, itemRefs, startDrag } = useDragSort(projects, reorderProjects)

  return (
    <section>
      <SectionHeader title="项目经历" onAdd={addProject} />
      {projects.map((proj, idx) => (
        <div key={proj.id} ref={(el) => { itemRefs.current[idx] = el }}>
          <ProjectCard
            item={proj}
            dragHandle={(e) => startDrag(e, idx)}
            isDragging={dragging === idx}
            isDropTarget={dropTarget === idx && dragging !== null}
          />
        </div>
      ))}
    </section>
  )
}

// ─── Main Editor Panel ───

export default function EditorPanel() {
  return (
    <aside className="w-full md:w-[360px] flex-1 md:flex-none shrink-0 md:border-r border-[var(--border)] bg-[var(--bg)] overflow-y-auto p-5 md:p-4 space-y-6 md:space-y-5">
      <ATSPanel />
      <SectionOrder />
      <BasicInfoSection />
      <SummarySection />
      <SkillsEditorSection />
      <ExperiencesSection />
      <EducationEditorSection />
      <ProjectsSection />
    </aside>
  )
}