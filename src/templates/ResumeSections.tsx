import { useMemo } from 'react'
import { useStore, type EditFocus } from '../store'
import type { ResumeData, SectionId } from '../types'
import { SECTION_LABELS } from '../types'

interface SectionProps {
  data: ResumeData
  headingFamily: string
  bodyFamily: string
}

export function SectionHighlight({ sectionId, itemId, children }: {
  sectionId: SectionId
  itemId?: string
  children: React.ReactNode
}) {
  const editFocus = useStore((s) => s.editFocus)
  const isHighlighted = editFocus?.section === sectionId && (!itemId || editFocus.itemId === itemId)
  return (
    <div className={`transition-all duration-150 rounded ${isHighlighted ? 'ring-2 ring-[#3b82f6]/40 ring-offset-1 ring-offset-white bg-[#eff6ff]/30' : ''}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children, headingFamily, variant = 'line' }: {
  children: React.ReactNode; headingFamily: string; variant?: 'line' | 'plain' | 'bold'
}) {
  if (variant === 'line') {
    return (
      <h2 style={{ fontFamily: headingFamily }} className="text-[10pt] font-bold uppercase tracking-[0.1em] mb-1.5 pb-1.5 border-b border-[#e7e5e4]">
        {children}
      </h2>
    )
  }
  if (variant === 'bold') {
    return (
      <h2 style={{ fontFamily: headingFamily }} className="text-[10pt] font-bold mb-2 pb-1.5 border-b-2 border-[#1c1917]">
        {children}
      </h2>
    )
  }
  return (
    <h2 style={{ fontFamily: headingFamily }} className="text-[8pt] font-semibold uppercase tracking-[0.15em] text-[#a8a29e] mb-1.5">
      {children}
    </h2>
  )
}

export function SummarySection({ data, headingFamily, variant = 'default' }: SectionProps & { variant?: 'default' | 'plain' }) {
  if (!data.summary) return null
  return (
    <SectionHighlight sectionId="summary">
      <section className="mb-2.5">
        {variant !== 'plain' && <SectionTitle headingFamily={headingFamily}>{SECTION_LABELS.summary}</SectionTitle>}
        <p className="text-[8.5pt] text-[#57534e] leading-[1.55]">{data.summary}</p>
      </section>
    </SectionHighlight>
  )
}

export function ExperienceSection({ data, headingFamily, variant = 'line' }: SectionProps & { variant?: 'line' | 'plain' | 'bold' }) {
  if (data.experiences.length === 0) return null
  return (
    <SectionHighlight sectionId="experience">
      <section className="mb-2.5">
        <SectionTitle headingFamily={headingFamily} variant={variant}>{SECTION_LABELS.experience}</SectionTitle>
        {data.experiences.map((exp) => (
          <SectionHighlight key={exp.id} sectionId="experience" itemId={exp.id}>
            <div className="mb-1.5">
              <div className="flex items-baseline justify-between mb-0.5">
                <div className="flex items-baseline gap-2">
                  <span style={{ fontFamily: headingFamily }} className="font-bold text-[9.5pt]">{exp.company}</span>
                  <span className="text-[8.5pt] text-[#57534e]">{exp.title}</span>
                </div>
                <span className="text-[8pt] text-[#a8a29e] shrink-0">{exp.startDate} — {exp.endDate}</span>
              </div>
              {exp.description && (
                <p className="text-[8.5pt] text-[#57534e] leading-[1.5]">{exp.description}</p>
              )}
            </div>
          </SectionHighlight>
        ))}
      </section>
    </SectionHighlight>
  )
}

export function ProjectSection({ data, headingFamily, variant = 'line' }: SectionProps & { variant?: 'line' | 'plain' | 'bold' }) {
  if (data.projects.length === 0) return null
  return (
    <SectionHighlight sectionId="projects">
      <section className="mb-2.5">
        <SectionTitle headingFamily={headingFamily} variant={variant}>{SECTION_LABELS.projects}</SectionTitle>
        {data.projects.map((proj) => (
          <SectionHighlight key={proj.id} sectionId="projects" itemId={proj.id}>
            <div className="mb-1.5">
              <div className="flex items-baseline justify-between mb-0.5">
                <div className="flex items-baseline gap-2">
                  <span style={{ fontFamily: headingFamily }} className="font-bold text-[9.5pt]">{proj.name}</span>
                  <span className="text-[8.5pt] text-[#57534e]">{proj.role}</span>
                </div>
                <span className="text-[8pt] text-[#a8a29e] shrink-0">{proj.startDate} — {proj.endDate}</span>
              </div>
              {proj.description && (
                <p className="text-[8.5pt] text-[#57534e] leading-[1.5]">{proj.description}</p>
              )}
            </div>
          </SectionHighlight>
        ))}
      </section>
    </SectionHighlight>
  )
}

export function EducationSection({ data, headingFamily, variant = 'line' }: SectionProps & { variant?: 'line' | 'plain' | 'bold' }) {
  if (data.education.length === 0) return null
  return (
    <SectionHighlight sectionId="education">
      <section className="mb-2.5">
        <SectionTitle headingFamily={headingFamily} variant={variant}>{SECTION_LABELS.education}</SectionTitle>
        {data.education.map((edu) => (
          <SectionHighlight key={edu.id} sectionId="education" itemId={edu.id}>
            <div className="flex items-baseline justify-between mb-0.5">
              <div className="flex items-baseline gap-2">
                <span style={{ fontFamily: headingFamily }} className="font-bold text-[9.5pt]">{edu.school}</span>
                <span className="text-[8.5pt] text-[#57534e]">{edu.degree} · {edu.major}</span>
              </div>
              <span className="text-[8pt] text-[#a8a29e] shrink-0">{edu.startDate} — {edu.endDate}</span>
            </div>
          </SectionHighlight>
        ))}
      </section>
    </SectionHighlight>
  )
}

export function SkillsSection({ data, headingFamily, variant = 'line', chipBg = true }: SectionProps & { variant?: 'line' | 'plain' | 'bold'; chipBg?: boolean }) {
  const skills = useMemo(() => data.skills.split(',').map((s) => s.trim()).filter(Boolean), [data.skills])
  if (skills.length === 0) return null
  return (
    <SectionHighlight sectionId="skills">
      <section>
        <SectionTitle headingFamily={headingFamily} variant={variant}>{SECTION_LABELS.skills}</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill, i) => (
            <span key={i} className={`inline-flex items-center text-[8.5pt] leading-none text-[#57534e] px-2 py-1 rounded ${chipBg ? 'bg-[#f5f5f4]' : ''}`}>
              {skill}
            </span>
          ))}
        </div>
      </section>
    </SectionHighlight>
  )
}

export function SkillsListSection({ data, headingFamily, variant = 'plain' }: SectionProps & { variant?: 'line' | 'plain' | 'bold' }) {
  const skills = useMemo(() => data.skills.split(',').map((s) => s.trim()).filter(Boolean), [data.skills])
  if (skills.length === 0) return null
  return (
    <SectionHighlight sectionId="skills">
      <section>
        <SectionTitle headingFamily={headingFamily} variant={variant}>{SECTION_LABELS.skills}</SectionTitle>
        <div className="space-y-0.5">
          {skills.map((skill, i) => (
            <p key={i} className="text-[8pt] text-[#57534e] leading-[1.4]">{skill}</p>
          ))}
        </div>
      </section>
    </SectionHighlight>
  )
}

export function EducationCompactSection({ data, headingFamily, variant = 'plain' }: SectionProps & { variant?: 'line' | 'plain' | 'bold' }) {
  if (data.education.length === 0) return null
  return (
    <SectionHighlight sectionId="education">
      <section>
        <SectionTitle headingFamily={headingFamily} variant={variant}>{SECTION_LABELS.education}</SectionTitle>
        {data.education.map((edu) => (
          <SectionHighlight key={edu.id} sectionId="education" itemId={edu.id}>
            <div className="mb-1.5">
              <p style={{ fontFamily: headingFamily }} className="font-semibold text-[8.5pt] leading-tight">{edu.school}</p>
              <p className="text-[7.5pt] text-[#57534e]">{edu.degree} · {edu.major}</p>
              <p className="text-[7pt] text-[#a8a29e]">{edu.startDate} — {edu.endDate}</p>
            </div>
          </SectionHighlight>
        ))}
      </section>
    </SectionHighlight>
  )
}

export function SkillsDarkSection({ data, headingFamily }: SectionProps) {
  const skills = useMemo(() => data.skills.split(',').map((s) => s.trim()).filter(Boolean), [data.skills])
  if (skills.length === 0) return null
  return (
    <SectionHighlight sectionId="skills">
      <section>
        <h2 style={{ fontFamily: headingFamily }} className="text-[7pt] font-semibold uppercase tracking-[0.2em] text-[#a8a29e] mb-1.5">{SECTION_LABELS.skills}</h2>
        <div className="space-y-0.5">
          {skills.map((skill, i) => (
            <p key={i} className="text-[8pt] text-[#d6d3d1] leading-[1.4]">{skill}</p>
          ))}
        </div>
      </section>
    </SectionHighlight>
  )
}

export function EducationDarkSection({ data, headingFamily }: SectionProps) {
  if (data.education.length === 0) return null
  return (
    <SectionHighlight sectionId="education">
      <section>
        <h2 style={{ fontFamily: headingFamily }} className="text-[7pt] font-semibold uppercase tracking-[0.2em] text-[#a8a29e] mb-1.5">{SECTION_LABELS.education}</h2>
        {data.education.map((edu) => (
          <SectionHighlight key={edu.id} sectionId="education" itemId={edu.id}>
            <div className="mb-1.5">
              <p style={{ fontFamily: headingFamily }} className="font-semibold text-[8.5pt] leading-tight text-white">{edu.school}</p>
              <p className="text-[7.5pt] text-[#a8a29e]">{edu.degree} · {edu.major}</p>
              <p className="text-[7pt] text-[#78716c]">{edu.startDate} — {edu.endDate}</p>
            </div>
          </SectionHighlight>
        ))}
      </section>
    </SectionHighlight>
  )
}

export function renderSection(
  id: SectionId,
  props: SectionProps,
  template: 'classic' | 'minimal' | 'modern',
) {
  switch (id) {
    case 'summary':
      return <SummarySection {...props} variant={template === 'minimal' ? 'plain' : 'default'} />
    case 'experience':
      return <ExperienceSection {...props} variant={template === 'minimal' ? 'plain' : template === 'modern' ? 'bold' : 'line'} />
    case 'projects':
      return <ProjectSection {...props} variant={template === 'minimal' ? 'plain' : template === 'modern' ? 'bold' : 'line'} />
    case 'education':
      if (template === 'minimal') return <EducationCompactSection {...props} variant="plain" />
      return <EducationSection {...props} variant={template === 'modern' ? 'bold' : 'line'} />
    case 'skills':
      if (template === 'minimal') return <SkillsListSection {...props} variant="plain" />
      return <SkillsSection {...props} variant={template === 'modern' ? 'bold' : 'line'} chipBg={template !== 'classic'} />
    default:
      return null
  }
}
