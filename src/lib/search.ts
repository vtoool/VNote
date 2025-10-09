import Fuse from 'fuse.js'
import { Project } from './storage'
import { personalizeAgentText } from './personalization'

export interface SearchResult {
  projectId: string
  canvasId?: string
  cardId?: string
  path: string
  preview: string
}

export function buildSearchIndex(projects: Project[], agentName: string) {
  const entries: SearchResult[] = []
  projects.forEach((project) => {
    entries.push({ projectId: project.id, path: `Project • ${project.name}`, preview: project.tags.join(', ') })
    project.canvases.forEach((canvas) => {
      entries.push({ projectId: project.id, canvasId: canvas.id, path: `${project.name} › ${canvas.name}`, preview: canvas.description })
      canvas.cards.forEach((card) => {
        entries.push({
          projectId: project.id,
          canvasId: canvas.id,
          cardId: card.id,
          path: `${project.name} › ${canvas.name} › ${card.title || card.type}`,
          preview: `${personalizeAgentText(card.content ?? '', agentName)}\n${card.tags.join(', ')}`
        })
      })
    })
  })
  const fuse = new Fuse(entries, {
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    keys: ['path', 'preview']
  })
  return { fuse, entries }
}

export function search(projects: Project[], term: string, agentName: string): SearchResult[] {
  if (!term.trim()) return []
  const { fuse } = buildSearchIndex(projects, agentName)
  return fuse.search(term).slice(0, 15).map((result) => result.item)
}
