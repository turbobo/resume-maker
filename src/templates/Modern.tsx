import type { ResumeData } from '../types'
import { resolveFontFamily, SIDEBAR_SECTIONS } from '../types'
import { renderSection, SkillsDarkSection, EducationDarkSection, SectionHighlight } from './ResumeSections'

export default function ModernTemplate({ data }: { data: ResumeData }) {
  const headingFont = resolveFontFamily(data.headingFont)
  const bodyFont = resolveFontFamily(data.bodyFont)

  return (
    <div style={{ fontFamily: bodyFont }} className="flex text-[9.5pt] leading-[1.5] text-[#1c1917]">
      {/* Left sidebar */}
      <div className="w-[62mm] shrink-0 bg-[#1c1917] text-white p-[12mm] space-y-4">
        <SectionHighlight sectionId="basic">
          <div>
            <h1 style={{ fontFamily: headingFont }} className="text-[16pt] font-bold leading-tight mb-0.5">{data.name}</h1>
            <p className="text-[8.5pt] text-[#a8a29e] tracking-wide">{data.title}</p>
          </div>
        </SectionHighlight>

        {/* Contact */}
        <SectionHighlight sectionId="basic">
          <div className="space-y-1">
            <h2 style={{ fontFamily: headingFont }} className="text-[7pt] font-semibold uppercase tracking-[0.2em] text-[#a8a29e] mb-1.5">联系方式</h2>
            {data.email && <p className="text-[8pt] text-[#d6d3d1] break-all">{data.email}</p>}
            {data.phone && <p className="text-[8pt] text-[#d6d3d1]">{data.phone}</p>}
            {data.location && <p className="text-[8pt] text-[#d6d3d1]">{data.location}</p>}
            {data.website && <p className="text-[8pt] text-[#d6d3d1] break-all">{data.website}</p>}
          </div>
        </SectionHighlight>

        {/* Sidebar sections in order */}
        {data.sectionOrder.filter((id) => SIDEBAR_SECTIONS.has(id)).map((id) => (
          <div key={id}>
            {id === 'skills' && <SkillsDarkSection data={data} headingFamily={headingFont} bodyFamily={bodyFont} />}
            {id === 'education' && <EducationDarkSection data={data} headingFamily={headingFont} bodyFamily={bodyFont} />}
          </div>
        ))}
      </div>

      {/* Right content */}
      <div className="flex-1 p-[12mm] space-y-3">
        <SectionHighlight sectionId="summary">
          {data.summary && (
            <p className="text-[9pt] text-[#57534e] leading-[1.6]">{data.summary}</p>
          )}
        </SectionHighlight>
        {data.sectionOrder.filter((id) => !SIDEBAR_SECTIONS.has(id) && id !== 'summary').map((id) => (
          <div key={id}>{renderSection(id, { data, headingFamily: headingFont, bodyFamily: bodyFont }, 'modern')}</div>
        ))}
      </div>
    </div>
  )
}
