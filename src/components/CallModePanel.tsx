import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import CanvasBoard from './CanvasBoard'
import {
  Card,
  Canvas,
  Project,
  QuestionFieldState,
  QuestionVariant,
  ScriptQuestion,
  ScriptSection
} from '../lib/storage'
import { createQuestionCard, initializeFieldState } from '../lib/questions'
import { quickTags } from '../lib/tags'
import { createId } from '../lib/id'
import { findNextGridPositionWithOverflow } from '../lib/canvasLayout'
import { StoreContext } from '../App'
import { personalizeAgentText } from '../lib/personalization'

interface CallModePanelProps {
  project: Project
  canvas: Canvas
  onCanvasChange: (canvas: Canvas) => void
  onCardChange: (card: Card) => void
  onCardDelete: (cardId: string) => void
  onClose: () => void
}

interface QuestionPointer {
  sectionId: string
  questionId: string
}

type HistoryEntry =
  | {
      id: string
      type: 'question'
      questionId: string
      questionLabel: string
      variantText?: string
      answer?: string
      tags: string[]
      timestamp: string
      fields?: QuestionFieldState[]
      skipped?: boolean
    }
  | {
      id: string
      type: 'freeform'
      questionLabel: string
      answer?: string
      tags: string[]
      timestamp: string
    }

function formatElapsed(startedAt: number, now: number) {
  const totalSeconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function findFirstQuestion(sections: ScriptSection[], answered: Set<string>): QuestionPointer | null {
  for (const section of sections) {
    for (const question of section.questions) {
      if (!answered.has(question.id)) {
        return { sectionId: section.id, questionId: question.id }
      }
    }
  }
  return null
}

function findNextSequential(
  pointer: QuestionPointer,
  sections: ScriptSection[],
  answered: Set<string>
): QuestionPointer | null {
  const sectionIndex = sections.findIndex((section) => section.id === pointer.sectionId)
  if (sectionIndex === -1) return findFirstQuestion(sections, answered)
  const questionIndex = sections[sectionIndex].questions.findIndex((q) => q.id === pointer.questionId)
  if (questionIndex === -1) return findFirstQuestion(sections, answered)

  for (let si = sectionIndex; si < sections.length; si++) {
    const section = sections[si]
    const start = si === sectionIndex ? questionIndex + 1 : 0
    for (let qi = start; qi < section.questions.length; qi++) {
      const candidate = section.questions[qi]
      if (!answered.has(candidate.id)) {
        return { sectionId: section.id, questionId: candidate.id }
      }
    }
  }
  return null
}

function determineNextPointer(
  pointer: QuestionPointer,
  question: ScriptQuestion,
  sections: ScriptSection[],
  answered: Set<string>,
  activeTags: Set<string>
): QuestionPointer | null {
  if (question.branch) {
    const branchTag = question.branch.whenTag.toLowerCase()
    if (activeTags.has(branchTag)) {
      const targetSection = sections.find((section) => section.id === question.branch!.nextSectionId)
      if (targetSection) {
        const branchQuestion = targetSection.questions.find((candidate) => !answered.has(candidate.id))
        if (branchQuestion) {
          return { sectionId: targetSection.id, questionId: branchQuestion.id }
        }
      }
    }
  }

  const sequential = findNextSequential(pointer, sections, answered)
  if (sequential) return sequential

  return findFirstQuestion(sections, answered)
}

function collectSequentialSuggestions(
  pointer: QuestionPointer | null,
  sections: ScriptSection[],
  answered: Set<string>,
  limit: number
) {
  if (!pointer) return [] as { section: ScriptSection; question: ScriptQuestion }[]
  const sectionIndex = sections.findIndex((section) => section.id === pointer.sectionId)
  if (sectionIndex === -1) return []
  const questionIndex = sections[sectionIndex].questions.findIndex((q) => q.id === pointer.questionId)
  const suggestions: { section: ScriptSection; question: ScriptQuestion }[] = []
  if (questionIndex === -1) return suggestions

  for (let si = sectionIndex; si < sections.length && suggestions.length < limit; si++) {
    const section = sections[si]
    const start = si === sectionIndex ? questionIndex + 1 : 0
    for (let qi = start; qi < section.questions.length && suggestions.length < limit; qi++) {
      const candidate = section.questions[qi]
      if (!answered.has(candidate.id)) {
        suggestions.push({ section, question: candidate })
      }
    }
  }
  return suggestions
}

function formatFieldValue(field: QuestionFieldState) {
  if (Array.isArray(field.value)) {
    return field.value.join(', ') || '—'
  }
  if (typeof field.value === 'boolean') {
    return field.value ? 'Yes' : 'No'
  }
  if (typeof field.value === 'number') {
    return Number.isFinite(field.value) ? String(field.value) : '—'
  }
  return field.value ? String(field.value) : '—'
}

export default function CallModePanel({
  project,
  canvas,
  onCanvasChange,
  onCardChange,
  onCardDelete,
  onClose
}: CallModePanelProps) {
  const store = useContext(StoreContext)!
  const agentName = store.settings.agentName
  const sections = project.script.sections
  const totalQuestions = useMemo(
    () => sections.reduce((count, section) => count + section.questions.length, 0),
    [sections]
  )
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const answeredSet = useMemo(() => {
    const answered = new Set<string>()
    history.forEach((entry) => {
      if (entry.type === 'question') {
        answered.add(entry.questionId)
      }
    })
    return answered
  }, [history])
  const [currentPointer, setCurrentPointer] = useState<QuestionPointer | null>(() =>
    findFirstQuestion(sections, new Set())
  )
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const [answer, setAnswer] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [fieldsState, setFieldsState] = useState<QuestionFieldState[]>([])
  const [manualSelection, setManualSelection] = useState('')
  const [freeformTitle, setFreeformTitle] = useState('')
  const [freeformNotes, setFreeformNotes] = useState('')
  const [freeformTagsInput, setFreeformTagsInput] = useState('')

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!currentPointer) {
      const next = findFirstQuestion(sections, answeredSet)
      if (next) {
        setCurrentPointer(next)
      }
    }
  }, [sections, answeredSet, currentPointer])

  useEffect(() => {
    if (currentPointer) {
      setManualSelection(`${currentPointer.sectionId}|${currentPointer.questionId}`)
    } else {
      setManualSelection('')
    }
  }, [currentPointer])

  const currentSection = currentPointer
    ? sections.find((section) => section.id === currentPointer.sectionId)
    : undefined
  const currentQuestion = currentSection?.questions.find(
    (question) => question.id === currentPointer?.questionId
  )
  const recommendedTagSet = useMemo(
    () => new Set(currentQuestion?.tags.map((tag) => tag.toLowerCase()) ?? []),
    [currentQuestion?.id]
  )
  const availableTags = useMemo(() => {
    const defaults = currentQuestion?.tags.map((tag) => tag.toLowerCase()) ?? []
    return Array.from(new Set([...defaults, ...quickTags]))
  }, [currentQuestion?.id])

  const manualOptions = useMemo(
    () =>
      sections.map((section) => ({
        section,
        questions: section.questions.map((question) => ({
          question,
          answered: answeredSet.has(question.id)
        }))
      })),
    [sections, answeredSet]
  )

  const canSaveFreeform = freeformTitle.trim().length > 0 || freeformNotes.trim().length > 0

  useEffect(() => {
    if (!currentQuestion) {
      setSelectedVariantId(null)
      setAnswer('')
      setSelectedTags([])
      setFieldsState([])
      return
    }
    setSelectedVariantId(currentQuestion.variants[0]?.id ?? null)
    setAnswer('')
    setSelectedTags(currentQuestion.tags.map((tag) => tag.toLowerCase()))
    setFieldsState(currentQuestion.inputs?.map((input) => initializeFieldState(input)) ?? [])
  }, [currentQuestion?.id])

  const currentVariant = currentQuestion
    ? currentQuestion.variants.find((variant) => variant.id === selectedVariantId) ||
      currentQuestion.variants[0]
    : undefined

  const activeTags = useMemo(() => {
    const base = currentQuestion?.tags.map((tag) => tag.toLowerCase()) ?? []
    return new Set([...base, ...selectedTags.map((tag) => tag.toLowerCase())])
  }, [selectedTags, currentQuestion?.id])

  const sequentialSuggestions = useMemo(() => {
    const answered = new Set(answeredSet)
    if (currentQuestion) answered.add(currentQuestion.id)
    return collectSequentialSuggestions(currentPointer, sections, answered, 3)
  }, [answeredSet, currentPointer, currentQuestion?.id, sections])

  const progressCount = history.reduce((count, entry) => {
    if (entry.type === 'question' && !entry.skipped) {
      return count + 1
    }
    return count
  }, 0)
  const elapsed = formatElapsed(sessionStartedAt, now)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((existing) => existing !== tag) : [...prev, tag]
    )
  }

  const updateField = (fieldId: string, value: QuestionFieldState['value']) => {
    setFieldsState((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? { ...field, value }
          : field
      )
    )
  }

  const handleJumpToQuestion = useCallback((pointer: QuestionPointer) => {
    setCurrentPointer(pointer)
  }, [])

  const handleManualSelect = useCallback(
    (value: string) => {
      setManualSelection(value)
      if (!value) return
      const [sectionId, questionId] = value.split('|')
      if (sectionId && questionId) {
        handleJumpToQuestion({ sectionId, questionId })
      }
    },
    [handleJumpToQuestion]
  )

  const handleSubmit = () => {
    if (!currentQuestion || !currentSection) return
    const { position, overflowed } = findNextGridPositionWithOverflow(canvas.cards)
    const variantForCard: QuestionVariant =
      currentVariant ?? { id: `${currentQuestion.id}-default`, text: currentQuestion.label, tone: 'warm' }
    const trimmedAnswer = answer.trim()
    const card = createQuestionCard({
      question: currentQuestion,
      variant: variantForCard,
      answer: trimmedAnswer,
      extraTags: selectedTags,
      fields: fieldsState.length ? fieldsState : undefined,
      position
    })
    const nextCanvas: Canvas = {
      ...canvas,
      cards: [card, ...canvas.cards]
    }
    if (overflowed) {
      nextCanvas.zoom = Math.max(0.4, canvas.zoom - 0.1)
    }
    onCanvasChange(nextCanvas)
    const tagSet = new Set(card.tags.map((tag) => tag.toLowerCase()))
    const entry: HistoryEntry = {
      id: createId('call-entry'),
      type: 'question',
      questionId: currentQuestion.id,
      questionLabel: currentQuestion.label,
      variantText: variantForCard.text,
      answer: trimmedAnswer,
      tags: card.tags,
      timestamp: new Date().toISOString(),
      fields: card.type === 'question' ? card.fields : undefined,
      skipped: false
    }
    setHistory((prev) => [...prev, entry])
    const answered = new Set(answeredSet)
    answered.add(currentQuestion.id)
    const nextPointer = determineNextPointer(
      { sectionId: currentSection.id, questionId: currentQuestion.id },
      currentQuestion,
      sections,
      answered,
      tagSet
    )
    setCurrentPointer(nextPointer)
    setAnswer('')
    setSelectedTags(currentQuestion.tags.map((tag) => tag.toLowerCase()))
  }

  const handleSkip = () => {
    if (!currentQuestion || !currentSection) return
    const entry: HistoryEntry = {
      id: createId('call-entry'),
      type: 'question',
      questionId: currentQuestion.id,
      questionLabel: currentQuestion.label,
      tags: Array.from(activeTags),
      timestamp: new Date().toISOString(),
      skipped: true
    }
    setHistory((prev) => [...prev, entry])
    const answered = new Set(answeredSet)
    answered.add(currentQuestion.id)
    const nextPointer = determineNextPointer(
      { sectionId: currentSection.id, questionId: currentQuestion.id },
      currentQuestion,
      sections,
      answered,
      new Set(activeTags)
    )
    setCurrentPointer(nextPointer)
  }

  const handleFreeformSubmit = () => {
    if (!freeformTitle.trim() && !freeformNotes.trim()) return
    const title = freeformTitle.trim() || 'Freeform note'
    const content = freeformNotes.trim()
    const inputTags = freeformTagsInput
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
    const normalizedTags = Array.from(new Set(['freeform', ...inputTags]))
    const { position, overflowed } = findNextGridPositionWithOverflow(canvas.cards)
    const now = new Date().toISOString()
    const freeformCard: Card = {
      id: createId('card'),
      type: 'sticky',
      title,
      content,
      tags: normalizedTags,
      pinned: false,
      locked: false,
      color: '#fef3c7',
      priority: 'medium',
      x: position.x,
      y: position.y,
      createdAt: now,
      updatedAt: now
    }
    const nextCanvas: Canvas = {
      ...canvas,
      cards: [freeformCard, ...canvas.cards]
    }
    if (overflowed) {
      nextCanvas.zoom = Math.max(0.4, canvas.zoom - 0.1)
    }
    onCanvasChange(nextCanvas)
    const entry: HistoryEntry = {
      id: createId('call-entry'),
      type: 'freeform',
      questionLabel: title,
      answer: content,
      tags: normalizedTags,
      timestamp: now
    }
    setHistory((prev) => [...prev, entry])
    setFreeformTitle('')
    setFreeformNotes('')
    setFreeformTagsInput('')
  }

  const handleRestart = () => {
    setHistory([])
    setSessionStartedAt(Date.now())
    setCurrentPointer(findFirstQuestion(sections, new Set()))
    setAnswer('')
    setSelectedTags([])
    setFieldsState([])
    setFreeformTitle('')
    setFreeformNotes('')
    setFreeformTagsInput('')
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Call mode</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {progressCount} of {totalQuestions} questions captured • {elapsed}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRestart}
            className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200"
          >
            Restart session
          </button>
          <button
            onClick={onClose}
            className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-500/20"
          >
            End call
          </button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <CanvasBoard
            canvas={canvas}
            onChange={onCanvasChange}
            onCardChange={onCardChange}
            onCardDelete={onCardDelete}
          />
        </div>
        <div className="space-y-4 lg:pr-2">
          <section className="glass-panel space-y-4 p-4">
            {currentQuestion ? (
              <>
                <header className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-indigo-500">
                    {currentSection?.title || 'Current question'}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    {currentQuestion.label}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentSection?.cues}</p>
                </header>
                <div className="space-y-3">
                  {currentQuestion.variants.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Pick your phrasing
                      </p>
                      <div className="space-y-2">
                        {currentQuestion.variants.map((variant) => (
                          <label
                            key={variant.id}
                            className={`flex cursor-pointer items-start gap-2 rounded-2xl border px-3 py-2 text-xs shadow-sm transition ${
                              currentVariant?.id === variant.id
                                ? 'border-indigo-400 bg-indigo-50/80 text-indigo-600 dark:border-indigo-500/60 dark:bg-slate-900/60 dark:text-indigo-200'
                                : 'border-slate-200/60 bg-white/70 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="call-variant"
                              value={variant.id}
                              checked={currentVariant?.id === variant.id}
                              onChange={() => setSelectedVariantId(variant.id)}
                              className="mt-1"
                            />
                            <span>✨ {personalizeAgentText(variant.text, agentName)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Capture the answer
                    </label>
                    <textarea
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' &&
                          !event.shiftKey &&
                          !event.altKey &&
                          !event.metaKey &&
                          !event.ctrlKey
                        ) {
                          event.preventDefault()
                          handleSubmit()
                        }
                      }}
                      rows={4}
                      placeholder="Type what you heard…"
                      className="w-full rounded-3xl border border-indigo-200/50 bg-white/90 p-3 text-sm shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-100"
                    />
                  </div>
                  {fieldsState.length > 0 && (
                    <div className="space-y-3 rounded-3xl bg-indigo-500/5 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-200">
                        Structured capture
                      </p>
                      <div className="space-y-3">
                        {fieldsState.map((field) => {
                          switch (field.type) {
                            case 'checkbox':
                              return (
                                <label
                                  key={field.id}
                                  className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-200"
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(field.value)}
                                    onChange={(event) => updateField(field.id, event.target.checked)}
                                    className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                                  />
                                  {field.label}
                                </label>
                              )
                            case 'select':
                              return (
                                <div key={field.id} className="space-y-1 text-xs">
                                  <label className="font-semibold text-slate-600 dark:text-slate-200" htmlFor={field.id}>
                                    {field.label}
                                  </label>
                                  <select
                                    id={field.id}
                                    value={typeof field.value === 'string' ? field.value : ''}
                                    onChange={(event) => updateField(field.id, event.target.value)}
                                    className="w-full rounded-2xl border border-indigo-300/40 bg-white/80 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/60"
                                  >
                                    <option value="">Select…</option>
                                    {field.options?.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )
                            case 'multiSelect':
                            case 'tags':
                              return (
                                <div key={field.id} className="space-y-1 text-xs">
                                  <label className="font-semibold text-slate-600 dark:text-slate-200" htmlFor={field.id}>
                                    {field.label}
                                  </label>
                                  <input
                                    id={field.id}
                                    value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                    onChange={(event) =>
                                      updateField(
                                        field.id,
                                        event.target.value
                                          .split(',')
                                          .map((entry) => entry.trim())
                                          .filter(Boolean)
                                      )
                                    }
                                    placeholder={field.placeholder || 'Separate values with commas'}
                                    className="w-full rounded-2xl border border-indigo-300/40 bg-white/80 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/60"
                                  />
                                </div>
                              )
                            case 'number':
                              return (
                                <div key={field.id} className="space-y-1 text-xs">
                                  <label className="font-semibold text-slate-600 dark:text-slate-200" htmlFor={field.id}>
                                    {field.label}
                                  </label>
                                  <input
                                    id={field.id}
                                    type="number"
                                    value={typeof field.value === 'number' ? field.value : ''}
                                    onChange={(event) =>
                                      updateField(field.id, event.target.value === '' ? null : Number(event.target.value))
                                    }
                                    placeholder={field.placeholder}
                                    className="w-full rounded-2xl border border-indigo-300/40 bg-white/80 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/60"
                                  />
                                </div>
                              )
                            case 'date':
                            case 'time':
                              return (
                                <div key={field.id} className="space-y-1 text-xs">
                                  <label className="font-semibold text-slate-600 dark:text-slate-200" htmlFor={field.id}>
                                    {field.label}
                                  </label>
                                  <input
                                    id={field.id}
                                    type={field.type}
                                    value={typeof field.value === 'string' ? field.value : ''}
                                    onChange={(event) => updateField(field.id, event.target.value)}
                                    className="w-full rounded-2xl border border-indigo-300/40 bg-white/80 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/60"
                                  />
                                </div>
                              )
                            case 'longText':
                              return (
                                <div key={field.id} className="space-y-1 text-xs">
                                  <label className="font-semibold text-slate-600 dark:text-slate-200" htmlFor={field.id}>
                                    {field.label}
                                  </label>
                                  <textarea
                                    id={field.id}
                                    value={typeof field.value === 'string' ? field.value : ''}
                                    onChange={(event) => updateField(field.id, event.target.value)}
                                    placeholder={field.placeholder}
                                    className="h-20 w-full rounded-2xl border border-indigo-300/40 bg-white/80 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/60"
                                  />
                                </div>
                              )
                            default:
                              return (
                                <div key={field.id} className="space-y-1 text-xs">
                                  <label className="font-semibold text-slate-600 dark:text-slate-200" htmlFor={field.id}>
                                    {field.label}
                                  </label>
                                  <input
                                    id={field.id}
                                    type={field.type === 'currency' || field.type === 'shortText' ? 'text' : field.type}
                                    value={typeof field.value === 'string' ? field.value : ''}
                                    onChange={(event) => updateField(field.id, event.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full rounded-2xl border border-indigo-300/40 bg-white/80 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/60"
                                  />
                                </div>
                              )
                          }
                        })}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Tag the moment
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                            selectedTags.includes(tag)
                              ? 'bg-indigo-500 text-white shadow'
                              : 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 dark:bg-slate-800/60 dark:text-indigo-200'
                          } ${recommendedTagSet.has(tag) ? 'ring-1 ring-indigo-400/60' : ''}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  {currentQuestion.branch && (
                    <div className="rounded-2xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      Branch available: if tagged “{currentQuestion.branch.whenTag}”, jump to {
                        sections.find((section) => section.id === currentQuestion.branch?.nextSectionId)?.title || 'next section'
                      }
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleSubmit}
                      className="rounded-2xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-600"
                    >
                      Save answer & next
                    </button>
                    <button
                      onClick={handleSkip}
                      className="rounded-2xl bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-300 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700/70"
                    >
                      Skip question
                    </button>
                  </div>
                </div>
                {sequentialSuggestions.length > 0 && (
                  <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-3 text-xs dark:border-slate-700/60 dark:bg-slate-900/60">
                    <p className="font-semibold text-slate-600 dark:text-slate-200">Upcoming</p>
                    <ul className="mt-2 space-y-1">
                      {sequentialSuggestions.map((item) => (
                        <li key={item.question.id}>
                          <button
                            type="button"
                            onClick={() =>
                              handleJumpToQuestion({
                                sectionId: item.section.id,
                                questionId: item.question.id
                              })
                            }
                            className="flex w-full items-center justify-between rounded-2xl px-2 py-1 text-left text-slate-500 transition hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-slate-400 dark:hover:bg-slate-800/60"
                          >
                            <span>
                              <span className="font-semibold text-indigo-500 dark:text-indigo-200">{item.section.title}</span> → {item.question.label}
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-200">
                              Jump
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3 text-center">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Call complete</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Every scripted question is captured. Review the history below or restart the session.
                </p>
                <button
                  onClick={handleRestart}
                  className="rounded-2xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-600"
                >
                  Restart
                </button>
              </div>
            )}
            <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-3 text-xs dark:border-slate-700/60 dark:bg-slate-900/60">
              <p className="font-semibold text-slate-600 dark:text-slate-200">Jump around</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Pick any question if the conversation goes off-script.
              </p>
              <div className="mt-2">
                <label className="sr-only" htmlFor="call-question-picker">
                  Choose a question to jump to
                </label>
                <select
                  id="call-question-picker"
                  value={manualSelection}
                  onChange={(event) => handleManualSelect(event.target.value)}
                  className="w-full rounded-2xl border border-indigo-300/40 bg-white/80 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/60 dark:bg-slate-900/60"
                >
                  <option value="">Choose a question…</option>
                  {manualOptions.map(({ section, questions }) => (
                    <optgroup key={section.id} label={section.title}>
                      {questions.map(({ question, answered }) => (
                        <option key={question.id} value={`${section.id}|${question.id}`}>
                          {question.label}
                          {answered ? ' • answered' : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-3 text-xs dark:border-slate-700/60 dark:bg-slate-900/60">
              <p className="font-semibold text-slate-600 dark:text-slate-200">Freeform capture</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Drop unscripted insights or moments directly onto the canvas.
              </p>
              <div className="mt-3 space-y-2">
                <input
                  value={freeformTitle}
                  onChange={(event) => setFreeformTitle(event.target.value)}
                  placeholder="Title (optional)"
                  className="w-full rounded-2xl border border-indigo-300/40 bg-white/80 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/60 dark:bg-slate-900/60"
                />
                <textarea
                  value={freeformNotes}
                  onChange={(event) => setFreeformNotes(event.target.value)}
                  rows={3}
                  placeholder="Capture the unexpected…"
                  className="w-full rounded-2xl border border-indigo-300/40 bg-white/80 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/60 dark:bg-slate-900/60"
                />
                <input
                  value={freeformTagsInput}
                  onChange={(event) => setFreeformTagsInput(event.target.value)}
                  placeholder="Tags (comma separated)"
                  className="w-full rounded-2xl border border-indigo-300/40 bg-white/80 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/60 dark:bg-slate-900/60"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleFreeformSubmit}
                  disabled={!canSaveFreeform}
                  className={`rounded-2xl px-4 py-2 text-xs font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    canSaveFreeform
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500'
                  }`}
                >
                  Save freeform note
                </button>
              </div>
            </div>
          </section>
          <section className="glass-panel max-h-[70vh] overflow-y-auto p-4">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Call history
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">{history.length} entries</span>
            </header>
            {history.length === 0 ? (
              <p className="rounded-2xl bg-slate-100/60 p-3 text-xs text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                Answers and skipped prompts will appear here as you move through the script.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {history
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-3xl border border-slate-200/60 bg-white/80 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-indigo-500">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                            {entry.questionLabel}
                          </p>
                        </div>
                        {entry.type === 'question' ? (
                          entry.skipped ? (
                            <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                              Skipped
                            </span>
                          ) : (
                            <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-200">
                              Captured
                            </span>
                          )
                        ) : (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                            Freeform
                          </span>
                        )}
                      </div>
                      {entry.type === 'question' && entry.variantText && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Prompt: {personalizeAgentText(entry.variantText, agentName)}
                        </p>
                      )}
                      {entry.type === 'question' && !entry.skipped && entry.answer && (
                        <p className="mt-2 rounded-2xl bg-indigo-500/5 p-2 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                          {entry.answer}
                        </p>
                      )}
                      {entry.type === 'freeform' && entry.answer && (
                        <p className="mt-2 rounded-2xl bg-emerald-500/5 p-2 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                          {entry.answer}
                        </p>
                      )}
                      {entry.type === 'question' && entry.fields && entry.fields.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                          {entry.fields.map((field) => (
                            <p key={field.id}>
                              <span className="font-semibold text-slate-600 dark:text-slate-200">{field.label}:</span>{' '}
                              {formatFieldValue(field)}
                            </p>
                          ))}
                        </div>
                      )}
                      {entry.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-indigo-500 dark:text-indigo-200">
                          {entry.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-indigo-500/10 px-2 py-0.5">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
