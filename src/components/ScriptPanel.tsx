import { useContext } from 'react'
import { Project, QuestionVariant, ScriptQuestion } from '../lib/storage'
import { StoreContext } from '../App'
import { personalizeAgentText } from '../lib/personalization'

interface ScriptPanelProps {
  project: Project
  onCaptureAnswer: (question: ScriptQuestion, variant: QuestionVariant) => void
}

export default function ScriptPanel({ project, onCaptureAnswer }: ScriptPanelProps) {
  const store = useContext(StoreContext)!

  return (
    <aside className="glass-panel space-y-4 p-4 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Guided mode</h3>
      {project.script.sections.map((section) => (
        <section key={section.id} className="rounded-3xl bg-indigo-500/5 p-3">
          <header>
            <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-200">{section.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{section.cues}</p>
          </header>
          <ul className="mt-3 space-y-2">
            {section.questions.map((question) => (
              <li key={question.id} className="rounded-2xl bg-white/80 p-3 shadow-sm dark:bg-slate-900/60">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{question.label}</p>
                    {question.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-indigo-500 dark:text-indigo-200">
                        {question.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-indigo-500/10 px-2 py-0.5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {question.inputs?.length ? (
                    <div className="rounded-2xl border border-indigo-200/40 bg-indigo-50/40 p-2 text-[10px] text-slate-600 dark:border-indigo-500/40 dark:bg-slate-900/40 dark:text-slate-300">
                      <p className="font-semibold text-indigo-600 dark:text-indigo-200">Structured capture:</p>
                      <ul className="mt-1 space-y-1">
                        {question.inputs.map((input) => (
                          <li key={input.id} className="flex items-center justify-between gap-2">
                            <span>{input.label}</span>
                            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[9px] uppercase tracking-wide text-indigo-500 dark:bg-slate-800/60 dark:text-indigo-200">
                              {input.type}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    {question.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => onCaptureAnswer(question, variant)}
                        className="w-full rounded-2xl bg-indigo-500/10 px-3 py-2 text-left text-xs text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-200"
                      >
                        ✨ {personalizeAgentText(variant.text, store.settings.agentName)}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </aside>
  )
}
