export interface Experience {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  description: string
}

export interface Education {
  id: string
  school: string
  degree: string
  major: string
  startDate: string
  endDate: string
  description: string
}

export interface Project {
  id: string
  name: string
  role: string
  startDate: string
  endDate: string
  description: string
}

export type SectionId = 'summary' | 'experience' | 'projects' | 'education' | 'skills'

export const SECTION_LABELS: Record<SectionId, string> = {
  summary: '个人简介',
  experience: '工作经历',
  projects: '项目经历',
  education: '教育背景',
  skills: '技能',
}

export const DEFAULT_ORDER: SectionId[] = ['summary', 'experience', 'projects', 'education', 'skills']

export interface FontOption {
  id: string
  label: string
  family: string
  import?: string  // Google Fonts import URL
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'noto-sans', label: '思源黑体', family: '"Noto Sans SC", "PingFang SC", sans-serif', import: 'Noto+Sans+SC:wght@300;400;500;700' },
  { id: 'noto-serif', label: '思源宋体', family: '"Noto Serif SC", "Songti SC", serif', import: 'Noto+Serif+SC:wght@400;500;700' },
  { id: 'inter', label: 'Inter', family: '"Inter", -apple-system, sans-serif', import: 'Inter:wght@300;400;500;600;700' },
  { id: 'lxgw', label: '霞鹜文楷', family: '"LXGW WenKai Mono TC", "STKaiti", cursive', import: 'LXGW+WenKai+Mono+TC:wght@300;400;700' },
]

export interface ResumeData {
  name: string
  title: string
  email: string
  phone: string
  location: string
  website: string
  summary: string
  skills: string
  experiences: Experience[]
  education: Education[]
  projects: Project[]
  sectionOrder: SectionId[]
  headingFont: string
  bodyFont: string
}

export type TemplateId = 'classic' | 'minimal' | 'modern'

export const DEFAULT_RESUME: ResumeData = {
  name: '张三',
  title: '高级前端工程师',
  email: 'zhangsan@email.com',
  phone: '138-0000-0000',
  location: '北京',
  website: '',
  summary: '8 年前端开发经验，擅长 React 生态和大型项目架构设计。主导过多个千万级用户产品的前端重构，对性能优化和工程化有深入实践。',
  skills: 'React, TypeScript, Next.js, Node.js, Tailwind CSS, Webpack, Vite, 性能优化, 微前端',
  experiences: [
    {
      id: '1',
      company: '某科技公司',
      title: '高级前端工程师',
      startDate: '2021-03',
      endDate: '至今',
      description: '主导核心业务系统前端架构升级，从 jQuery 迁移到 React + TypeScript，页面加载速度提升 60%。搭建组件库和脚手架，团队开发效率提升 40%。',
    },
    {
      id: '2',
      company: '某互联网公司',
      title: '前端工程师',
      startDate: '2018-06',
      endDate: '2021-02',
      description: '负责电商平台前端开发，完成商品详情页、购物车、支付流程等核心模块。推动前端自动化测试覆盖率从 20% 提升到 75%。',
    },
  ],
  education: [
    {
      id: '1',
      school: '北京大学',
      degree: '本科',
      major: '计算机科学与技术',
      startDate: '2014-09',
      endDate: '2018-06',
      description: '',
    },
  ],
  projects: [
    {
      id: '1',
      name: '企业级设计系统',
      role: '技术负责人',
      startDate: '2022-01',
      endDate: '2023-06',
      description: '从零搭建公司统一设计系统，包含 60+ 组件，支持主题定制和无障碍访问，服务 12 个业务线。',
    },
  ],
  sectionOrder: [...DEFAULT_ORDER],
  headingFont: 'noto-sans',
  bodyFont: 'noto-sans',
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export function resolveFontFamily(fontId: string): string {
  return FONT_OPTIONS.find((f) => f.id === fontId)?.family || FONT_OPTIONS[0].family
}

export const SIDEBAR_SECTIONS = new Set<SectionId>(['education', 'skills'])
