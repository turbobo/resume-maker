import type { ResumeData } from '../types'
import { resolveFontFamily, SIDEBAR_SECTIONS } from '../types'
import { renderSection, SectionHighlight } from './ResumeSections'

export default function MinimalTemplate({ data }: { data: ResumeData }) {
  const headingFont = resolveFontFamily(data.headingFont)
  const bodyFont = resolveFontFamily(data.bodyFont)

  return (
    <div style={{ fontFamily: bodyFont }} className="p-[16mm] text-[9.5pt] leading-[1.5] text-[#1c1917]">
      {/* Header */}
      <SectionHighlight sectionId="basic">
        <div className="flex items-start gap-3 mb-4">
          {data.photo && (
            <img
              src={data.photo}
              alt=""
              className="w-[18mm] h-[25mm] rounded object-cover shrink-0 border border-[#e7e5e4]"
            />
          )}
          <div className="min-w-0">
            <h1 style={{ fontFamily: headingFont }} className="text-[18pt] font-light tracking-[0.08em] mb-0.5">{data.name}</h1>
            <p className="text-[9pt] text-[#a8a29e] tracking-wide">{data.title}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[8pt] text-[#57534e]">
              {data.email && <span>{data.email}</span>}
              {data.phone && <><span>·</span><span>{data.phone}</span></>}
              {data.location && <><span>·</span><span>{data.location}</span></>}
              {data.website && <><span>·</span><span>{data.website}</span></>}
            </div>
          </div>
        </div>
      </SectionHighlight>

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_160px] gap-6">
        <div className="space-y-3">
          {data.sectionOrder.filter((id) => !SIDEBAR_SECTIONS.has(id)).map((id) => (
            <div key={id}>{renderSection(id, { data, headingFamily: headingFont, bodyFamily: bodyFont }, 'minimal')}</div>
          ))}
        </div>
        <div className="space-y-3">
          {data.sectionOrder.filter((id) => SIDEBAR_SECTIONS.has(id)).map((id) => (
            <div key={id}>{renderSection(id, { data, headingFamily: headingFont, bodyFamily: bodyFont }, 'minimal')}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
