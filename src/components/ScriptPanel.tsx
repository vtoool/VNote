import { Project } from '../lib/storage'

interface ScriptPanelProps {
  project: Project
  onCaptureAnswer: (questionId: string, variantText: string) => void
}

export default function ScriptPanel({ project, onCaptureAnswer }: ScriptPanelProps) {
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
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{question.label}</p>
                <div className="mt-2 space-y-2">
                  {question.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => onCaptureAnswer(question.id, variant.text)}
                      className="w-full rounded-2xl bg-indigo-500/10 px-3 py-2 text-left text-xs text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-200"
                    >
                      ✨ {variant.text}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </aside>
  )
}
