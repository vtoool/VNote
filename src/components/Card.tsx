import { useContext, useEffect, useRef, useState } from 'react'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { Card, QuestionFieldState } from '../lib/storage'
import { createId } from '../lib/id'
import { quickTags } from '../lib/tags'
import { StoreContext } from '../App'
import { personalizeAgentText } from '../lib/personalization'

interface CardProps {
  card: Card
  onChange: (card: Card) => void
  onDelete: () => void
}

export default function CardComponent({ card, onChange, onDelete }: CardProps) {
  const store = useContext(StoreContext)!
  const agentName = store.settings.agentName
  const personalizedContent = personalizeAgentText(card.content, agentName)
  const showPersonalizedPreview = personalizedContent !== card.content
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(card.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const isMediaCard = card.type === 'media'
  const baseClasses = `${
    isMediaCard
      ? 'flex w-auto min-w-[16rem] max-w-[28rem] flex-col overflow-hidden'
      : 'flex max-h-[28rem] w-auto min-w-[16rem] max-w-[28rem] flex-col overflow-hidden'
  } border border-white/70 bg-white/90 p-4 text-sm shadow-soft dark:border-slate-800/70 dark:bg-slate-900/80`

  useEffect(() => {
    setTitleDraft(card.title)
  }, [card.title])

  useEffect(() => {
    if (editingTitle) {
      requestAnimationFrame(() => {
        titleInputRef.current?.focus()
        titleInputRef.current?.select()
      })
    }
  }, [editingTitle])

  const commitTitle = () => {
    const nextTitle = titleDraft.trim() || 'Untitled'
    if (nextTitle !== card.title) {
      onChange({ ...card, title: nextTitle, updatedAt: new Date().toISOString() })
    }
    setEditingTitle(false)
  }

  const toggleTag = (tag: string) => {
    const tags = card.tags.includes(tag) ? card.tags.filter((t) => t !== tag) : [...card.tags, tag]
    onChange({ ...card, tags, updatedAt: new Date().toISOString() })
  }

  const updateField = (fieldId: string, value: QuestionFieldState['value']) => {
    if (card.type !== 'question' || !card.fields) return
    const fields = card.fields.map((field) =>
      field.id === fieldId ? { ...field, value } : field
    )
    onChange({ ...card, fields, updatedAt: new Date().toISOString() })
  }

  const renderField = (field: QuestionFieldState) => {
    if (card.locked) {
      return (
        <div key={field.id} className="space-y-1">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-200">{field.label}</p>
          <p className="rounded-2xl bg-slate-100/60 p-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            {formatFieldValue(field)}
          </p>
        </div>
      )
    }

    switch (field.type) {
      case 'checkbox':
        return (
          <label key={field.id} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-200">
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
              onChange={(event) => updateField(field.id, event.target.value === '' ? null : Number(event.target.value))}
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
      case 'currency':
      case 'email':
      case 'phone':
      case 'shortText':
      default:
        return (
          <div key={field.id} className="space-y-1 text-xs">
            <label className="font-semibold text-slate-600 dark:text-slate-200" htmlFor={field.id}>
              {field.label}
            </label>
            <input
              id={field.id}
              type={
                field.type === 'currency'
                  ? 'text'
                  : field.type === 'shortText'
                    ? 'text'
                    : field.type === 'phone'
                      ? 'tel'
                      : field.type
              }
              value={typeof field.value === 'string' ? field.value : ''}
              onChange={(event) => updateField(field.id, event.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-2xl border border-indigo-300/40 bg-white/80 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/60"
            />
          </div>
        )
    }
  }

  const formatFieldValue = (field: QuestionFieldState) => {
    if (Array.isArray(field.value)) {
      return field.value.join(', ') || '—'
    }
    if (typeof field.value === 'boolean') {
      return field.value ? 'Yes' : 'No'
    }
    if (typeof field.value === 'number') {
      return Number.isFinite(field.value) ? field.value.toString() : '—'
    }
    return field.value ? String(field.value) : '—'
  }

  return (
    <div className={baseClasses} data-card-root="true">
      <div className="mb-2 flex items-start justify-between gap-2">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitTitle()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                setTitleDraft(card.title)
                setEditingTitle(false)
              }
            }}
            disabled={card.locked}
            aria-label="Card title"
            className="w-full rounded-2xl border border-indigo-300/50 bg-white/70 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onDoubleClick={() => !card.locked && setEditingTitle(true)}
              title="Double-click to rename"
              className="text-left text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white dark:text-slate-100"
            >
              {card.title || 'Untitled'}
            </button>
            <button
              type="button"
              onClick={() => !card.locked && setEditingTitle(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 transition hover:bg-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-indigo-200"
              aria-label="Edit card title"
            >
              <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => onChange({ ...card, pinned: !card.pinned, updatedAt: new Date().toISOString() })}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-base transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-800/60"
            aria-pressed={card.pinned}
            aria-label={card.pinned ? 'Unpin card' : 'Pin card'}
          >
            {card.pinned ? '📌' : '📍'}
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...card, locked: !card.locked, updatedAt: new Date().toISOString() })}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-base transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-800/60"
            aria-pressed={card.locked}
            aria-label={card.locked ? 'Unlock card' : 'Lock card'}
          >
            {card.locked ? '🔒' : '🔓'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-base text-rose-600 transition hover:bg-rose-500/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Delete card"
          >
            ✖
          </button>
        </div>
      </div>

      {isMediaCard ? (
        <div className="mt-3">
          {card.dataUrl ? (
            <figure className="overflow-hidden rounded-2xl bg-white/60 shadow-inner">
              <img
                src={card.dataUrl}
                alt={card.description || card.title || 'Media image'}
                className="block h-full w-full object-contain"
              />
            </figure>
          ) : (
            <div className="space-y-2 text-xs">
              <input
                type="file"
                accept="image/*"
                disabled={card.locked}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    onChange({ ...card, dataUrl: reader.result as string, updatedAt: new Date().toISOString() })
                  }
                  reader.readAsDataURL(file)
                }}
                className="w-full rounded-2xl border border-dashed border-indigo-300/60 bg-white/70 px-3 py-12 text-center font-medium text-indigo-600 transition hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <p className="text-center text-slate-500">Upload an image to display it here.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 flex-1 overflow-y-auto pr-1" style={{ touchAction: 'pan-y' }}>
          <div className="space-y-3">
            {showPersonalizedPreview && (
              <div className="rounded-2xl bg-indigo-500/10 px-3 py-2 text-xs text-indigo-600 dark:bg-slate-900/60 dark:text-indigo-200">
                <p className="font-semibold">Personalized preview</p>
                <p>{personalizedContent}</p>
              </div>
            )}
            <textarea
              value={card.content}
              onChange={(event) => onChange({ ...card, content: event.target.value, updatedAt: new Date().toISOString() })}
              disabled={card.locked}
              className="min-h-[6rem] w-full resize-y rounded-2xl border border-transparent bg-slate-100/50 p-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800/60"
            />

            {card.type === 'checklist' && (
            <div className="space-y-2">
              <ul className="space-y-2">
                {card.checklist.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(event) => {
                        const next = card.checklist.map((entry) =>
                          entry.id === item.id ? { ...entry, completed: event.target.checked } : entry
                        )
                        onChange({ ...card, checklist: next, updatedAt: new Date().toISOString() })
                      }}
                      className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                    />
                    <input
                      value={item.text}
                      onChange={(event) => {
                        const next = card.checklist.map((entry) =>
                          entry.id === item.id ? { ...entry, text: event.target.value } : entry
                        )
                        onChange({ ...card, checklist: next, updatedAt: new Date().toISOString() })
                      }}
                      disabled={card.locked}
                      className="flex-1 rounded-2xl border border-transparent bg-white/70 px-2 py-1 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800/60"
                    />
                  </li>
                ))}
              </ul>
              <button
                onClick={() =>
                  onChange({
                    ...card,
                    checklist: [...card.checklist, { id: createId('item'), text: 'New item', completed: false }],
                    updatedAt: new Date().toISOString()
                  })
                }
                className="rounded-2xl bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200"
              >
                Add item
              </button>
            </div>
          )}

          {card.type === 'question' && (
            <div className="space-y-3 text-xs">
              {card.fields?.length ? (
                <div className="space-y-3">
                  {card.fields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      {renderField(field)}
                      {field.description && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              <input
                value={card.answer}
                onChange={(event) => onChange({ ...card, answer: event.target.value, updatedAt: new Date().toISOString() })}
                placeholder="Add quick summary / headline"
                disabled={card.locked}
                className="w-full rounded-2xl border border-indigo-300/40 bg-indigo-500/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-slate-500">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-2 py-1 ${card.tags.includes(tag) ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
