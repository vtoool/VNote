import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { StoreContext } from '../App'
import { strings } from '../lib/i18n'
import { createEmptyCanvas } from '../lib/storage'
import { findNextGridPosition } from '../lib/canvasLayout'
import { createQuestionCard } from '../lib/questions'

export default function ProjectRoute() {
  const { projectId } = useParams()
  const store = useContext(StoreContext)!
  const navigate = useNavigate()
  const project = store.projects.find((p) => p.id === projectId)
  const [renameValue, setRenameValue] = useState(project?.name ?? '')

  useEffect(() => {
    if (project) {
      setRenameValue(project.name)
    }
  }, [project?.name])

  if (!project) {
    return (
      <div className="glass-panel mx-auto mt-12 max-w-lg space-y-4 p-8 text-center">
        <p className="text-lg font-semibold text-slate-600 dark:text-slate-200">Project not found.</p>
        <Link to="/" className="rounded-2xl bg-indigo-500/10 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-200">
          Back home
        </Link>
      </div>
    )
  }

  const canvases = useMemo(() => project.canvases, [project.canvases])

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="glass-panel space-y-6 p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onBlur={() => store.updateProject(project.id, (proj) => ({ ...proj, name: renameValue, updatedAt: new Date().toISOString() }))}
              className="w-full rounded-2xl border border-transparent bg-transparent text-3xl font-semibold text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
            />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {project.tags.length > 0 ? project.tags.join(' • ') : 'Add tags via card quick tags.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {project.canvases[0] && (
              <button
                onClick={() => navigate(`/project/${project.id}/canvas/${project.canvases[0].id}`, { state: { callMode: true } })}
                className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-200"
              >
                Start call mode
              </button>
            )}
            <button
              onClick={() => {
                store.saveSnapshot(project.id, 'Manual save')
              }}
              className="rounded-2xl bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200"
            >
              {strings.actionSave}
            </button>
          </div>
        </header>

        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-4 dark:border-slate-700/60 dark:bg-slate-900/70">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <ArrowLeftIcon className="h-4 w-4" /> Canvases
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {canvases.map((canvas) => (
              <button
                key={canvas.id}
                onClick={() => navigate(`/project/${project.id}/canvas/${canvas.id}`)}
                className="flex flex-col items-start gap-2 rounded-3xl border border-transparent bg-indigo-500/5 p-4 text-left transition hover:-translate-y-1 hover:border-indigo-400 hover:shadow-glow"
              >
                <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">{canvas.name}</span>
                <span className="text-xs text-slate-500">{canvas.cards.length} cards • {canvas.frames.length} frames</span>
              </button>
            ))}
            <button
              onClick={() => {
                const canvas = createEmptyCanvas('New Canvas')
                store.updateProject(project.id, (proj) => ({
                  ...proj,
                  canvases: [canvas, ...proj.canvases],
                  updatedAt: new Date().toISOString()
                }))
                navigate(`/project/${project.id}/canvas/${canvas.id}`)
              }}
              className="flex items-center justify-center rounded-3xl border border-dashed border-indigo-400/50 bg-indigo-100/30 p-4 text-sm font-semibold text-indigo-500 hover:bg-indigo-200/40"
            >
              <PlusIcon className="mr-2 h-5 w-5" /> {strings.newCanvas}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-4 dark:border-slate-700/60 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {strings.personalBullets}
            </h3>
            <button
              onClick={() =>
                store.updateProject(project.id, (proj) => ({
                  ...proj,
                  personalBullets: [...proj.personalBullets, 'New bullet'],
                  updatedAt: new Date().toISOString()
                }))
              }
              className="rounded-2xl bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {project.personalBullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                <textarea
                  value={bullet}
                  onChange={(event) =>
                    store.updateProject(project.id, (proj) => {
                      const next = [...proj.personalBullets]
                      next[index] = event.target.value
                      return { ...proj, personalBullets: next, updatedAt: new Date().toISOString() }
                    })
                  }
                  className="w-full rounded-2xl border border-transparent bg-indigo-500/5 p-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800/60"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-4 dark:border-slate-700/60 dark:bg-slate-900/70">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Version history
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {project.versionHistory.map((version) => (
              <li key={version.id} className="flex items-center justify-between rounded-2xl bg-indigo-500/5 px-3 py-2">
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{version.label}</p>
                  <p className="text-xs text-slate-500">{new Date(version.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() =>
                    store.updateProject(project.id, () => ({ ...version.project, id: project.id, versionHistory: project.versionHistory }))
                  }
                  className="rounded-2xl bg-white/60 px-3 py-1 text-xs text-indigo-600 hover:bg-white/80 dark:bg-slate-800/60 dark:text-indigo-200"
                >
                  {strings.restore}
                </button>
              </li>
            ))}
            {project.versionHistory.length === 0 && (
              <li className="rounded-2xl bg-slate-100/60 px-4 py-3 text-sm text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                Snapshots will appear here when you save them.
              </li>
            )}
          </ul>
        </div>
      </section>

      <aside className="glass-panel space-y-5 p-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{strings.guidedMode}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Natural phrasing variants keep you sounding like yourself. Switch when it feels right.
          </p>
          <div className="mt-4 space-y-4">
            {project.script.sections.map((section) => (
              <div key={section.id} className="rounded-3xl bg-indigo-500/5 p-4">
                <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-200">{section.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{section.cues}</p>
                <ul className="mt-3 space-y-3">
                  {section.questions.map((question) => (
                    <li key={question.id} className="rounded-2xl bg-white/70 p-3 text-sm shadow-sm dark:bg-slate-900/60">
                      <p className="font-semibold text-slate-700 dark:text-slate-100">{question.label}</p>
                      <div className="mt-2 space-y-2">
                        {question.variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => {
                              if (!project.canvases[0]) return
                              const canvas = project.canvases[0]
                              const position = findNextGridPosition(canvas.cards)
                              const card = createQuestionCard({ question, variant, position })
                              store.addCard(project.id, canvas.id, card)
                            }}
                            className="block w-full rounded-2xl bg-indigo-500/10 px-3 py-2 text-left text-xs text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-200"
                          >
                            ✨ {variant.text}
                          </button>
                        ))}
                      </div>
                      {question.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-rose-400">
                          {question.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-rose-500/10 px-2 py-1">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
