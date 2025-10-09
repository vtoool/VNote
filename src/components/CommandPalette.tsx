import { useContext, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { StoreContext } from '../App'
import { strings } from '../lib/i18n'
import { createId } from '../lib/id'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const store = useContext(StoreContext)!
  const navigate = useNavigate()
  const params = useParams()
  const [query, setQuery] = useState('')

  const actions = useMemo(() => {
    const projectId = params.projectId || store.projects[0]?.id
    const canvasId = params.canvasId || store.projects[0]?.canvases[0]?.id
    return [
      {
        label: strings.commandNewSticky,
        run: () => {
          if (!projectId || !canvasId) return
          store.addCard(projectId, canvasId, {
            id: createId('card'),
            type: 'sticky',
            title: 'New idea',
            content: '',
            tags: [],
            pinned: false,
            locked: false,
            color: '#fef08a',
            priority: 'medium',
            x: 0,
            y: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          navigate(`/workspace/project/${projectId}/canvas/${canvasId}`)
        }
      },
      {
        label: strings.commandNewChecklist,
        run: () => {
          if (!projectId || !canvasId) return
          store.addCard(projectId, canvasId, {
            id: createId('card'),
            type: 'checklist',
            title: 'Checklist',
            content: '',
            tags: [],
            pinned: false,
            locked: false,
            color: '#bae6fd',
            priority: 'medium',
            x: 0,
            y: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            checklist: []
          })
          navigate(`/workspace/project/${projectId}/canvas/${canvasId}`)
        }
      },
      {
        label: strings.commandNewQuestion,
        run: () => {
          if (!projectId || !canvasId) return
          store.addCard(projectId, canvasId, {
            id: createId('card'),
            type: 'question',
            title: 'Question',
            content: '',
            tags: ['question'],
            pinned: false,
            locked: false,
            color: '#e0e7ff',
            priority: 'medium',
            x: 0,
            y: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            answer: '',
            variants: [],
          })
          navigate(`/workspace/project/${projectId}/canvas/${canvasId}`)
        }
      },
      {
        label: strings.commandNewText,
        run: () => {
          if (!projectId || !canvasId) return
          store.addCard(projectId, canvasId, {
            id: createId('card'),
            type: 'text',
            title: 'Notes',
            content: '',
            tags: [],
            pinned: false,
            locked: false,
            color: '#fbcfe8',
            priority: 'low',
            x: 0,
            y: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            markdown: true
          })
          navigate(`/workspace/project/${projectId}/canvas/${canvasId}`)
        }
      },
      {
        label: strings.commandNewMedia,
        run: () => {
          if (!projectId || !canvasId) return
          store.addCard(projectId, canvasId, {
            id: createId('card'),
            type: 'media',
            title: 'Media',
            content: '',
            tags: [],
            pinned: false,
            locked: false,
            color: '#fecdd3',
            priority: 'low',
            x: 0,
            y: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dataUrl: null,
            description: ''
          })
          navigate(`/workspace/project/${projectId}/canvas/${canvasId}`)
        }
      },
      {
        label: strings.commandNewFrame,
        run: () => {
          if (!projectId) return
          const canvas = store.addCanvas(projectId, { name: 'Frame Canvas' })
          if (canvas) {
            navigate(`/workspace/project/${projectId}/canvas/${canvas.id}`)
          }
        }
      },
      {
        label: strings.commandToggleGuided,
        run: () => {
          navigate(`/workspace/project/${projectId}`)
        }
      },
      {
        label: strings.commandToggleTheme,
        run: () => {
          store.setTheme({ ...store.theme, mode: store.theme.mode === 'dark' ? 'light' : 'dark' })
        }
      },
      {
        label: strings.commandExportJson,
        run: () => {
          const project = store.projects.find((p) => p.id === projectId)
          if (project) store.exportProject(project.id, 'json')
        }
      },
      {
        label: strings.commandExportText,
        run: () => {
          const project = store.projects.find((p) => p.id === projectId)
          if (project) store.exportProject(project.id, 'text')
        }
      }
    ].filter(Boolean)
  }, [params.canvasId, params.projectId, store, navigate])

  const filtered = actions.filter((action) => action!.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-start justify-center p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="glass-panel w-full max-w-xl space-y-3 p-6">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={strings.commandPalette}
                className="w-full rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/70"
              />
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {filtered.map((action) => (
                  <li key={action!.label}>
                    <button
                      onClick={() => {
                        action!.run()
                        onClose()
                      }}
                      className="flex w-full items-center justify-between rounded-2xl px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-500/10 dark:text-slate-200"
                    >
                      {action!.label}
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="rounded-2xl bg-white/60 px-4 py-4 text-center text-sm text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                    No commands
                  </li>
                )}
              </ul>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
