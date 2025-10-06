import { useState } from 'react'
import { Card } from '../lib/storage'
import { createId } from '../lib/id'

interface CardProps {
  card: Card
  onChange: (card: Card) => void
  onDelete: () => void
}

const quickTags = ['pain', 'impact', 'req', 'objection', 'next']

export default function CardComponent({ card, onChange, onDelete }: CardProps) {
  const [editingTitle, setEditingTitle] = useState(false)

  const baseClasses = 'h-full w-full rounded-3xl border border-white/70 bg-white/90 p-4 text-sm shadow-soft dark:border-slate-800/70 dark:bg-slate-900/80'

  const toggleTag = (tag: string) => {
    const tags = card.tags.includes(tag) ? card.tags.filter((t) => t !== tag) : [...card.tags, tag]
    onChange({ ...card, tags, updatedAt: new Date().toISOString() })
  }

  return (
    <div className={baseClasses}>
      <div className="mb-2 flex items-start justify-between">
        {editingTitle ? (
          <input
            value={card.title}
            onChange={(event) => onChange({ ...card, title: event.target.value, updatedAt: new Date().toISOString() })}
            onBlur={() => setEditingTitle(false)}
            autoFocus
            disabled={card.locked}
            className="w-full rounded-2xl border border-indigo-300/50 bg-white/70 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        ) : (
          <button
            onClick={() => !card.locked && setEditingTitle(true)}
            className="text-left text-base font-semibold text-slate-700 dark:text-slate-100"
          >
            {card.title || 'Untitled'}
          </button>
        )}
        <div className="flex gap-2 text-xs text-slate-500">
          <button onClick={() => onChange({ ...card, pinned: !card.pinned, updatedAt: new Date().toISOString() })}>{card.pinned ? '📌' : '📍'}</button>
          <button onClick={() => onChange({ ...card, locked: !card.locked, updatedAt: new Date().toISOString() })}>{card.locked ? '🔒' : '🔓'}</button>
          <button onClick={onDelete}>✖</button>
        </div>
      </div>

      <textarea
        value={card.content}
        onChange={(event) => onChange({ ...card, content: event.target.value, updatedAt: new Date().toISOString() })}
        disabled={card.locked}
        className="h-24 w-full rounded-2xl border border-transparent bg-slate-100/50 p-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800/60"
      />

      {card.type === 'checklist' && (
        <ul className="mt-3 space-y-2">
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
          <li>
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
          </li>
        </ul>
      )}

      {card.type === 'question' && (
        <div className="mt-3 space-y-2 text-xs">
          <input
            value={card.answer}
            onChange={(event) => onChange({ ...card, answer: event.target.value, updatedAt: new Date().toISOString() })}
            placeholder="Capture the answer here"
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

      {card.type === 'media' && (
        <div className="mt-3 space-y-2 text-xs">
          <input
            type="file"
            accept="image/*"
            disabled={card.locked}
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => {
                onChange({ ...card, dataUrl: reader.result as string, updatedAt: new Date().toISOString() })
              }
              reader.readAsDataURL(file)
            }}
          />
          {card.dataUrl && (
            <img src={card.dataUrl} alt={card.description} className="w-full rounded-2xl object-cover" />
          )}
          <input
            value={card.description}
            onChange={(event) => onChange({ ...card, description: event.target.value, updatedAt: new Date().toISOString() })}
            placeholder="Describe the media"
            disabled={card.locked}
            className="w-full rounded-2xl border border-transparent bg-white/70 px-2 py-1 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-slate-800/60"
          />
        </div>
      )}
    </div>
  )
}
