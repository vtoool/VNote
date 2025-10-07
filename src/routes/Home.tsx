import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, SparklesIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline'
import { StoreContext } from '../App'
import { strings } from '../lib/i18n'
import TemplatePickerDialog from '../components/TemplatePickerDialog'

export default function Home() {
  const store = useContext(StoreContext)!
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false)

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return store.projects.filter(
      (project) =>
        project.name.toLowerCase().includes(term) ||
        project.tags.some((tag) => tag.toLowerCase().includes(term))
    )
  }, [searchTerm, store.projects])

  return (
    <div className="space-y-6">
      <div className="glass-panel flex flex-wrap items-center gap-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">{strings.projectsTitle}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Guided, human-first notes for your high-impact conversations.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setTemplateDialogOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:shadow-glow"
          >
            <PlusIcon className="h-5 w-5" />
            {strings.createProject}
          </button>
        </div>
      </div>

      <div className="glass-panel p-6">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name, tag, or template"
          className="mb-4 w-full rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/70"
        />
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 rounded-3xl border border-dashed border-indigo-300/50 bg-indigo-50/40 p-12 text-center dark:border-indigo-500/40 dark:bg-slate-800/40">
            <SparklesIcon className="h-10 w-10 text-indigo-500" />
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-100">{strings.emptyProjects}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((project) => (
              <article
                key={project.id}
                className="group flex flex-col rounded-3xl border border-white/60 bg-white/70 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-glow dark:border-slate-800/60 dark:bg-slate-900/70"
              >
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">{project.name}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Updated {new Date(project.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="rounded-2xl bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => {
                        const duplicate = store.duplicateProject(project.id)
                        if (duplicate) navigate(`/project/${duplicate.id}`)
                      }}
                      className="rounded-2xl bg-white/60 px-3 py-2 text-xs text-slate-500 shadow-sm transition hover:bg-white/90 dark:bg-slate-800/60 dark:text-slate-300"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => store.deleteProject(project.id)}
                      className="rounded-2xl bg-white/60 px-3 py-2 text-xs text-rose-500 shadow-sm transition hover:bg-rose-50 dark:bg-slate-800/60 dark:text-rose-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </header>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {project.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-indigo-500/10 px-3 py-1 text-indigo-600 dark:text-indigo-200">
                      #{tag}
                    </span>
                  ))}
                  {project.tags.length === 0 && <span>No tags</span>}
                </div>
                <footer className="mt-6 text-xs text-slate-400">
                  {project.canvases.length} canvases • {project.versionHistory.length} versions saved
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>

      <TemplatePickerDialog
        open={isTemplateDialogOpen}
        templates={store.templates}
        onClose={() => setTemplateDialogOpen(false)}
        onSelect={(tpl) => {
          const project = store.addProject(tpl)
          if (project) {
            setTemplateDialogOpen(false)
            navigate(`/project/${project.id}`)
          }
        }}
      />
    </div>
  )
}
