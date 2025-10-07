import { useCallback, useEffect, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import { motion } from 'framer-motion'
import { Card, Canvas } from '../lib/storage'
import CardComponent from './Card'
import type { PointerEvent as ReactPointerEvent } from 'react'

const MIN_ZOOM = 0.4
const MAX_ZOOM = 1.6
const GRID_PADDING_SCALE = 3
const GRID_SPACING = 48

interface CanvasBoardProps {
  canvas: Canvas
  onChange: (canvas: Canvas) => void
  onCardChange: (card: Card) => void
  onCardDelete: (cardId: string) => void
}

export default function CanvasBoard({ canvas, onChange, onCardChange, onCardDelete }: CanvasBoardProps) {
  const [showGrid, setShowGrid] = useState(true)
  const [isPanning, setIsPanning] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const panStartRef = useRef<{
    pointerId: number
    originX: number
    originY: number
    canvasX: number
    canvasY: number
  } | null>(null)

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement | null
    if (target && target.closest('[data-card-root="true"]')) {
      return
    }
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsPanning(true)
    panStartRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      canvasX: canvas.position.x,
      canvasY: canvas.position.y
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPanning || !panStartRef.current) return
    event.preventDefault()
    const { originX, originY, canvasX, canvasY } = panStartRef.current
    const nextPosition = {
      x: canvasX + (event.clientX - originX),
      y: canvasY + (event.clientY - originY)
    }
    onChange({ ...canvas, position: nextPosition })
  }

  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panStartRef.current) return
    if (event.currentTarget.hasPointerCapture(panStartRef.current.pointerId)) {
      event.currentTarget.releasePointerCapture(panStartRef.current.pointerId)
    }
    panStartRef.current = null
    setIsPanning(false)
  }

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        return
      }
      event.preventDefault()
      const zoomIntensity = 0.0015
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, canvas.zoom * Math.exp(-event.deltaY * zoomIntensity))
      )

      if (nextZoom === canvas.zoom) return

      onChange({
        ...canvas,
        zoom: nextZoom
      })
    },
    [canvas, onChange]
  )

  useEffect(() => {
    const node = boardRef.current
    if (!node) return
    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      node.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  return (
    <div
      className="relative h-[70vh] w-full overflow-hidden rounded-3xl border border-slate-200/60 bg-slate-100/80 dark:border-slate-700/60 dark:bg-slate-900/60"
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
        ref={boardRef}
        className={`absolute inset-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        animate={{ scale: canvas.zoom, x: canvas.position.x, y: canvas.position.y }}
        transition={{ type: 'spring', stiffness: 420, damping: 40, mass: 0.6 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
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
          {canvas.cards.map((card) => (
            <Rnd
              key={card.id}
              data-card-root="true"
              position={{ x: card.x, y: card.y }}
              size={{ width: card.width, height: card.height }}
              onDragStop={(event, data) => {
                onCardChange({ ...card, x: data.x, y: data.y, updatedAt: new Date().toISOString() })
              }}
              onResizeStop={(event, direction, ref, delta, position) => {
                onCardChange({
                  ...card,
                  width: Number(ref.style.width.replace('px', '')),
                  height: Number(ref.style.height.replace('px', '')),
                  x: position.x,
                  y: position.y,
                  updatedAt: new Date().toISOString()
                })
              }}
              enableResizing={!card.locked}
              disableDragging={card.locked}
              style={{ zIndex: card.pinned ? 20 : undefined }}
              minWidth={200}
              minHeight={160}
              resizeHandleStyles={{
                bottomRight: {
                  width: '22px',
                  height: '22px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.65)',
                  background: 'linear-gradient(135deg, rgba(129,140,248,0.95), rgba(99,102,241,0.95))',
                  right: '10px',
                  bottom: '10px',
                  boxShadow: '0 8px 16px rgba(79,70,229,0.35), inset 0 1px 2px rgba(255,255,255,0.6)'
                }
              }}
            >
              <CardComponent card={card} onChange={onCardChange} onDelete={() => onCardDelete(card.id)} />
            </Rnd>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
