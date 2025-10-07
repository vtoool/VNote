import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { StoreContext } from '../App'
import { Template, Script } from '../lib/storage'
import { createId } from '../lib/id'

interface TemplateManagerProps {
  open: boolean
  onClose: () => void
}

interface EditorState {
  mode: 'create' | 'edit'
  templateId?: string
}

interface TemplateDraft {
  name: string
  description: string
  scriptJson: string
  personalBullets: string
  defaultCardsJson: string
}

function ensureScriptStructure(script: Script): Script {
  const withIds: Script = {
    ...script,
    id: script.id || createId('script'),
    sections: (script.sections ?? []).map((section) => ({
      ...section,
      id: section.id || createId('section'),
      questions: (section.questions ?? []).map((question) => ({
        ...question,
        id: question.id || createId('question'),
        variants: (question.variants ?? []).map((variant) => ({
          ...variant,
          id: variant.id || createId('variant')
        })),
        inputs: question.inputs
          ? question.inputs.map((input) => ({
              ...input,
              id: input.id || createId('input'),
              options: input.options?.map((option) => ({ ...option }))
            }))
          : undefined,
      })),
    })),
  };
  return withIds
}

function buildDraftFromTemplate(template?: Template): TemplateDraft {
  if (!template) {
    const blankScript: Script = {
      id: createId('script'),
      title: 'New Script',
      sections: []
    }
    return {
      name: '',
      description: '',
      scriptJson: JSON.stringify(blankScript, null, 2),
      personalBullets: '',
      defaultCardsJson: '[]'
    }
  }

  return {
    name: template.name,
    description: template.description,
    scriptJson: JSON.stringify(template.script, null, 2),
    personalBullets: template.personalBullets.join('\n'),
    defaultCardsJson: template.defaultCards ? JSON.stringify(template.defaultCards, null, 2) : '[]'
  }
}

export default function TemplateManager({ open, onClose }: TemplateManagerProps) {
  const store = useContext(StoreContext)!
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [draft, setDraft] = useState<TemplateDraft>(() => buildDraftFromTemplate())
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const primaryButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      setEditor(null)
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (editor) {
          setEditor(null)
          setError(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, editor, onClose])

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => {
        primaryButtonRef.current?.focus()
      }, 0)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [open])

  useEffect(() => {
    if (!editor) return
    const template = editor.templateId
      ? store.templates.find((tpl) => tpl.id === editor.templateId)
      : undefined
    setDraft(buildDraftFromTemplate(template))
    setError(null)
  }, [editor, store.templates])

  const sortedTemplates = useMemo(() => {
    return [...store.templates].sort((a, b) => {
      if (a.builtIn && !b.builtIn) return -1
      if (!a.builtIn && b.builtIn) return 1
      return a.name.localeCompare(b.name)
    })
  }, [store.templates])

  const handleSubmit = () => {
    try {
      const parsedScript = ensureScriptStructure(JSON.parse(draft.scriptJson) as Script)
      const bullets = draft.personalBullets
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      const defaultCards = draft.defaultCardsJson.trim()
        ? (JSON.parse(draft.defaultCardsJson) as Template['defaultCards'])
        : undefined

      if (editor?.mode === 'edit' && editor.templateId) {
        store.updateTemplate(editor.templateId, {
          name: draft.name.trim() || 'Untitled Template',
          description: draft.description.trim(),
          script: parsedScript,
          personalBullets: bullets,
          defaultCards
        })
      } else {
        store.createTemplate({
          name: draft.name.trim() || 'Untitled Template',
          description: draft.description.trim(),
          script: parsedScript,
          personalBullets: bullets,
          defaultCards
        })
      }
      setEditor(null)
      setError(null)
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'Unable to save template.')
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 px-4 py-8 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-manager-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={dialogRef}
        className="glass-panel relative flex h-full w-full max-w-5xl flex-col rounded-3xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-white/20 bg-white/90 px-5 py-4 dark:border-slate-800/60 dark:bg-slate-900/90">
          <div className="pr-6">
            <h2 id="template-manager-title" className="text-lg font-semibold text-slate-800 dark:text-white sm:text-2xl">
              Template library
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Create reusable discovery starting points and tailor them to your team.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={() => setEditor({ mode: 'create' })}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:shadow-glow"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              New template
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-700 dark:bg-slate-800/70 dark:text-slate-300"
              aria-label="Close template manager"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-6">
          <div role="list" className="grid gap-4 sm:grid-cols-2">
            {sortedTemplates.map((template) => (
              <article
                key={template.id}
                role="listitem"
                className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-glow focus-within:shadow-glow dark:border-slate-700/70 dark:bg-slate-900/70"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                        {template.builtIn ? 'Built-in' : 'Custom'}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-800 dark:text-white">{template.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditor({ mode: 'edit', templateId: template.id })}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-200"
                        aria-label={`Edit ${template.name}`}
                      >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => store.duplicateTemplate(template.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-sm transition hover:bg-white dark:bg-slate-800/70 dark:text-slate-300"
                        aria-label={`Duplicate ${template.name}`}
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(template.builtIn)}
                        onClick={() => store.deleteTemplate(template.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
                        aria-label={`Delete ${template.name}`}
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{template.description}</p>
                  {template.personalBullets.length > 0 && (
                    <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                      {template.personalBullets.slice(0, 4).map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" aria-hidden="true" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        {editor && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-8">
            <div className="glass-panel w-full max-w-3xl rounded-3xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                    {editor.mode === 'edit' ? 'Edit template' : 'Create template'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Update the high-level details. Scripts and cards accept JSON so you can paste from existing playbooks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditor(null)
                    setError(null)
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-sm transition hover:bg-white dark:bg-slate-800/80 dark:text-slate-300"
                  aria-label="Close editor"
                >
                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <form
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  handleSubmit()
                }}
              >
                <div className="space-y-1">
                  <label htmlFor="template-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Name
                  </label>
                  <input
                    id="template-name"
                    value={draft.name}
                    onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/60 dark:bg-slate-900/70"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="template-description" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Description
                  </label>
                  <textarea
                    id="template-description"
                    value={draft.description}
                    onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                    className="min-h-[80px] w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/60 dark:bg-slate-900/70"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="template-bullets" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Personal bullets (one per line)
                  </label>
                  <textarea
                    id="template-bullets"
                    value={draft.personalBullets}
                    onChange={(event) => setDraft((prev) => ({ ...prev, personalBullets: event.target.value }))}
                    className="min-h-[100px] w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/60 dark:bg-slate-900/70"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="template-script" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Script JSON
                  </label>
                  <textarea
                    id="template-script"
                    value={draft.scriptJson}
                    onChange={(event) => setDraft((prev) => ({ ...prev, scriptJson: event.target.value }))}
                    className="h-48 w-full rounded-2xl border border-slate-200/70 bg-slate-900/95 px-3 py-2 font-mono text-xs text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    aria-describedby={error ? 'template-editor-error' : undefined}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="template-cards" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Default cards JSON (optional)
                  </label>
                  <textarea
                    id="template-cards"
                    value={draft.defaultCardsJson}
                    onChange={(event) => setDraft((prev) => ({ ...prev, defaultCardsJson: event.target.value }))}
                    className="h-40 w-full rounded-2xl border border-slate-200/70 bg-slate-900/95 px-3 py-2 font-mono text-xs text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                {error && (
                  <p id="template-editor-error" className="text-sm text-rose-500">
                    {error}
                  </p>
                )}
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditor(null)
                      setError(null)
                    }}
                    className="rounded-full border border-slate-300/60 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-700 dark:border-slate-700/60 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:shadow-glow"
                  >
                    <CheckIcon className="h-4 w-4" aria-hidden="true" />
                    Save template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
