// AI 简历内容生成器 — 通过服务端代理调用（商汤日日新，API Key 保存在服务端）
// 服务端：cloud-functions/api/ai/rewrite.js（Prompt 模板在服务端，前端只传结构化数据）

import type { ResumeData, Experience, Project } from '../types'
import { postAI } from './aiClient'

async function callRewrite(
  action: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<string> {
  const data = await postAI<{ text: string }>('/api/ai/rewrite', { action, payload }, signal)
  return data.text
}

// ─── 功能函数 ───

export async function polishExperience(exp: Experience, data: ResumeData, signal?: AbortSignal): Promise<string> {
  return callRewrite(
    'polishExperience',
    {
      candidate: { name: data.name, title: data.title },
      company: exp.company,
      title: exp.title,
      startDate: exp.startDate,
      endDate: exp.endDate,
      description: exp.description,
    },
    signal,
  )
}

export async function generateSummary(data: ResumeData, signal?: AbortSignal): Promise<string> {
  return callRewrite(
    'generateSummary',
    {
      name: data.name,
      title: data.title,
      skills: data.skills,
      experiences: data.experiences.map((e) => ({
        company: e.company,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
      })),
    },
    signal,
  )
}

export async function polishProject(proj: Project, data: ResumeData, signal?: AbortSignal): Promise<string> {
  return callRewrite(
    'polishProject',
    {
      candidate: { name: data.name, title: data.title },
      name: proj.name,
      role: proj.role,
      startDate: proj.startDate,
      endDate: proj.endDate,
      description: proj.description,
    },
    signal,
  )
}

export async function suggestSkills(data: ResumeData, signal?: AbortSignal): Promise<string> {
  return callRewrite(
    'suggestSkills',
    {
      skills: data.skills,
      experiences: data.experiences.map((e) => ({
        company: e.company,
        title: e.title,
        description: e.description,
      })),
    },
    signal,
  )
}

export async function polishCustomSection(
  title: string,
  content: string,
  data: ResumeData,
  signal?: AbortSignal,
): Promise<string> {
  return callRewrite(
    'polishCustomSection',
    {
      candidate: { name: data.name, title: data.title },
      title,
      content,
    },
    signal,
  )
}
