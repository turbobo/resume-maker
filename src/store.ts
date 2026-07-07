import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResumeData, TemplateId, Experience, Education, Project, CustomSection } from './types'
import { DEFAULT_RESUME, uid } from './types'

export type EditFocus = { section: string; itemId?: string } | null

interface Store {
  data: ResumeData
  template: TemplateId
  editFocus: EditFocus
  setEditFocus: (focus: EditFocus) => void
  setTemplate: (t: TemplateId) => void
  update: (partial: Partial<ResumeData>) => void
  // Sections
  reorderSections: (order: string[]) => void
  setSectionLabel: (id: string, label: string) => void
  removeSection: (id: string) => void
  addSection: (id: string) => void
  addCustomSection: () => void
  updateCustomSection: (id: string, partial: Partial<CustomSection>) => void
  removeCustomSection: (id: string) => void
  setHeadingFont: (fontId: string) => void
  setBodyFont: (fontId: string) => void
  setPhoto: (photo: string) => void
  // Experience
  addExperience: () => void
  updateExperience: (id: string, partial: Partial<Experience>) => void
  removeExperience: (id: string) => void
  // Education
  addEducation: () => void
  updateEducation: (id: string, partial: Partial<Education>) => void
  removeEducation: (id: string) => void
  // Projects
  addProject: () => void
  updateProject: (id: string, partial: Partial<Project>) => void
  removeProject: (id: string) => void
  reorderExperiences: (experiences: Experience[]) => void
  reorderEducation: (education: Education[]) => void
  reorderProjects: (projects: Project[]) => void
  // Import
  importData: (data: Partial<ResumeData>) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
  data: DEFAULT_RESUME,
  template: 'classic',
  editFocus: null,
  setEditFocus: (focus) => set({ editFocus: focus }),
  setTemplate: (t) => set({ template: t }),

  update: (partial) => set((s) => ({ data: { ...s.data, ...partial } })),

  reorderSections: (order) =>
    set((s) => ({ data: { ...s.data, sectionOrder: order } })),

  setSectionLabel: (id, label) =>
    set((s) => ({ data: { ...s.data, sectionLabels: { ...s.data.sectionLabels, [id]: label } } })),

  removeSection: (id) =>
    set((s) => ({ data: { ...s.data, sectionOrder: s.data.sectionOrder.filter((sid) => sid !== id) } })),

  addSection: (id) =>
    set((s) => ({
      data: { ...s.data, sectionOrder: s.data.sectionOrder.includes(id) ? s.data.sectionOrder : [...s.data.sectionOrder, id] },
    })),

  addCustomSection: () =>
    set((s) => {
      const id = `custom-${uid()}`
      return {
        data: {
          ...s.data,
          customSections: [...s.data.customSections, { id, title: '自定义模块', content: '' }],
          sectionOrder: [...s.data.sectionOrder, id],
        },
      }
    }),

  updateCustomSection: (id, partial) =>
    set((s) => ({
      data: {
        ...s.data,
        customSections: s.data.customSections.map((c) => (c.id === id ? { ...c, ...partial } : c)),
      },
    })),

  removeCustomSection: (id) =>
    set((s) => ({
      data: {
        ...s.data,
        customSections: s.data.customSections.filter((c) => c.id !== id),
        sectionOrder: s.data.sectionOrder.filter((sid) => sid !== id),
      },
    })),

  setHeadingFont: (fontId) =>
    set((s) => ({ data: { ...s.data, headingFont: fontId } })),

  setBodyFont: (fontId) =>
    set((s) => ({ data: { ...s.data, bodyFont: fontId } })),

  setPhoto: (photo) =>
    set((s) => ({ data: { ...s.data, photo } })),

  addExperience: () =>
    set((s) => ({
      data: {
        ...s.data,
        experiences: [...s.data.experiences, { id: uid(), company: '', title: '', startDate: '', endDate: '', description: '' }],
      },
    })),
  updateExperience: (id, partial) =>
    set((s) => ({
      data: {
        ...s.data,
        experiences: s.data.experiences.map((e) => (e.id === id ? { ...e, ...partial } : e)),
      },
    })),
  removeExperience: (id) =>
    set((s) => ({
      data: { ...s.data, experiences: s.data.experiences.filter((e) => e.id !== id) },
    })),

  addEducation: () =>
    set((s) => ({
      data: {
        ...s.data,
        education: [...s.data.education, { id: uid(), school: '', degree: '', major: '', startDate: '', endDate: '', description: '' }],
      },
    })),
  updateEducation: (id, partial) =>
    set((s) => ({
      data: {
        ...s.data,
        education: s.data.education.map((e) => (e.id === id ? { ...e, ...partial } : e)),
      },
    })),
  removeEducation: (id) =>
    set((s) => ({
      data: { ...s.data, education: s.data.education.filter((e) => e.id !== id) },
    })),

  addProject: () =>
    set((s) => ({
      data: {
        ...s.data,
        projects: [...s.data.projects, { id: uid(), name: '', role: '', startDate: '', endDate: '', description: '' }],
      },
    })),
  updateProject: (id, partial) =>
    set((s) => ({
      data: {
        ...s.data,
        projects: s.data.projects.map((p) => (p.id === id ? { ...p, ...partial } : p)),
      },
    })),
  removeProject: (id) =>
    set((s) => ({
      data: { ...s.data, projects: s.data.projects.filter((p) => p.id !== id) },
    })),

  reorderExperiences: (experiences) =>
    set((s) => ({ data: { ...s.data, experiences } })),
  reorderEducation: (education) =>
    set((s) => ({ data: { ...s.data, education } })),
  reorderProjects: (projects) =>
    set((s) => ({ data: { ...s.data, projects } })),

  importData: (incoming) =>
    set((s) => ({ data: { ...s.data, ...incoming } })),
    }),
    { name: 'resume-maker-storage', partialize: (s) => ({ data: s.data, template: s.template }) },
  ),
)
