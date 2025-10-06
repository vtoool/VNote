import Fuse from 'fuse.js'
import { Project } from './storage'

export interface SearchResult {
  projectId: string
  canvasId?: string
  cardId?: string
  path: string
  preview: string
}

export function buildSearchIndex(projects: Project[]) {
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
          preview: `${card.content}\n${card.tags.join(', ')}`
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

export function search(projects: Project[], term: string): SearchResult[] {
  if (!term.trim()) return []
  const { fuse } = buildSearchIndex(projects)
  return fuse.search(term).slice(0, 15).map((result) => result.item)
}
