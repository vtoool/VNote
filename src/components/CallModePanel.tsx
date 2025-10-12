import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import CanvasBoard from './CanvasBoard'
import { Card, Canvas, Project } from '../lib/storage'
import { StoreContext } from '../App'
import SalesHUD from './SalesHUD'
import ConversationTimeline from './ConversationTimeline'
import ShortcutBar from './ShortcutBar'
import MicWidget from './MicWidget'
import PersonalBullets from './PersonalBullets'
import { useConversationEngine } from '../engine/useConversationEngine'
import type { EngineToast, ObjectionPlaybookEntry, Persona, SalesPlan } from '../engine/types'

interface CallModePanelProps {
  project: Project
  canvas: Canvas
  onCanvasChange: (canvas: Canvas) => void
  onCardChange: (card: Card) => void
  onCardDelete: (cardId: string) => void
  onClose: () => void
  onPointerPositionChange?: (position: { x: number; y: number } | null) => void
}

type TabId = 'strategy' | 'script' | 'objections' | 'notes'

const TAB_OPTIONS: { id: TabId; label: string }[] = [
  { id: 'strategy', label: 'Strategy' },
  { id: 'script', label: 'Script' },
  { id: 'objections', label: 'Objections' },
  { id: 'notes', label: 'Notes' }
]

const toastToneClass: Record<EngineToast['tone'], string> = {
  info: 'bg-slate-900/90 text-white',
  warning: 'bg-amber-500/90 text-white',
  error: 'bg-rose-600/90 text-white'
}

function StrategyTab({ plan, persona }: { plan: SalesPlan; persona: Persona }) {
  return (
    <div className="space-y-4 text-sm text-slate-600 dark:text-slate-200">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Persona & tone</h4>
        <p className="mt-1 font-semibold text-indigo-600 dark:text-indigo-200">{persona.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{persona.title} · {persona.company}</p>
        <p className="mt-2 leading-relaxed">{persona.elevatorPitch}</p>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Game plan</h4>
        <p className="mt-1 leading-relaxed">{plan.strategy}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <h5 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Discovery framework</h5>
          <ul className="mt-2 space-y-1 text-sm">
            {plan.discoveryFramework.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Product facts</h5>
          <ul className="mt-2 space-y-1 text-sm">
            {plan.productFacts.map((fact) => (
              <li key={fact} className="leading-relaxed">{fact}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <h5 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Demo hooks</h5>
          <ul className="mt-2 space-y-1 text-sm">
            {plan.demoHooks.map((hook) => (
              <li key={hook}>{hook}</li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Closing playbook</h5>
          <ul className="mt-2 space-y-1 text-sm">
            {plan.closingPlaybook.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ScriptTab({ script }: { script?: Project['script'] }) {
  if (!script) {
    return <p className="text-sm text-slate-500 dark:text-slate-300">No script attached to this workspace.</p>
  }
  return (
    <div className="space-y-4 text-sm text-slate-600 dark:text-slate-200">
      {script.sections.map((section) => (
        <div key={section.id} className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/50">
          <header>
            <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-200">{section.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{section.cues}</p>
          </header>
          <ul className="mt-3 space-y-2">
            {section.questions.map((question) => (
              <li key={question.id} className="rounded-2xl bg-white/90 p-3 shadow-inner dark:bg-slate-900/40">
                <p className="font-semibold text-slate-700 dark:text-slate-100">{question.label}</p>
                {question.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-indigo-500 dark:text-indigo-200">
                    {question.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-indigo-500/10 px-2 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {question.variants.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-300">
                    {question.variants.map((variant) => (
                      <li key={variant.id}>• {variant.text}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function ObjectionsTab({ library }: { library: ObjectionPlaybookEntry[] }) {
  return (
    <div className="space-y-4 text-sm text-slate-600 dark:text-slate-200">
      {library.map((entry) => (
        <div key={entry.category} className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/50">
          <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-200">{entry.category}</h4>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{entry.summary}</p>
          <div className="mt-3">
            <h5 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Counters</h5>
            <ul className="mt-1 space-y-1">
              {entry.counters.map((counter, index) => (
                <li key={`${entry.category}-counter-${index}`}>• {counter}</li>
              ))}
            </ul>
          </div>
          <div className="mt-2">
            <h5 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Follow-ups</h5>
            <ul className="mt-1 space-y-1">
              {entry.followUps.map((follow, index) => (
                <li key={`${entry.category}-follow-${index}`}>• {follow}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}

function NotesTab({ project }: { project: Project }) {
  if (project.personalBullets.length > 0) {
    return <PersonalBullets bullets={project.personalBullets} />
  }
  return <p className="text-sm text-slate-500 dark:text-slate-300">Add personal notes to your project to see them here during calls.</p>
}

export default function CallModePanel({
  project,
  canvas,
  onCanvasChange,
  onCardChange,
  onCardDelete,
  onClose,
  onPointerPositionChange
}: CallModePanelProps) {
  const store = useContext(StoreContext)!
  const conversation = useConversationEngine({
    projectId: project.id,
    script: project.script,
    personaName: store.settings.agentName
  })

  const [activeTab, setActiveTab] = useState<TabId>('strategy')
  const [agentDraft, setAgentDraft] = useState('')
  const [customerDraft, setCustomerDraft] = useState('')
  const [toast, setToast] = useState<EngineToast | null>(null)

  useEffect(() => {
    if (!conversation.toast) return
    setToast(conversation.toast)
    conversation.dismissToast()
  }, [conversation.toast, conversation.dismissToast])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => {
      setToast((current) => (current && current.id === toast.id ? null : current))
    }, 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'strategy':
        return <StrategyTab plan={conversation.plan} persona={conversation.persona} />
      case 'script':
        return <ScriptTab script={conversation.script} />
      case 'objections':
        return <ObjectionsTab library={conversation.objectionLibrary} />
      case 'notes':
        return <NotesTab project={project} />
      default:
        return null
    }
  }, [activeTab, conversation.plan, conversation.persona, conversation.script, conversation.objectionLibrary, project])

  const handleAgentSubmit = useCallback(
    async (input?: string) => {
      const content = (input ?? agentDraft).trim()
      if (!content) return
      setAgentDraft('')
      conversation.addAgentUtterance(content)
    },
    [agentDraft, conversation]
  )

  const handleCustomerSubmit = useCallback(async () => {
    const text = customerDraft.trim()
    if (!text) return
    setCustomerDraft('')
    conversation.addCustomerUtterance(text)
    try {
      await conversation.proposeNext()
    } catch (error) {
      console.error('Failed to generate next line', error)
    }
  }, [conversation, customerDraft])

  const handleMicDone = useCallback(
    (spoken: string) => {
      const trimmed = spoken.trim()
      if (trimmed) {
        void handleAgentSubmit(trimmed)
      }
    },
    [handleAgentSubmit]
  )

  const insertShortcut = useCallback((text: string) => {
    setAgentDraft((prev) => (prev ? `${prev} ${text}` : text))
  }, [])

  const handleCopy = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      try {
        await navigator.clipboard.writeText(text)
        setToast({ id: `copy-${Date.now()}`, tone: 'info', message: 'Copied to clipboard' })
      } catch (error) {
        console.warn('Clipboard copy failed', error)
        setToast({ id: `copy-error-${Date.now()}`, tone: 'error', message: 'Unable to copy to clipboard' })
      }
    },
    []
  )

  const handleObjection = useCallback(async () => {
    try {
      await conversation.handleObjection()
    } catch (error) {
      console.error('Failed to generate objection handling', error)
    }
  }, [conversation])

  const handleInsertSuggestion = useCallback(() => {
    conversation.insertCoachSuggestion()
  }, [conversation])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-indigo-200/60 bg-white/80 px-5 py-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Live sales assistant</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Log every turn to keep Groq’s HUD proposing the next best move in under two seconds.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={conversation.reset}
            className="rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
          >
            Reset session
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-indigo-200 bg-indigo-500/90 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-500 dark:border-indigo-400/40"
          >
            Close
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="flex flex-wrap items-center gap-2">
              {TAB_OPTIONS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-indigo-500 text-white shadow'
                      : 'bg-white/70 text-slate-500 hover:bg-white dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="mt-4 max-h-[320px] overflow-y-auto pr-1">{tabContent}</div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
            <CanvasBoard
              canvas={canvas}
              onChange={onCanvasChange}
              onCardChange={onCardChange}
              onCardDelete={onCardDelete}
              onPointerPositionChange={onPointerPositionChange}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SalesHUD
            proposal={conversation.currentProposal}
            streamingNextLine={conversation.streamingNextLine}
            loading={conversation.loading}
            sentiment={conversation.contextSignals.lastCustomerSentiment}
            onCopy={handleCopy}
            onHandleObjection={handleObjection}
            error={conversation.error}
            onInsert={handleInsertSuggestion}
          />

          <div className="glass-panel space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Log what you just said
              </p>
              <ShortcutBar onInsert={insertShortcut} />
            </div>
            <textarea
              value={agentDraft}
              onChange={(event) => setAgentDraft(event.target.value)}
              placeholder="Summarize your last line or paste dictation…"
              className="h-24 w-full resize-none rounded-2xl border border-slate-200/80 bg-white/90 p-3 text-sm text-slate-700 shadow-inner outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-indigo-400/40 dark:focus:ring-indigo-500/30"
              disabled={conversation.loading}
            />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <MicWidget onDone={handleMicDone} />
              <button
                type="button"
                onClick={() => void handleAgentSubmit()}
                className="rounded-full border border-indigo-200 bg-indigo-500/90 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-400/40"
                disabled={conversation.loading || !agentDraft.trim()}
              >
                Log agent line
              </button>
            </div>
          </div>

          <ConversationTimeline
            history={conversation.history}
            plan={conversation.plan}
            goals={conversation.goals}
            checklist={conversation.checklist}
            contextSignals={conversation.contextSignals}
            customerDraft={customerDraft}
            onCustomerDraftChange={setCustomerDraft}
            onCustomerSubmit={handleCustomerSubmit}
            disabled={conversation.loading}
            onExport={conversation.exportTranscript}
          />
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className={`rounded-full px-4 py-2 text-sm shadow-lg ${toastToneClass[toast.tone]}`}>{toast.message}</div>
        </div>
      )}
    </div>
  )
}
