import { XMarkIcon } from '@heroicons/react/24/outline'
import { Template } from '../lib/storage'

interface TemplatePickerDialogProps {
  open: boolean
  templates: Template[]
  onClose: () => void
  onSelect: (template: Template) => void
}

export default function TemplatePickerDialog({ open, templates, onClose, onSelect }: TemplatePickerDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/20 bg-white/95 p-6 shadow-glow dark:border-slate-800/60 dark:bg-slate-900/95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/70 p-2 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Close template picker"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <header className="mb-6 pr-10">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">Choose a template</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Start your new project with guided questions and canvases tailored to each conversation type.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="group flex h-full flex-col items-start rounded-3xl border border-slate-200/60 bg-white/80 p-5 text-left shadow-soft transition hover:-translate-y-1 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/60 dark:bg-slate-900/80"
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">Template</span>
              <h3 className="mt-2 text-xl font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                {template.name}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{template.description}</p>
              {template.personalBullets.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                  {template.personalBullets.slice(0, 3).map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400"></span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                  {template.personalBullets.length > 3 && <li className="text-xs text-slate-400">and more...</li>}
                </ul>
              )}
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 transition group-hover:bg-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-200">
                Use this template
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
