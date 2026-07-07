import { useMemo } from 'react'
import type { ResumeData } from '../types'
import { resolveFontFamily, SIDEBAR_SECTIONS, getSectionLabel } from '../types'
import { renderSection, SectionHighlight } from './ResumeSections'

export default function ModernTemplate({ data }: { data: ResumeData }) {
  const headingFont = resolveFontFamily(data.headingFont)
  const bodyFont = resolveFontFamily(data.bodyFont)
  const skills = useMemo(() => data.skills.split(',').map((s) => s.trim()).filter(Boolean), [data.skills])

  return (
    <div style={{ fontFamily: bodyFont }} className="flex text-[9.5pt] leading-[1.5] text-[#1c1917] min-h-[297mm]">
      {/* Left sidebar */}
      <div className="w-[62mm] shrink-0 bg-[#f5f5f4] p-[12mm] space-y-4 border-r border-[#e7e5e4]">
        <SectionHighlight sectionId="basic">
          <div>
            {data.photo && (
              <img
                src={data.photo}
                alt=""
                className="w-[22mm] h-[30mm] rounded object-cover mb-3 border border-[#e7e5e4]"
              />
            )}
            <h1 style={{ fontFamily: headingFont }} className="text-[16pt] font-bold leading-tight mb-0.5">{data.name}</h1>
            <p className="text-[8.5pt] text-[#78716c] tracking-wide">{data.title}</p>
          </div>
        </SectionHighlight>

        {/* Contact */}
        <SectionHighlight sectionId="basic">
          <div className="space-y-1">
            <h2 style={{ fontFamily: headingFont }} className="text-[7pt] font-semibold uppercase tracking-[0.2em] text-[#a8a29e] mb-1.5 pb-1 border-b border-[#d6d3d1]">联系方式</h2>
            {data.email && <p className="text-[8pt] text-[#57534e] break-all">{data.email}</p>}
            {data.phone && <p className="text-[8pt] text-[#57534e]">{data.phone}</p>}
            {data.location && <p className="text-[8pt] text-[#57534e]">{data.location}</p>}
            {data.website && <p className="text-[8pt] text-[#57534e] break-all">{data.website}</p>}
          </div>
        </SectionHighlight>

        {/* Skills */}
        {skills.length > 0 && (
          <SectionHighlight sectionId="skills">
            <div>
              <h2 style={{ fontFamily: headingFont }} className="text-[7pt] font-semibold uppercase tracking-[0.2em] text-[#a8a29e] mb-1.5 pb-1 border-b border-[#d6d3d1]">{getSectionLabel('skills', data)}</h2>
              <div className="flex flex-wrap gap-1">
                {skills.map((skill, i) => (
                  <span key={i} className="text-[7.5pt] text-[#57534e] bg-white px-1.5 py-0.5 rounded border border-[#e7e5e4]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </SectionHighlight>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <SectionHighlight sectionId="education">
            <div>
              <h2 style={{ fontFamily: headingFont }} className="text-[7pt] font-semibold uppercase tracking-[0.2em] text-[#a8a29e] mb-1.5 pb-1 border-b border-[#d6d3d1]">{getSectionLabel('education', data)}</h2>
              {data.education.map((edu) => (
                <SectionHighlight key={edu.id} sectionId="education" itemId={edu.id}>
                  <div className="mb-1.5">
                    <p style={{ fontFamily: headingFont }} className="font-bold text-[8.5pt] leading-tight">{edu.school}</p>
                    <p className="text-[7.5pt] text-[#57534e]">{edu.degree} · {edu.major}</p>
                    <p className="text-[7pt] text-[#a8a29e]">{edu.startDate} — {edu.endDate}</p>
                  </div>
                </SectionHighlight>
              ))}
            </div>
          </SectionHighlight>
        )}
      </div>

      {/* Right content */}
      <div className="flex-1 p-[12mm] space-y-3">
        <SectionHighlight sectionId="summary">
          {data.summary && (
            <p className="text-[9pt] text-[#57534e] leading-[1.6] whitespace-pre-line">{data.summary}</p>
          )}
        </SectionHighlight>
        {data.sectionOrder.filter((id) => !SIDEBAR_SECTIONS.has(id) && id !== 'summary').map((id) => (
          <div key={id}>{renderSection(id, { data, headingFamily: headingFont, bodyFamily: bodyFont }, 'modern')}</div>
        ))}
      </div>
    </div>
  )
}
