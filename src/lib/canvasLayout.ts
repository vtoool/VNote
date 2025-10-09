export const GRID_SPACING = 56

export const DEFAULT_CARD_WIDTH = GRID_SPACING * 7
export const DEFAULT_CARD_HEIGHT = GRID_SPACING * 5

const BASE_HORIZONTAL_GAP = 16
const BASE_VERTICAL_GAP = 16
const HORIZONTAL_GAP_FACTOR = 0.1
const VERTICAL_GAP_FACTOR = 0.1
const MIN_HORIZONTAL_GAP = 12
const MAX_HORIZONTAL_GAP = 48
const MIN_VERTICAL_GAP = 12
const MAX_VERTICAL_GAP = 40

const PLACEMENT_MARGIN = 8
const DEBUG_LIMIT = 10

let placementLogCount = 0

export interface PlacementRect {
  x: number
  y: number
  w: number
  h: number
}

export interface GridConfig {
  size?: number
  origin?: { x: number; y: number }
  left?: number
  top?: number
}

export interface CanvasSize {
  width?: number
  height?: number
}

interface Candidate {
  x: number
  y: number
  w: number
  h: number
}

export function snapValueToGrid(value: number): number {
  return Math.round(value / GRID_SPACING) * GRID_SPACING
}

export function snapPointToGrid(point: { x: number; y: number }): { x: number; y: number } {
  return {
    x: snapValueToGrid(point.x),
    y: snapValueToGrid(point.y)
  }
}

export function toPlacementRect(positionable: {
  x: number
  y: number
  width?: number
  height?: number
}): PlacementRect {
  return {
    x: positionable.x,
    y: positionable.y,
    w: normalizeDimension(positionable.width, DEFAULT_CARD_WIDTH),
    h: normalizeDimension(positionable.height, DEFAULT_CARD_HEIGHT)
  }
}

export function toPlacementRects(
  positionables: Array<{ x: number; y: number; width?: number; height?: number }>
): PlacementRect[] {
  return positionables.map((item) => toPlacementRect(item))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeDimension(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(parsed, GRID_SPACING)
}

function computeAdaptiveGaps(w: number, h: number) {
  const xGap = clamp(BASE_HORIZONTAL_GAP + HORIZONTAL_GAP_FACTOR * w, MIN_HORIZONTAL_GAP, MAX_HORIZONTAL_GAP)
  const yGap = clamp(BASE_VERTICAL_GAP + VERTICAL_GAP_FACTOR * h, MIN_VERTICAL_GAP, MAX_VERTICAL_GAP)
  return { xGap, yGap }
}

function intersects(a: Candidate, b: Candidate, margin: number) {
  return !(
    a.x + a.w + margin <= b.x ||
    b.x + b.w + margin <= a.x ||
    a.y + a.h + margin <= b.y ||
    b.y + b.h + margin <= a.y
  )
}

function findCollision(candidate: Candidate, rects: PlacementRect[], margin: number): PlacementRect | null {
  for (const rect of rects) {
    if (intersects(candidate, { x: rect.x, y: rect.y, w: rect.w, h: rect.h }, margin)) {
      return rect
    }
  }
  return null
}

function resolveOrigin(grid?: GridConfig) {
  if (!grid) return { x: 0, y: 0 }
  if (grid.origin) return { ...grid.origin }
  return { x: grid.left ?? 0, y: grid.top ?? 0 }
}

function resolveGridSize(grid?: GridConfig) {
  return grid?.size ?? GRID_SPACING
}

function resolveCanvasWidth(
  canvas: CanvasSize | undefined,
  originX: number,
  cardWidth: number,
  xGap: number,
  rects: PlacementRect[]
) {
  if (canvas?.width && Number.isFinite(canvas.width) && canvas.width > 0) {
    return canvas.width
  }

  const defaultColumns = 4
  const defaultWidth = originX + defaultColumns * cardWidth + (defaultColumns - 1) * xGap
  const farthestRight = rects.reduce((max, rect) => Math.max(max, rect.x + rect.w), originX)
  return Math.max(defaultWidth, farthestRight + cardWidth + xGap)
}

function snapCandidate(candidate: Candidate, gridSize: number): Candidate {
  return {
    ...candidate,
    x: Math.round(candidate.x / gridSize) * gridSize,
    y: Math.round(candidate.y / gridSize) * gridSize
  }
}

function logPlacementDebug(
  requested: { w: number; h: number },
  chosen: { x: number; y: number },
  context: {
    rowY: number
    rowMaxHeight: number
    xGap: number
    yGap: number
  }
) {
  if (placementLogCount >= DEBUG_LIMIT) return
  placementLogCount += 1
  console.debug('[canvas] placement', {
    requested,
    chosen,
    rowY: context.rowY,
    rowMaxHeight: context.rowMaxHeight,
    xGap: context.xGap,
    yGap: context.yGap,
    snapped: chosen
  })
}

export function getNextCardPosition(
  size: { w?: number; h?: number },
  existingRects: PlacementRect[],
  canvas?: CanvasSize,
  grid?: GridConfig
): { x: number; y: number } {
  const cardWidth = normalizeDimension(size.w, DEFAULT_CARD_WIDTH)
  const cardHeight = normalizeDimension(size.h, DEFAULT_CARD_HEIGHT)
  const { xGap, yGap } = computeAdaptiveGaps(cardWidth, cardHeight)

  const gridSize = resolveGridSize(grid)
  const origin = resolveOrigin(grid)
  const canvasWidth = resolveCanvasWidth(canvas, origin.x, cardWidth, xGap, existingRects)
  const multiColumnThreshold = DEFAULT_CARD_WIDTH * 1.5
  const baseAdvance = cardWidth + xGap
  const multiColumnAdvance = Math.ceil(cardWidth / DEFAULT_CARD_WIDTH) * (DEFAULT_CARD_WIDTH + xGap)
  const columnAdvance = cardWidth > multiColumnThreshold ? multiColumnAdvance : baseAdvance

  if (existingRects.length === 0) {
    placementLogCount = 0
  }

  let rowY = origin.y
  let rowMaxHeight = cardHeight
  let x = origin.x

  const maxAttempts = 10000
  let attempts = 0

  while (attempts < maxAttempts) {
    attempts += 1

    if (x + cardWidth > canvasWidth && x !== origin.x) {
      x = origin.x
      rowY += rowMaxHeight + yGap
      rowMaxHeight = cardHeight
      continue
    }

    const candidate: Candidate = { x, y: rowY, w: cardWidth, h: cardHeight }
    const snappedCandidate = snapCandidate(candidate, gridSize)
    const collision = findCollision(snappedCandidate, existingRects, PLACEMENT_MARGIN)

    if (!collision) {
      logPlacementDebug(
        { w: cardWidth, h: cardHeight },
        { x: snappedCandidate.x, y: snappedCandidate.y },
        { rowY, rowMaxHeight, xGap, yGap }
      )
      return { x: snappedCandidate.x, y: snappedCandidate.y }
    }

    rowMaxHeight = Math.max(rowMaxHeight, collision.h, cardHeight)
    const nextX = Math.max(x + columnAdvance, collision.x + collision.w + xGap)
    x = nextX
  }

  const fallback = snapCandidate({ x: origin.x, y: rowY, w: cardWidth, h: cardHeight }, gridSize)
  logPlacementDebug(
    { w: cardWidth, h: cardHeight },
    { x: fallback.x, y: fallback.y },
    { rowY, rowMaxHeight, xGap, yGap }
  )
  return { x: fallback.x, y: fallback.y }
}
