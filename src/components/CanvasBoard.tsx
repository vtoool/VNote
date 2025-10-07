import { useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import { motion } from 'framer-motion'
import { Card, Canvas } from '../lib/storage'
import CardComponent from './Card'
import type { PointerEvent as ReactPointerEvent } from 'react'

interface CanvasBoardProps {
  canvas: Canvas
  onChange: (canvas: Canvas) => void
  onCardChange: (card: Card) => void
  onCardDelete: (cardId: string) => void
}

export default function CanvasBoard({ canvas, onChange, onCardChange, onCardDelete }: CanvasBoardProps) {
  const [showGrid, setShowGrid] = useState(true)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{
    pointerId: number
    originX: number
    originY: number
    canvasX: number
    canvasY: number
  } | null>(null)

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return
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

  return (
    <div
      className="relative h-[70vh] w-full overflow-hidden rounded-3xl border border-slate-200/60 bg-slate-100/80 dark:border-slate-700/60 dark:bg-slate-900/60">
      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <button
          onClick={() => setShowGrid((prev) => !prev)}
          className="rounded-2xl bg-white/70 px-3 py-1 text-xs text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/70 dark:text-slate-300"
        >
          {showGrid ? 'Hide grid' : 'Show grid'}
        </button>
        <button
          onClick={() => onChange({ ...canvas, zoom: Math.min(canvas.zoom + 0.1, 1.6) })}
          className="rounded-2xl bg-white/70 px-3 py-1 text-xs text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/70 dark:text-slate-300"
        >
          +
        </button>
        <button
          onClick={() => onChange({ ...canvas, zoom: Math.max(canvas.zoom - 0.1, 0.4) })}
          className="rounded-2xl bg-white/70 px-3 py-1 text-xs text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/70 dark:text-slate-300"
        >
          –
        </button>
        <button
          onClick={() => onChange({ ...canvas, zoom: 1, position: { x: 0, y: 0 } })}
          className="rounded-2xl bg-white/70 px-3 py-1 text-xs text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/70 dark:text-slate-300"
        >
          Reset
        </button>
      </div>
      <motion.div
        className={`absolute inset-0 ${showGrid ? 'bg-[radial-gradient(circle,_rgba(79,70,229,0.22)_1.5px,_transparent_0)] bg-[length:36px_36px]' : ''} ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        animate={{ scale: canvas.zoom, x: canvas.position.x, y: canvas.position.y }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        style={{ touchAction: 'none' }}
      >
        {canvas.cards.map((card) => (
          <Rnd
            key={card.id}
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
                width: '16px',
                height: '16px',
                borderRadius: '9999px',
                border: '2px solid rgba(255,255,255,0.8)',
                background: 'rgba(79,70,229,0.85)',
                right: '8px',
                bottom: '8px',
                boxShadow: '0 4px 10px rgba(79,70,229,0.35)'
              }
            }}
          >
            <CardComponent card={card} onChange={onCardChange} onDelete={() => onCardDelete(card.id)} />
          </Rnd>
        ))}
      </motion.div>
    </div>
  )
}
