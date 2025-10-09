import { useCallback, useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import {
  Project,
  StoreState,
  UserSettings,
  loadStore,
  saveStore,
  createProjectFromTemplate,
  createEmptyCanvas,
  cloneProject,
  recordVersion,
  Card,
  Canvas,
  Template,
  Script,
  ScriptSection,
  ScriptQuestion,
  QuestionVariant
} from '../lib/storage'
import { builtInTemplates } from '../lib/templates'
import { createId } from '../lib/id'
import { findNextGridPosition, snapPointToGrid } from '../lib/canvasLayout'

interface StoreActions {
  hydrate: () => Promise<void>
  setProjects: (projects: Project[]) => void
  updateProject: (projectId: string, updater: (project: Project) => Project) => void
  addProject: (template?: Template) => Project | undefined
  deleteProject: (projectId: string) => void
  duplicateProject: (projectId: string) => Project | undefined
  addCanvas: (projectId: string, canvas?: Partial<Canvas>) => Canvas | undefined
  updateCanvas: (projectId: string, canvasId: string, updater: (canvas: Canvas) => Canvas) => void
  addCard: (projectId: string, canvasId: string, card: Card) => void
  createTemplate: (template: Omit<Template, 'id' | 'builtIn'>) => Template
  updateTemplate: (templateId: string, updates: Partial<Omit<Template, 'id'>>) => void
  duplicateTemplate: (templateId: string) => Template | undefined
  deleteTemplate: (templateId: string) => void
  updateSettings: (updates: Partial<UserSettings>) => void
}

interface LocalStore extends StoreState, StoreActions {
  ready: boolean
  dirty: boolean
}

function cloneVariant(variant: QuestionVariant): QuestionVariant {
  return { ...variant, id: createId('variant') }
}

function cloneQuestion(question: ScriptQuestion): ScriptQuestion {
  return {
    ...question,
    id: createId('question'),
    variants: question.variants.map((variant) => cloneVariant(variant)),
    inputs: question.inputs?.map((input) => ({ ...input, id: input.id ?? createId('input') }))
  }
}

function cloneSection(section: ScriptSection): ScriptSection {
  return {
    ...section,
    id: createId('section'),
    questions: section.questions.map((question) => cloneQuestion(question))
  }
}

function cloneScript(script: Script): Script {
  return {
    ...script,
    id: createId('script'),
    sections: script.sections.map((section) => cloneSection(section))
  }
}

const useZustandStore = create<LocalStore>()((set, get) => ({
    projects: [],
    templates: builtInTemplates,
    settings: { agentName: 'Alex' },
    ready: false,
    dirty: false,
    lastSavedAt: undefined,
    hydrate: async () => {
      const initial = await loadStore()
      set({ ...initial, ready: true, dirty: false })
    },
    setProjects: (projects) => set({ projects, dirty: true }),
    updateProject: (projectId, updater) => {
      const projects = get().projects.map((project) => (project.id === projectId ? updater(project) : project))
      set({ projects, dirty: true })
    },
    addProject: (template) => {
      const newProject = createProjectFromTemplate(template ?? builtInTemplates[0])
      set({ projects: [newProject, ...get().projects], dirty: true })
      return newProject
    },
    deleteProject: (projectId) => {
      set({ projects: get().projects.filter((project) => project.id !== projectId), dirty: true })
    },
    duplicateProject: (projectId) => {
      const target = get().projects.find((project) => project.id === projectId)
      if (!target) return undefined
      const cloned = cloneProject(target)
      set({ projects: [cloned, ...get().projects], dirty: true })
      return cloned
    },
    addCanvas: (projectId, canvas) => {
      let created: Canvas | undefined
      set({
        projects: get().projects.map((project) => {
          if (project.id !== projectId) return project
          created = { ...createEmptyCanvas(canvas?.name ?? 'Canvas'), ...canvas }
          return { ...project, canvases: [created, ...project.canvases], updatedAt: new Date().toISOString() }
        }),
        dirty: true
      })
      return created
    },
    updateCanvas: (projectId, canvasId, updater) => {
      set({
        projects: get().projects.map((project) => {
          if (project.id !== projectId) return project
          return {
            ...project,
            canvases: project.canvases.map((canvas) => (canvas.id === canvasId ? updater(canvas) : canvas)),
            updatedAt: new Date().toISOString()
          }
        }),
        dirty: true
      })
    },
    addCard: (projectId, canvasId, card) => {
      set({
        projects: get().projects.map((project) => {
          if (project.id !== projectId) return project
          return {
            ...project,
            canvases: project.canvases.map((canvas) =>
              canvas.id === canvasId
                ? {
                    ...canvas,
                    cards: [
                      {
                        ...card,
                        ...(() => {
                          const fallbackPosition = findNextGridPosition(canvas.cards)
                          const hasPosition = Number.isFinite(card.x) && Number.isFinite(card.y)
                          if (!hasPosition) {
                            return fallbackPosition
                          }

                          const provided = snapPointToGrid({ x: card.x, y: card.y })
                          const occupied = canvas.cards.some((existing) => {
                            const snappedExisting = snapPointToGrid({ x: existing.x, y: existing.y })
                            return snappedExisting.x === provided.x && snappedExisting.y === provided.y
                          })
                          return occupied ? fallbackPosition : provided
                        })()
                      },
                      ...canvas.cards
                    ],
                    updatedAt: new Date().toISOString()
                  }
                : canvas
            ),
            updatedAt: new Date().toISOString()
          }
        }),
        dirty: true
      })
    },
    createTemplate: (template) => {
      const normalized: Template = {
        ...template,
        id: createId('template'),
        builtIn: false,
        personalBullets: [...(template.personalBullets ?? [])],
        script: JSON.parse(JSON.stringify(template.script)) as Script,
        defaultCards: template.defaultCards?.map((card) => ({ ...card }))
      }
      set({ templates: [...get().templates, normalized], dirty: true })
      return normalized
    },
    updateTemplate: (templateId, updates) => {
      set({
        templates: get().templates.map((template) =>
          template.id === templateId
            ? {
                ...template,
                ...updates,
                script: updates.script
                  ? (JSON.parse(JSON.stringify(updates.script)) as Script)
                  : template.script,
                defaultCards: updates.defaultCards
                  ? updates.defaultCards.map((card) => ({ ...card }))
                  : template.defaultCards,
                builtIn: template.builtIn
              }
            : template
        ),
        dirty: true
      })
    },
    duplicateTemplate: (templateId) => {
      const target = get().templates.find((template) => template.id === templateId)
      if (!target) return undefined
      const duplicated: Template = {
        ...target,
        id: createId('template'),
        name: `${target.name} Copy`,
        builtIn: false,
        script: cloneScript(target.script),
        defaultCards: target.defaultCards?.map((card) => ({ ...card }))
      }
      set({ templates: [...get().templates, duplicated], dirty: true })
      return duplicated
    },
    deleteTemplate: (templateId) => {
      set({
        templates: get().templates.filter((template) => template.id !== templateId || template.builtIn),
        dirty: true
      })
    },
    updateSettings: (updates) => {
      set({
        settings: { ...get().settings, ...updates },
        dirty: true
      })
    }
  })
)

export function useLocalStore() {
  const store = useZustandStore()
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timeout = useRef<number>()

  useEffect(() => {
    if (!store.ready) {
      store.hydrate()
    }
  }, [store])

  useEffect(() => {
    if (!store.ready || !store.dirty) return
    if (timeout.current) window.clearTimeout(timeout.current)
    setSavingState('saving')
    timeout.current = window.setTimeout(async () => {
      const snapshotProjects = store.projects.map((project) => ({
        ...project,
        versionHistory: project.versionHistory.slice(0, 10)
      }))
      await saveStore({
        projects: snapshotProjects,
        templates: store.templates,
        settings: store.settings,
        lastSavedAt: new Date().toISOString()
      })
      setSavingState('saved')
      useZustandStore.setState({ dirty: false, lastSavedAt: new Date().toISOString() })
    }, 2000)
  }, [store.projects, store.templates, store.settings, store.ready, store.dirty])

  const saveSnapshot = useCallback(
    (projectId: string, label: string) => {
      store.updateProject(projectId, (project) => {
        const updated = recordVersion({ ...project, updatedAt: new Date().toISOString() }, label)
        return updated
      })
    },
    [store]
  )

  return { ...store, savingState, saveSnapshot }
}
