import localforage from 'localforage'
import { createId } from './id'
import { builtInTemplates } from './templates'

export type CardType = 'sticky' | 'checklist' | 'question' | 'media' | 'text'

export interface BaseCard {
  id: string
  type: CardType
  title: string
  content: string
  tags: string[]
  pinned: boolean
  locked: boolean
  color: string
  priority: 'low' | 'medium' | 'high'
  x: number
  y: number
  width: number
  height: number
  createdAt: string
  updatedAt: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface ChecklistCard extends BaseCard {
  type: 'checklist'
  checklist: ChecklistItem[]
}

export interface QuestionVariant {
  id: string
  text: string
  tone: 'warm' | 'direct' | 'curious'
}

export interface QuestionCard extends BaseCard {
  type: 'question'
  answer: string
  variants: QuestionVariant[]
  tags: string[]
}

export interface StickyCard extends BaseCard {
  type: 'sticky'
}

export interface TextCard extends BaseCard {
  type: 'text'
  markdown: boolean
}

export interface MediaCard extends BaseCard {
  type: 'media'
  dataUrl: string | null
  description: string
}

export type Card = StickyCard | ChecklistCard | QuestionCard | MediaCard | TextCard

export interface Frame {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color: string
}

export interface Canvas {
  id: string
  name: string
  description: string
  cards: Card[]
  frames: Frame[]
  createdAt: string
  updatedAt: string
  zoom: number
  position: { x: number; y: number }
}

export interface ScriptQuestion {
  id: string
  label: string
  variants: QuestionVariant[]
  tags: string[]
  timeboxSeconds?: number
  branch?: {
    whenTag: string
    nextSectionId: string
  }
}

export interface ScriptSection {
  id: string
  title: string
  cues: string
  questions: ScriptQuestion[]
}

export interface Script {
  id: string
  title: string
  sections: ScriptSection[]
}

export interface Template {
  id: string
  name: string
  description: string
  script: Script
  personalBullets: string[]
}

export interface VersionEntry {
  id: string
  createdAt: string
  label: string
  project: Project
}

export interface Project {
  id: string
  name: string
  tags: string[]
  canvases: Canvas[]
  personalBullets: string[]
  script: Script
  createdAt: string
  updatedAt: string
  versionHistory: VersionEntry[]
  defaultTemplateId?: string
  accent: 'indigo' | 'violet'
}

export interface StoreState {
  projects: Project[]
  templates: Template[]
  lastSavedAt?: string
}

const STORAGE_KEY = 'vnote-projects'

localforage.config({
  name: 'vnote',
  storeName: 'workspace'
})

export async function loadStore(): Promise<StoreState> {
  const stored = await localforage.getItem<StoreState>(STORAGE_KEY)
  if (stored) {
    return stored
  }

  const seedProject = createProjectFromTemplate(builtInTemplates[0])
  const now = new Date().toISOString()
  seedProject.name = 'Sample Discovery Call'
  seedProject.tags = ['sample', 'b2b']
  seedProject.updatedAt = now

  return {
    projects: [seedProject],
    templates: builtInTemplates,
    lastSavedAt: now
  }
}

export async function saveStore(state: StoreState) {
  await localforage.setItem(STORAGE_KEY, state)
}

export function createEmptyCanvas(name = 'New Canvas'): Canvas {
  const now = new Date().toISOString()
  return {
    id: createId('canvas'),
    name,
    description: '',
    cards: [],
    frames: [],
    createdAt: now,
    updatedAt: now,
    zoom: 1,
    position: { x: 0, y: 0 }
  }
}

export function createProjectFromTemplate(template: Template): Project {
  const now = new Date().toISOString()
  const initialCanvas = createEmptyCanvas('Discovery Notes')
  return {
    id: createId('project'),
    name: template.name,
    tags: [],
    canvases: [initialCanvas],
    personalBullets: [...template.personalBullets],
    script: JSON.parse(JSON.stringify(template.script)),
    createdAt: now,
    updatedAt: now,
    versionHistory: [],
    defaultTemplateId: template.id,
    accent: 'indigo'
  }
}

export function cloneProject(project: Project): Project {
  const now = new Date().toISOString()
  return {
    ...project,
    id: createId('project'),
    name: `${project.name} Copy`,
    canvases: project.canvases.map((canvas) => ({
      ...canvas,
      id: createId('canvas'),
      cards: canvas.cards.map((card) => cloneCard(card)),
      frames: canvas.frames.map((frame) => ({ ...frame, id: createId('frame') }))
    })),
    versionHistory: [],
    createdAt: now,
    updatedAt: now
  }
}

export function cloneCard(card: Card): Card {
  const now = new Date().toISOString()
  switch (card.type) {
    case 'checklist':
      return {
        ...card,
        id: createId('card'),
        createdAt: now,
        updatedAt: now,
        checklist: card.checklist.map((item) => ({ ...item, id: createId('item') }))
      }
    case 'question':
      return {
        ...card,
        id: createId('card'),
        createdAt: now,
        updatedAt: now,
        variants: card.variants.map((variant) => ({ ...variant, id: createId('variant') }))
      }
    default:
      return {
        ...card,
        id: createId('card'),
        createdAt: now,
        updatedAt: now
      }
  }
}

export function recordVersion(project: Project, label: string): Project {
  const snapshot: VersionEntry = {
    id: createId('version'),
    createdAt: new Date().toISOString(),
    label,
    project: JSON.parse(JSON.stringify(project))
  }
  const history = [snapshot, ...project.versionHistory].slice(0, 10)
  return { ...project, versionHistory: history }
}
