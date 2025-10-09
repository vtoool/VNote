import { useCallback, useEffect, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import { motion } from 'framer-motion'
import { Card, Canvas } from '../lib/storage'
import { DEFAULT_CARD_HEIGHT, DEFAULT_CARD_WIDTH, GRID_SPACING, snapPointToGrid } from '../lib/canvasLayout'
import CardComponent from './Card'

const MIN_ZOOM = 0.4
const MAX_ZOOM = 1.6
const GRID_PADDING_SCALE = 3

interface CanvasBoardProps {
  canvas: Canvas
  onChange: (canvas: Canvas) => void
  onCardChange: (card: Card) => void
  onCardDelete: (cardId: string) => void
  onPointerPositionChange?: (position: { x: number; y: number } | null) => void
}

export default function CanvasBoard({
  canvas,
  onChange,
  onCardChange,
  onCardDelete,
  onPointerPositionChange
}: CanvasBoardProps) {
  const [showGrid, setShowGrid] = useState(true)
  const [isPanning, setIsPanning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerStateRef = useRef<{
    originX: number
    originY: number
    canvasX: number
    canvasY: number
  } | null>(null)
  const latestCanvasRef = useRef(canvas)
  const onChangeRef = useRef(onChange)
  const pointerCallbackRef = useRef(onPointerPositionChange)

  useEffect(() => {
    latestCanvasRef.current = canvas
  }, [canvas])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    pointerCallbackRef.current = onPointerPositionChange
  }, [onPointerPositionChange])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const notifyPointerPosition = (event: PointerEvent, positionOverride?: { x: number; y: number }) => {
      if (!pointerCallbackRef.current) return
      const rect = container.getBoundingClientRect()
      const { zoom } = latestCanvasRef.current
      const position = positionOverride ?? latestCanvasRef.current.position
      const canvasPoint = {
        x: (event.clientX - rect.left - position.x) / zoom,
        y: (event.clientY - rect.top - position.y) / zoom
      }
      pointerCallbackRef.current(canvasPoint)
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType !== 'touch') return
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-card-root="true"]')) {
        return
      }
      event.preventDefault()
      notifyPointerPosition(event)
      pointerStateRef.current = {
        originX: event.clientX,
        originY: event.clientY,
        canvasX: latestCanvasRef.current.position.x,
        canvasY: latestCanvasRef.current.position.y
      }
      setIsPanning(true)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerStateRef.current) return
      event.preventDefault()
      const { originX, originY, canvasX, canvasY } = pointerStateRef.current
      const nextPosition = {
        x: canvasX + (event.clientX - originX),
        y: canvasY + (event.clientY - originY)
      }
      onChangeRef.current({ ...latestCanvasRef.current, position: nextPosition })
      notifyPointerPosition(event, nextPosition)
    }

    const endPan = () => {
      if (!pointerStateRef.current) return
      pointerStateRef.current = null
      setIsPanning(false)
    }

    container.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', endPan)
    window.addEventListener('pointercancel', endPan)

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', endPan)
      window.removeEventListener('pointercancel', endPan)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerCallbackRef.current) return
      const rect = container.getBoundingClientRect()
      const { zoom, position } = latestCanvasRef.current
      const canvasPoint = {
        x: (event.clientX - rect.left - position.x) / zoom,
        y: (event.clientY - rect.top - position.y) / zoom
      }
      pointerCallbackRef.current(canvasPoint)
    }

    const handlePointerLeave = () => {
      pointerCallbackRef.current?.(null)
    }

    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  const handleWheel = useCallback((event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      return
    }

    const container = containerRef.current
    if (!container) return

    event.preventDefault()
    const zoomIntensity = 0.0015
    const current = latestCanvasRef.current
    const nextZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, current.zoom * Math.exp(-event.deltaY * zoomIntensity))
    )

    if (nextZoom === current.zoom) return

    const rect = container.getBoundingClientRect()
    const canvasPoint = {
      x: (event.clientX - rect.left - current.position.x) / current.zoom,
      y: (event.clientY - rect.top - current.position.y) / current.zoom
    }

    const nextPosition = {
      x: event.clientX - rect.left - canvasPoint.x * nextZoom,
      y: event.clientY - rect.top - canvasPoint.y * nextZoom
    }

    onChangeRef.current({
      ...current,
      zoom: nextZoom,
      position: nextPosition
    })

    pointerCallbackRef.current?.(canvasPoint)
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      node.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  return (
    <div
      ref={containerRef}
      data-canvas-surface="true"
      className={`relative h-[70vh] w-full overflow-hidden rounded-3xl border border-slate-200/60 bg-slate-100/80 dark:border-slate-700/60 dark:bg-slate-900/60 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      role="region"
      aria-label="Canvas workspace"
    >
      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <button
          onClick={() => setShowGrid((prev) => !prev)}
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-white/70 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-900/70 dark:text-slate-300"
          aria-pressed={showGrid}
          aria-label={showGrid ? 'Hide grid' : 'Show grid'}
        >
          {showGrid ? 'Hide grid' : 'Show grid'}
        </button>
        <button
          onClick={() => onChange({ ...canvas, zoom: Math.max(canvas.zoom - 0.1, MIN_ZOOM) })}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-base text-slate-600 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-900/70 dark:text-slate-300"
          aria-label="Zoom out"
        >
          –
        </button>
        <button
          onClick={() => onChange({ ...canvas, zoom: Math.min(canvas.zoom + 0.1, MAX_ZOOM) })}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-base text-slate-600 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-900/70 dark:text-slate-300"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => onChange({ ...canvas, zoom: 1, position: { x: 0, y: 0 } })}
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-white/70 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-slate-900/70 dark:text-slate-300"
          aria-label="Reset canvas view"
        >
          Reset
        </button>
      </div>
      <motion.div
        className="absolute inset-0"
        animate={{ scale: canvas.zoom, x: canvas.position.x, y: canvas.position.y }}
        transition={{ type: 'spring', stiffness: 420, damping: 40, mass: 0.6 }}
        style={{ touchAction: 'none', transformOrigin: '0 0' }}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute ${showGrid ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 ease-out`}
          style={{
            top: `-${GRID_PADDING_SCALE * 100}%`,
            right: `-${GRID_PADDING_SCALE * 100}%`,
            bottom: `-${GRID_PADDING_SCALE * 100}%`,
            left: `-${GRID_PADDING_SCALE * 100}%`,
            backgroundImage: 'radial-gradient(circle, rgba(79,70,229,0.2) 1.5px, transparent 0)',
            backgroundSize: `${GRID_SPACING}px ${GRID_SPACING}px`
          }}
        />
        <div className="relative h-full w-full">
          {canvas.cards.map((card) => {
            const width = card.width ?? DEFAULT_CARD_WIDTH
            const height = card.height ?? DEFAULT_CARD_HEIGHT
            return (
            <Rnd
              key={card.id}
              data-card-root="true"
              data-card-id={card.id}
              data-card-type={card.type}
              position={{ x: card.x, y: card.y }}
              size={{ width, height }}
              scale={canvas.zoom}
              onDragStop={(event, data) => {
                const snapped = snapPointToGrid({ x: data.x, y: data.y })
                onCardChange({ ...card, x: snapped.x, y: snapped.y, updatedAt: new Date().toISOString() })
              }}
              enableResizing={false}
              disableDragging={card.locked}
              style={{ zIndex: card.pinned ? 20 : undefined }}
            >
              <CardComponent card={card} onChange={onCardChange} onDelete={() => onCardDelete(card.id)} />
            </Rnd>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
