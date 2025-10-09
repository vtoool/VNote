import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
  toPlacementRect,
  toPlacementRects
} from '../lib/canvasLayout'
import { createId } from '../lib/id'
import CallModePanel from '../components/CallModePanel'
import { SummarizeButton } from '../components/SummarizeButton'
import { createQuestionCard } from '../lib/questions'
import {
  ImagePasteContext,
  blobToDataUrl,
  clampImageDimensions,
  getImageDimensions,
  installImagePasteHandler
} from '../lib/imagePaste'
import { createMediaCard } from '../lib/storage'
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
  const [clipboardToast, setClipboardToast] = useState<{
    id: number
    message: string
    tone: 'success' | 'error'
  } | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)
  const pointerPositionRef = useRef<{ x: number; y: number } | null>(null)

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
  const workingCanvasRef = useRef<CanvasType>(workingCanvas)

  useEffect(() => {
    workingCanvasRef.current = workingCanvas
  }, [workingCanvas])

  const canvasText = useMemo(() => {
    return getCanvasPlainText(workingCanvas)
  }, [workingCanvas])

  const updateCanvas = (next: CanvasType) => {
    set(next)
    store.updateCanvas(project.id, canvas.id, () => ({ ...next, updatedAt: new Date().toISOString() }))
  }

  const updateCanvasRef = useRef(updateCanvas)

  useEffect(() => {
    updateCanvasRef.current = updateCanvas
  }, [updateCanvas])

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

  const showClipboardToast = useCallback((message: string, tone: 'success' | 'error') => {
    setClipboardToast({ id: Date.now(), message, tone })
  }, [])

  useEffect(() => {
    if (!clipboardToast) return
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current)
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setClipboardToast((current) => (current && current.id === clipboardToast.id ? null : current))
    }, 2400)
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [clipboardToast])

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const resolveTargetCardId = useCallback((event: ClipboardEvent) => {
    const fromEvent = (event.target as HTMLElement | null)?.closest('[data-card-root="true"]')
    const fromActive = (document.activeElement as HTMLElement | null)?.closest('[data-card-root="true"]')
    const host = fromEvent ?? fromActive
    if (!host) return null
    return host.getAttribute('data-card-type') === 'media' ? host.getAttribute('data-card-id') : null
  }, [])

  const shouldHandleClipboardEvent = useCallback(
    (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      const active = document.activeElement as HTMLElement | null
      const withinSurface = (node: HTMLElement | null) => Boolean(node?.closest('[data-canvas-surface="true"]'))
      return withinSurface(target) || withinSurface(active) || Boolean(pointerPositionRef.current)
    },
    []
  )

  const handlePastedImages = useCallback(
    async (blobs: Blob[], context: ImagePasteContext) => {
      const currentCanvas = workingCanvasRef.current
      if (!currentCanvas) return

      let cards = [...currentCanvas.cards]
      let placementRects = toPlacementRects(cards)
      let pointerAvailable = Boolean(context.at)
      let usedExistingCard = false
      const newCards: Card[] = []

      for (const [index, blob] of blobs.entries()) {
        const dataUrl = await blobToDataUrl(blob)
        const { width: intrinsicWidth, height: intrinsicHeight } = await getImageDimensions(blob)
        const { width, height } = clampImageDimensions(intrinsicWidth, intrinsicHeight)

        if (!usedExistingCard && context.targetCardId) {
          const targetIndex = cards.findIndex((card) => card.id === context.targetCardId && card.type === 'media')
          if (targetIndex !== -1) {
            const targetCard = cards[targetIndex] as Card & { type: 'media' }
            const updatedCard: Card = {
              ...targetCard,
              dataUrl,
              width,
              height,
              updatedAt: new Date().toISOString()
            }
            cards = cards.map((card, i) => (i === targetIndex ? updatedCard : card))
            placementRects = toPlacementRects(cards)
            usedExistingCard = true
            continue
          }
        }

        let position: { x: number; y: number } | null = null
        if (pointerAvailable && context.at) {
          const snapped = snapPointToGrid(context.at)
          const occupied = cards.some((card) => {
            const snappedExisting = snapPointToGrid({ x: card.x, y: card.y })
            return snappedExisting.x === snapped.x && snappedExisting.y === snapped.y
          })
          if (!occupied) {
            position = snapped
          }
          pointerAvailable = false
        }

        if (!position) {
          position = getNextCardPosition({ w: width, h: height }, placementRects)
        }

        const mediaCard = createMediaCard({
          dataUrl,
          position,
          width,
          height,
          title: blobs.length > 1 ? `Pasted image ${index + 1}` : 'Pasted image'
        })
        cards = [mediaCard, ...cards]
        placementRects = [toPlacementRect(mediaCard), ...placementRects]
        newCards.push(mediaCard)
      }

      if (usedExistingCard || newCards.length > 0) {
        const nextCanvas = {
          ...currentCanvas,
          cards,
          updatedAt: new Date().toISOString()
        }
        updateCanvasRef.current(nextCanvas)
        const totalImages = newCards.length + (usedExistingCard ? 1 : 0)
        const message = totalImages > 1 ? `Pasted ${totalImages} images` : 'Image pasted'
        showClipboardToast(message, 'success')
      }
    },
    [showClipboardToast]
  )

  useEffect(() => {
    const remove = installImagePasteHandler({
      getCanvasPos: () => pointerPositionRef.current,
      resolveTargetCardId,
      shouldHandleEvent: shouldHandleClipboardEvent,
      onImages: handlePastedImages,
      onNoImage: (event) => {
        if (shouldHandleClipboardEvent(event)) {
          showClipboardToast('Clipboard has no image', 'error')
        }
      },
      onError: () => {
        showClipboardToast('Unable to access clipboard image', 'error')
      }
    })
    return remove
  }, [handlePastedImages, resolveTargetCardId, shouldHandleClipboardEvent, showClipboardToast])

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
            onPointerPositionChange={(position) => {
              pointerPositionRef.current = position
            }}
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
                  onPointerPositionChange={(position) => {
                    pointerPositionRef.current = position
                  }}
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
      {clipboardToast && (
        <div className="pointer-events-none fixed right-6 top-28 z-40">
          <div
            className={`glass-panel px-4 py-2 text-sm font-medium ${
              clipboardToast.tone === 'error'
                ? 'text-rose-600 dark:text-rose-300'
                : 'text-slate-700 dark:text-slate-100'
            }`}
          >
            {clipboardToast.message}
          </div>
        </div>
      )}
    </div>
  )
}
