import { useCallback, useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import {
  Project,
  StoreState,
  loadStore,
  saveStore,
  createProjectFromTemplate,
  createEmptyCanvas,
  cloneProject,
  recordVersion,
  Card,
  Canvas,
  Template
} from '../lib/storage'
import { builtInTemplates } from '../lib/templates'

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
}

interface LocalStore extends StoreState, StoreActions {
  ready: boolean
  dirty: boolean
}

const useZustandStore = create<LocalStore>()((set, get) => ({
    projects: [],
    templates: builtInTemplates,
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
                    cards: [card, ...canvas.cards],
                    updatedAt: new Date().toISOString()
                  }
                : canvas
            ),
            updatedAt: new Date().toISOString()
          }
        }),
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
      await saveStore({ projects: snapshotProjects, templates: store.templates, lastSavedAt: new Date().toISOString() })
      setSavingState('saved')
      useZustandStore.setState({ dirty: false, lastSavedAt: new Date().toISOString() })
    }, 2000)
  }, [store.projects, store.templates, store.ready, store.dirty])

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
