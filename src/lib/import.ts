import { Project, createEmptyCanvas, cloneCard } from './storage'
import { createId } from './id'

export interface ImportPreview<T> {
  incoming: T
  notes: string[]
}

export function parseProjectJson(input: string): ImportPreview<Project> {
  const raw = JSON.parse(input)
  raw.id = createId('project')
  raw.canvases = raw.canvases?.map((canvas: any) => ({
    ...canvas,
    id: createId('canvas'),
    cards: canvas.cards?.map((card: any) => ({ ...cloneCard(card), x: card.x, y: card.y })) ?? [],
    frames: canvas.frames?.map((frame: any) => ({ ...frame, id: createId('frame') })) ?? []
  })) ?? [createEmptyCanvas()]
  raw.versionHistory = []
  raw.createdAt = new Date().toISOString()
  raw.updatedAt = raw.createdAt
  return { incoming: raw, notes: ['IDs regenerated for safety'] }
}

