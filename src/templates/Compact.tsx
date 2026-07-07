import type { ResumeData } from '../types'
import { resolveFontFamily } from '../types'
import { renderSection, SectionHighlight } from './ResumeSections'

export default function CompactTemplate({ data }: { data: ResumeData }) {
  const headingFont = resolveFontFamily(data.headingFont)
  const bodyFont = resolveFontFamily(data.bodyFont)

  return (
    <div style={{ fontFamily: bodyFont }} className="p-[10mm] text-[9pt] leading-[1.45] text-[#1c1917]">
      {/* Header with photo */}
      <SectionHighlight sectionId="basic">
        <div className="flex items-start gap-4 mb-3 pb-2.5 border-b border-[#1c1917]">
          <div className="flex-1 min-w-0">
            <h1 style={{ fontFamily: headingFont }} className="text-[18pt] font-bold tracking-[0.03em] mb-0.5">{data.name}</h1>
            <p className="text-[9.5pt] text-[#57534e] mb-1.5">{data.title}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[8pt] text-[#57534e]">
              {data.email && (
                <span className="flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 text-[#a8a29e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  {data.email}
                </span>
              )}
              {data.phone && (
                <span className="flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 text-[#a8a29e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {data.phone}
                </span>
              )}
              {data.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 text-[#a8a29e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {data.location}
                </span>
              )}
              {data.website && (
                <span className="flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 text-[#a8a29e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  {data.website}
                </span>
              )}
            </div>
          </div>
          {data.photo && (
            <img
              src={data.photo}
              alt=""
              className="w-[22mm] h-[30mm] object-cover rounded shrink-0 border border-[#e7e5e4]"
            />
          )}
        </div>
      </SectionHighlight>

      {/* Main sections — compact spacing */}
      <div className="space-y-2">
        {data.sectionOrder.map((id) => (
          <div key={id}>{renderSection(id, { data, headingFamily: headingFont, bodyFamily: bodyFont }, 'classic')}</div>
        ))}
      </div>
    </div>
  )
}
