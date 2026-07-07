import type { ResumeData } from '../types'
import { FONT_OPTIONS } from '../types'
import { renderSection } from './ResumeSections'

export default function MinimalTemplate({ data }: { data: ResumeData }) {
  const headingFont = FONT_OPTIONS.find((f) => f.id === data.headingFont)?.family || FONT_OPTIONS[0].family
  const bodyFont = FONT_OPTIONS.find((f) => f.id === data.bodyFont)?.family || FONT_OPTIONS[0].family

  // Minimal uses sidebar for education + skills, main column for the rest
  const sidebarSections = new Set(['education', 'skills'])

  return (
    <div style={{ fontFamily: bodyFont }} className="p-[16mm] text-[9.5pt] leading-[1.5] text-[#1c1917]">
      {/* Header */}
      <div className="mb-4">
        <h1 style={{ fontFamily: headingFont }} className="text-[18pt] font-light tracking-[0.08em] mb-0.5">{data.name}</h1>
        <p className="text-[9pt] text-[#a8a29e] tracking-wide">{data.title}</p>
        <div className="flex items-center gap-2 mt-1.5 text-[8pt] text-[#57534e]">
          {data.email && <span>{data.email}</span>}
          {data.phone && <><span>·</span><span>{data.phone}</span></>}
          {data.location && <><span>·</span><span>{data.location}</span></>}
          {data.website && <><span>·</span><span>{data.website}</span></>}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_160px] gap-6">
        <div className="space-y-3">
          {data.sectionOrder.filter((id) => !sidebarSections.has(id)).map((id) => (
            <div key={id}>{renderSection(id, { data, headingFamily: headingFont, bodyFamily: bodyFont }, 'minimal')}</div>
          ))}
        </div>
        <div className="space-y-3">
          {data.sectionOrder.filter((id) => sidebarSections.has(id)).map((id) => (
            <div key={id}>{renderSection(id, { data, headingFamily: headingFont, bodyFamily: bodyFont }, 'minimal')}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
