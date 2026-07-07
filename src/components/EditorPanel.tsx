import { useState, useRef, memo, useCallback } from 'react'
import { useStore } from '../store'
import type { Experience, Education, Project } from '../types'
import { SECTION_LABELS } from '../types'

// ─── Helper components ───

const Input = memo(function Input({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-[var(--text-2)] mb-1 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[13px] transition-colors"
      />
    </label>
  )
})

const TextArea = memo(function TextArea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-[var(--text-2)] mb-1 block">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[13px] resize-none transition-colors"
      />
    </label>
  )
})

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-[12px] font-semibold text-[var(--text)]">{title}</h3>
      <button onClick={onAdd} className="text-[11px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
        + 添加
      </button>
    </div>
  )
}

function ItemCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="relative p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] mb-2 group">
      <button
        onClick={onRemove}
        aria-label="删除此项"
        className="absolute top-2 right-2 w-7 h-7 md:w-5 md:h-5 rounded flex items-center justify-center text-[11px] md:text-[10px] text-[var(--text-3)] hover:text-red-500 hover:bg-red-50 md:opacity-0 md:group-hover:opacity-100 transition-all"
      >
        ✕
      </button>
      {children}
    </div>
  )
}

const ExperienceCard = memo(function ExperienceCard({ item }: {
  item: Experience
}) {
  const updateExperience = useStore((s) => s.updateExperience)
  const removeExperience = useStore((s) => s.removeExperience)
  const onRemove = useCallback(() => removeExperience(item.id), [removeExperience, item.id])

  return (
    <ItemCard onRemove={onRemove}>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input label="公司" value={item.company} onChange={(v) => updateExperience(item.id, { company: v })} placeholder="公司名称" />
          <Input label="职位" value={item.title} onChange={(v) => updateExperience(item.id, { title: v })} placeholder="职位名称" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="开始" value={item.startDate} onChange={(v) => updateExperience(item.id, { startDate: v })} placeholder="2021-03" />
          <Input label="结束" value={item.endDate} onChange={(v) => updateExperience(item.id, { endDate: v })} placeholder="至今" />
        </div>
        <TextArea label="工作内容" value={item.description} onChange={(v) => updateExperience(item.id, { description: v })} placeholder="描述主要职责和成果..." rows={2} />
      </div>
    </ItemCard>
  )
})

const EducationCard = memo(function EducationCard({ item }: {
  item: Education
}) {
  const updateEducation = useStore((s) => s.updateEducation)
  const removeEducation = useStore((s) => s.removeEducation)
  const onRemove = useCallback(() => removeEducation(item.id), [removeEducation, item.id])

  return (
    <ItemCard onRemove={onRemove}>
      <div className="space-y-2">
        <Input label="学校" value={item.school} onChange={(v) => updateEducation(item.id, { school: v })} placeholder="学校名称" />
        <div className="grid grid-cols-2 gap-2">
          <Input label="学历" value={item.degree} onChange={(v) => updateEducation(item.id, { degree: v })} placeholder="本科" />
          <Input label="专业" value={item.major} onChange={(v) => updateEducation(item.id, { major: v })} placeholder="专业名称" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="开始" value={item.startDate} onChange={(v) => updateEducation(item.id, { startDate: v })} placeholder="2014-09" />
          <Input label="结束" value={item.endDate} onChange={(v) => updateEducation(item.id, { endDate: v })} placeholder="2018-06" />
        </div>
      </div>
    </ItemCard>
  )
})

const ProjectCard = memo(function ProjectCard({ item }: {
  item: Project
}) {
  const updateProject = useStore((s) => s.updateProject)
  const removeProject = useStore((s) => s.removeProject)
  const onRemove = useCallback(() => removeProject(item.id), [removeProject, item.id])

  return (
    <ItemCard onRemove={onRemove}>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input label="项目名" value={item.name} onChange={(v) => updateProject(item.id, { name: v })} placeholder="项目名称" />
          <Input label="角色" value={item.role} onChange={(v) => updateProject(item.id, { role: v })} placeholder="技术负责人" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="开始" value={item.startDate} onChange={(v) => updateProject(item.id, { startDate: v })} placeholder="2022-01" />
          <Input label="结束" value={item.endDate} onChange={(v) => updateProject(item.id, { endDate: v })} placeholder="2023-06" />
        </div>
        <TextArea label="项目描述" value={item.description} onChange={(v) => updateProject(item.id, { description: v })} placeholder="描述项目内容和你的贡献..." rows={2} />
      </div>
    </ItemCard>
  )
})

// ─── Drag-to-reorder section order ───

function SectionOrder() {
  const sectionOrder = useStore((s) => s.data.sectionOrder)
  const reorderSections = useStore((s) => s.reorderSections)
  const dragItem = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const handleDragStart = (idx: number) => {
    dragItem.current = idx
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOver(idx)
  }

  const handleDrop = (idx: number) => {
    if (dragItem.current === null || dragItem.current === idx) {
      setDragOver(null)
      return
    }
    const newOrder = [...sectionOrder]
    const [moved] = newOrder.splice(dragItem.current, 1)
    newOrder.splice(idx, 0, moved)
    reorderSections(newOrder)
    dragItem.current = null
    setDragOver(null)
  }

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
      <h3 className="text-[12px] font-semibold text-[var(--text)] mb-2">模块排序</h3>
      <p className="text-[10px] text-[var(--text-3)] mb-2">拖拽或使用箭头调整简历模块顺序</p>
      <div className="space-y-1">
        {sectionOrder.map((id, idx) => (
          <div
            key={id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => setDragOver(null)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded border bg-[var(--surface)] cursor-grab active:cursor-grabbing transition-all
              ${dragOver === idx ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--border-strong)]'}`}
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-[var(--text-3)] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
              <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
              <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
            </svg>
            <span className="text-[12px] font-medium flex-1">{SECTION_LABELS[id]}</span>
            <div className="flex gap-0.5">
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                aria-label={`上移${SECTION_LABELS[id]}`}
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg)] disabled:opacity-30 transition-colors"
              >
                ↑
              </button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === sectionOrder.length - 1}
                aria-label={`下移${SECTION_LABELS[id]}`}
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg)] disabled:opacity-30 transition-colors"
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
  const update = useStore((s) => s.update)

  return (
    <section>
      <h3 className="text-[12px] font-semibold text-[var(--text)] mb-2">基本信息</h3>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input label="姓名" value={name} onChange={(v) => update({ name: v })} placeholder="张三" />
          <Input label="职位" value={title} onChange={(v) => update({ title: v })} placeholder="前端工程师" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="邮箱" value={email} onChange={(v) => update({ email: v })} placeholder="email@example.com" type="email" />
          <Input label="电话" value={phone} onChange={(v) => update({ phone: v })} placeholder="138-0000-0000" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="所在地" value={location} onChange={(v) => update({ location: v })} placeholder="北京" />
          <Input label="网站" value={website} onChange={(v) => update({ website: v })} placeholder="github.com/xxx" />
        </div>
      </div>
    </section>
  )
}

function SummarySection() {
  const summary = useStore((s) => s.data.summary)
  const update = useStore((s) => s.update)

  return (
    <section>
      <TextArea label="个人简介" value={summary} onChange={(v) => update({ summary: v })} placeholder="简要描述你的职业背景和核心优势..." rows={3} />
    </section>
  )
}

function SkillsEditorSection() {
  const skills = useStore((s) => s.data.skills)
  const update = useStore((s) => s.update)

  return (
    <section>
      <TextArea label="技能（逗号分隔）" value={skills} onChange={(v) => update({ skills: v })} placeholder="React, TypeScript, Node.js..." rows={2} />
    </section>
  )
}

function ExperiencesSection() {
  const experiences = useStore((s) => s.data.experiences)
  const addExperience = useStore((s) => s.addExperience)

  return (
    <section>
      <SectionHeader title="工作经历" onAdd={addExperience} />
      {experiences.map((exp) => (
        <ExperienceCard key={exp.id} item={exp} />
      ))}
    </section>
  )
}

function EducationEditorSection() {
  const education = useStore((s) => s.data.education)
  const addEducation = useStore((s) => s.addEducation)

  return (
    <section>
      <SectionHeader title="教育背景" onAdd={addEducation} />
      {education.map((edu) => (
        <EducationCard key={edu.id} item={edu} />
      ))}
    </section>
  )
}

function ProjectsSection() {
  const projects = useStore((s) => s.data.projects)
  const addProject = useStore((s) => s.addProject)

  return (
    <section>
      <SectionHeader title="项目经历" onAdd={addProject} />
      {projects.map((proj) => (
        <ProjectCard key={proj.id} item={proj} />
      ))}
    </section>
  )
}

// ─── Main Editor Panel ───

export default function EditorPanel() {
  return (
    <aside className="w-full md:w-[360px] flex-1 md:flex-none shrink-0 md:border-r border-[var(--border)] bg-[var(--bg)] overflow-y-auto p-4 space-y-5">
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
