import { useContext, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StoreContext } from '../App'
import CanvasBoard from '../components/CanvasBoard'
import Toolbar from '../components/Toolbar'
import ScriptPanel from '../components/ScriptPanel'
import PersonalBullets from '../components/PersonalBullets'
import ObjectionsLog from '../components/ObjectionsLog'
import MutualActionPlan from '../components/MutualActionPlan'
import HelpShortcuts from '../components/HelpShortcuts'
import ImportDialog from '../components/ImportDialog'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { Card, Canvas as CanvasType } from '../lib/storage'
import { createId } from '../lib/id'

export default function CanvasRoute() {
  const { projectId, canvasId } = useParams()
  const store = useContext(StoreContext)!
  const project = store.projects.find((p) => p.id === projectId)
  const canvas = project?.canvases.find((c) => c.id === canvasId)
  const { value, set, replace, undo, redo } = useUndoRedo<CanvasType | undefined>(canvas)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    if (canvas) {
      replace(canvas)
    }
  }, [canvas?.id])

  if (!project || !canvas) {
    return (
      <div className="glass-panel mx-auto mt-12 max-w-lg space-y-4 p-8 text-center">
        <p className="text-lg font-semibold text-slate-600 dark:text-slate-200">Canvas not found.</p>
        <Link to={`/project/${projectId}`} className="rounded-2xl bg-indigo-500/10 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-200">
          Back to project
        </Link>
      </div>
    )
  }

  const workingCanvas = value ?? canvas

  const updateCanvas = (next: CanvasType) => {
    set(next)
    store.updateCanvas(project.id, canvas.id, () => ({ ...next, updatedAt: new Date().toISOString() }))
  }

  const handleUndo = () => {
    const previous = undo()
    if (previous) {
      store.updateCanvas(project.id, canvas.id, () => ({ ...previous, updatedAt: new Date().toISOString() }))
    }
  }

  const handleRedo = () => {
    const next = redo()
    if (next) {
      store.updateCanvas(project.id, canvas.id, () => ({ ...next, updatedAt: new Date().toISOString() }))
    }
  }

  const updateCard = (updated: Card) => {
    const next = {
      ...workingCanvas,
      cards: workingCanvas.cards.map((card) => (card.id === updated.id ? updated : card))
    }
    updateCanvas(next)
  }

  const deleteCard = (cardId: string) => {
    const next = {
      ...workingCanvas,
      cards: workingCanvas.cards.filter((card) => card.id !== cardId)
    }
    updateCanvas(next)
  }

  const addCard = (type: Card['type']) => {
    const now = new Date().toISOString()
    const base = {
      id: createId('card'),
      title: 'New card',
      content: '',
      tags: [],
      pinned: false,
      locked: false,
      color: '#f8fafc',
      priority: 'medium' as const,
      x: Math.random() * 160,
      y: Math.random() * 160,
      width: 240,
      height: 200,
      createdAt: now,
      updatedAt: now
    }
    let card: Card
    switch (type) {
      case 'checklist':
        card = { ...base, type: 'checklist', checklist: [] }
        break
      case 'question':
        card = { ...base, type: 'question', answer: '', tags: ['question'], variants: [] }
        break
      case 'media':
        card = { ...base, type: 'media', dataUrl: null, description: '' }
        break
      case 'text':
        card = { ...base, type: 'text', markdown: true }
        break
      default:
        card = { ...base, type: 'sticky' }
    }
    updateCanvas({ ...workingCanvas, cards: [card, ...workingCanvas.cards] })
  }

  const handleImport = (json: string) => {
    const imported = JSON.parse(json) as CanvasType
    const normalized = { ...imported, id: canvas.id }
    replace(normalized)
    store.updateProject(project.id, (proj) => ({
      ...proj,
      canvases: proj.canvases.map((c) => (c.id === canvas.id ? normalized : c))
    }))
  }

  const handleCaptureAnswer = (_questionId: string, variantText: string) => {
    const now = new Date().toISOString()
    const card: Card = {
      id: createId('card'),
      type: 'question',
      title: variantText.slice(0, 48),
      content: variantText,
      answer: '',
      variants: [],
      tags: ['question'],
      pinned: false,
      locked: false,
      color: '#e0e7ff',
      priority: 'medium',
      x: Math.random() * 120,
      y: Math.random() * 120,
      width: 260,
      height: 200,
      createdAt: now,
      updatedAt: now
    }
    updateCanvas({ ...workingCanvas, cards: [card, ...workingCanvas.cards] })
  }

  return (
    <div className="space-y-6">
      <Toolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExportJson={() => store.exportProject(project.id, 'json')}
        onExportText={() => store.exportProject(project.id, 'text')}
        onImport={() => setImportOpen(true)}
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => addCard('sticky')} className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200">New sticky</button>
            <button onClick={() => addCard('checklist')} className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200">Checklist</button>
            <button onClick={() => addCard('question')} className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200">Question</button>
            <button onClick={() => addCard('media')} className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200">Media</button>
            <button onClick={() => addCard('text')} className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200">Text</button>
          </div>
          <CanvasBoard
            canvas={workingCanvas}
            onChange={updateCanvas}
            onCardChange={updateCard}
            onCardDelete={deleteCard}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <ObjectionsLog cards={workingCanvas.cards} />
            <MutualActionPlan onExport={(items) => {
              const lines = items.map((item) => `${item.owner}: ${item.action} (${item.due})`).join('\n')
              const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `${project.name}-mutual-action-plan.txt`
              link.click()
              URL.revokeObjectURL(url)
            }} />
          </div>
        </div>
        <div className="space-y-4">
          <ScriptPanel project={project} onCaptureAnswer={handleCaptureAnswer} />
          <PersonalBullets bullets={project.personalBullets} />
          <HelpShortcuts />
        </div>
      </div>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />
    </div>
  )
}
