import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { StoreContext } from '../App'
import CanvasBoard from '../components/CanvasBoard'
import Toolbar from '../components/Toolbar'
import ScriptPanel from '../components/ScriptPanel'
import PersonalBullets from '../components/PersonalBullets'
import ObjectionsLog from '../components/ObjectionsLog'
import HelpShortcuts from '../components/HelpShortcuts'
import ImportDialog from '../components/ImportDialog'
import { useUndoRedo } from '../hooks/useUndoRedo'
import {
  Card,
  Canvas as CanvasType,
  ScriptQuestion,
  QuestionVariant
} from '../lib/storage'
import {
  DEFAULT_CARD_HEIGHT,
  DEFAULT_CARD_WIDTH,
  getNextCardPosition,
  snapPointToGrid,
  toPlacementRects
} from '../lib/canvasLayout'
import { createId } from '../lib/id'
import CallModePanel from '../components/CallModePanel'
import { SummarizeButton } from '../components/SummarizeButton'
import { createQuestionCard } from '../lib/questions'
import CanvasChatSidebar from '../components/CanvasChatSidebar'
import { getCanvasPlainText } from '../lib/canvasText'

export default function CanvasRoute() {
  const { projectId, canvasId } = useParams()
  const store = useContext(StoreContext)!
  const location = useLocation()
  const navigate = useNavigate()
  const project = store.projects.find((p) => p.id === projectId)
  const canvas = project?.canvases.find((c) => c.id === canvasId)
  const { value, set, replace, undo, redo } = useUndoRedo<CanvasType | undefined>(canvas)
  const [importOpen, setImportOpen] = useState(false)
  const [callModeOpen, setCallModeOpen] = useState(false)
  const [chatVisible, setChatVisible] = useState(true)

  useEffect(() => {
    if (canvas) {
      replace(canvas)
    }
  }, [canvas?.id])

  useEffect(() => {
    if (location.state && (location.state as any).callMode) {
      setCallModeOpen(true)
      navigate('.', { replace: true, state: {} })
    }
  }, [location.state, navigate])

  if (!project || !canvas) {
    return (
      <div className="glass-panel mx-auto mt-12 max-w-lg space-y-4 p-8 text-center">
        <p className="text-lg font-semibold text-slate-600 dark:text-slate-200">Canvas not found.</p>
        <Link to={`/workspace/project/${projectId}`} className="rounded-2xl bg-indigo-500/10 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-200">
          Back to project
        </Link>
      </div>
    )
  }

  const workingCanvas = value ?? canvas

  const canvasText = useMemo(() => {
    return getCanvasPlainText(workingCanvas)
  }, [workingCanvas])

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
    const position = getNextCardPosition(
      { w: DEFAULT_CARD_WIDTH, h: DEFAULT_CARD_HEIGHT },
      toPlacementRects(workingCanvas.cards)
    )
    const base = {
      id: createId('card'),
      title: 'New card',
      content: '',
      tags: [],
      pinned: false,
      locked: false,
      color: '#f8fafc',
      priority: 'medium' as const,
      x: position.x,
      y: position.y,
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

  const handleCaptureAnswer = (question: ScriptQuestion, variant: QuestionVariant) => {
    const position = getNextCardPosition(
      { w: DEFAULT_CARD_WIDTH, h: DEFAULT_CARD_HEIGHT },
      toPlacementRects(workingCanvas.cards)
    )
    const card: Card = createQuestionCard({ question, variant, position })
    updateCanvas({ ...workingCanvas, cards: [card, ...workingCanvas.cards] })
  }

  const handleSummaryResult = (summary: string) => {
    const now = new Date().toISOString()
    const position = getNextCardPosition(
      { w: DEFAULT_CARD_WIDTH, h: DEFAULT_CARD_HEIGHT },
      toPlacementRects(workingCanvas.cards)
    )
    const summaryCard: Card = {
      id: createId('card'),
      type: 'text',
      title: 'AI Summary',
      content: summary,
      tags: ['ai', 'summary'],
      pinned: false,
      locked: false,
      color: '#f8fafc',
      priority: 'medium',
      x: position.x,
      y: position.y,
      createdAt: now,
      updatedAt: now,
      markdown: false
    }
    updateCanvas({ ...workingCanvas, cards: [summaryCard, ...workingCanvas.cards] })
  }

  const showChatSidebar = !callModeOpen && chatVisible

  return (
    <div className="relative">
      <div className="space-y-6">
        <Toolbar
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExportJson={() => store.exportProject(project.id, 'json')}
          onExportText={() => store.exportProject(project.id, 'text')}
          onImport={() => setImportOpen(true)}
          onToggleCallMode={() => setCallModeOpen((prev) => !prev)}
          callModeActive={callModeOpen}
        />
        {callModeOpen ? (
          <CallModePanel
            project={project}
            canvas={workingCanvas}
            onCanvasChange={updateCanvas}
            onCardChange={updateCard}
            onCardDelete={deleteCard}
            onClose={() => setCallModeOpen(false)}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start lg:min-h-[calc(100vh-8rem)]">
            <div className="flex flex-col gap-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-4">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => addCard('sticky')} className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200">New sticky</button>
                <button onClick={() => addCard('checklist')} className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200">Checklist</button>
                <button onClick={() => addCard('question')} className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200">Question</button>
                <button onClick={() => addCard('media')} className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200">Media</button>
                <button onClick={() => addCard('text')} className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200">Text</button>
              </div>
              <div className="rounded-3xl border border-indigo-200/60 bg-white/70 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <SummarizeButton text={canvasText} onResult={handleSummaryResult} />
              </div>
              <div className="min-h-[60vh]">
                <CanvasBoard
                  canvas={workingCanvas}
                  onChange={updateCanvas}
                  onCardChange={updateCard}
                  onCardDelete={deleteCard}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <ObjectionsLog cards={workingCanvas.cards} />
              </div>
            </div>
            <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2" role="complementary" aria-label="Guided conversation tools">
              <ScriptPanel project={project} onCaptureAnswer={handleCaptureAnswer} />
              <PersonalBullets bullets={project.personalBullets} />
              <HelpShortcuts />
            </aside>
          </div>
        )}
        <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />
      </div>
      {showChatSidebar && (
        <CanvasChatSidebar
          canvas={workingCanvas}
          canvasId={canvas.id}
          onClose={() => setChatVisible(false)}
        />
      )}
      {!callModeOpen && !chatVisible && (
        <button
          type="button"
          className="fixed bottom-4 right-4 z-20 rounded-2xl bg-indigo-500/80 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur"
          onClick={() => setChatVisible(true)}
        >
          Open canvas AI chat
        </button>
      )}
    </div>
  )
}
