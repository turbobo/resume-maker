import type { ResumeData } from '../types'
import { resolveFontFamily } from '../types'
import { renderSection } from './ResumeSections'

export default function ClassicTemplate({ data }: { data: ResumeData }) {
  const headingFont = resolveFontFamily(data.headingFont)
  const bodyFont = resolveFontFamily(data.bodyFont)

  return (
    <div style={{ fontFamily: bodyFont }} className="p-[14mm] text-[9.5pt] leading-[1.5] text-[#1c1917]">
      {/* Header */}
      <div className="text-center mb-3 pb-2 border-b-2 border-[#1c1917]">
        <h1 style={{ fontFamily: headingFont }} className="text-[20pt] font-bold tracking-[0.05em] mb-0.5">{data.name}</h1>
        <p className="text-[10pt] text-[#57534e] mb-1">{data.title}</p>
        <div className="flex items-center justify-center gap-3 text-[8.5pt] text-[#57534e]">
          {data.email && <span>{data.email}</span>}
          {data.phone && <><span className="text-[#d6d3d1]">|</span><span>{data.phone}</span></>}
          {data.location && <><span className="text-[#d6d3d1]">|</span><span>{data.location}</span></>}
          {data.website && <><span className="text-[#d6d3d1]">|</span><span>{data.website}</span></>}
        </div>
      </div>

      {/* Sections in order */}
      {data.sectionOrder.map((id) => (
        <div key={id}>{renderSection(id, { data, headingFamily: headingFont, bodyFamily: bodyFont }, 'classic')}</div>
      ))}
    </div>
  )
}
