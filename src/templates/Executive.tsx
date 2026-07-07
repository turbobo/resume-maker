import { useMemo } from 'react'
import type { ResumeData } from '../types'
import { resolveFontFamily, SIDEBAR_SECTIONS, getSectionLabel } from '../types'
import { renderSection, SectionHighlight } from './ResumeSections'

export default function ExecutiveTemplate({ data }: { data: ResumeData }) {
  const headingFont = resolveFontFamily(data.headingFont)
  const bodyFont = resolveFontFamily(data.bodyFont)
  const skills = useMemo(() => data.skills.split(',').map((s) => s.trim()).filter(Boolean), [data.skills])

  return (
    <div style={{ fontFamily: bodyFont }} className="flex text-[9pt] leading-[1.45] text-[#1c1917] min-h-[297mm]">
      {/* Left sidebar — warm neutral */}
      <div className="w-[60mm] shrink-0 bg-[#f5f5f4] p-[10mm] space-y-3.5 border-r border-[#e7e5e4]">
        {/* Photo + Name */}
        <SectionHighlight sectionId="basic">
          <div className="text-center">
            {data.photo && (
              <img
                src={data.photo}
                alt=""
                className="w-[24mm] h-[33mm] rounded object-cover mx-auto mb-2 border-2 border-white shadow-sm"
              />
            )}
            <h1 style={{ fontFamily: headingFont }} className="text-[14pt] font-bold leading-tight">{data.name}</h1>
            <p className="text-[8.5pt] text-[#78716c] mt-0.5">{data.title}</p>
          </div>
        </SectionHighlight>

        {/* Contact */}
        <SectionHighlight sectionId="basic">
          <div>
            <h2 style={{ fontFamily: headingFont }} className="text-[7.5pt] font-bold uppercase tracking-[0.15em] text-[#a8a29e] mb-1.5 pb-1 border-b border-[#d6d3d1]">联系方式</h2>
            <div className="space-y-1 text-[8pt] text-[#57534e]">
              {data.email && (
                <div className="flex items-start gap-1.5">
                  <svg className="w-2.5 h-2.5 mt-0.5 text-[#a8a29e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <span className="break-all">{data.email}</span>
                </div>
              )}
              {data.phone && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-2.5 h-2.5 text-[#a8a29e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>{data.phone}</span>
                </div>
              )}
              {data.location && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-2.5 h-2.5 text-[#a8a29e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>{data.location}</span>
                </div>
              )}
              {data.website && (
                <div className="flex items-start gap-1.5">
                  <svg className="w-2.5 h-2.5 mt-0.5 text-[#a8a29e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <span className="break-all">{data.website}</span>
                </div>
              )}
            </div>
          </div>
        </SectionHighlight>

        {/* Skills */}
        {skills.length > 0 && (
          <SectionHighlight sectionId="skills">
            <div>
              <h2 style={{ fontFamily: headingFont }} className="text-[7.5pt] font-bold uppercase tracking-[0.15em] text-[#a8a29e] mb-1.5 pb-1 border-b border-[#d6d3d1]">{getSectionLabel('skills', data)}</h2>
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
              <h2 style={{ fontFamily: headingFont }} className="text-[7.5pt] font-bold uppercase tracking-[0.15em] text-[#a8a29e] mb-1.5 pb-1 border-b border-[#d6d3d1]">{getSectionLabel('education', data)}</h2>
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
      <div className="flex-1 p-[10mm] space-y-2.5">
        {/* Summary */}
        <SectionHighlight sectionId="summary">
          {data.summary && (
            <div className="mb-2.5">
              <h2 style={{ fontFamily: headingFont }} className="text-[9.5pt] font-bold mb-1 pb-1 border-b border-[#e7e5e4]">{getSectionLabel('summary', data)}</h2>
              <p className="text-[8.5pt] text-[#57534e] leading-[1.5] whitespace-pre-line">{data.summary}</p>
            </div>
          )}
        </SectionHighlight>

        {/* Main sections (exclude sidebar ones) */}
        {data.sectionOrder
          .filter((id) => !SIDEBAR_SECTIONS.has(id) && id !== 'summary')
          .map((id) => (
            <div key={id}>{renderSection(id, { data, headingFamily: headingFont, bodyFamily: bodyFont }, 'classic')}</div>
          ))}
      </div>
    </div>
  )
}
