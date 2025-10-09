export const GRID_SPACING = 56
const DEFAULT_CARD_WIDTH = GRID_SPACING * 7
const DEFAULT_CARD_HEIGHT = GRID_SPACING * 5

const BASE_HORIZONTAL_GAP = 16
const BASE_VERTICAL_GAP = 16
const HORIZONTAL_GAP_FACTOR = 0.1
const VERTICAL_GAP_FACTOR = 0.1
const MIN_HORIZONTAL_GAP = 16
const MAX_HORIZONTAL_GAP = 48
const MIN_VERTICAL_GAP = 16
const MAX_VERTICAL_GAP = 40

export function snapValueToGrid(value: number): number {
  return Math.round(value / GRID_SPACING) * GRID_SPACING
}

export function snapPointToGrid(point: { x: number; y: number }): { x: number; y: number } {
  return {
    x: snapValueToGrid(point.x),
    y: snapValueToGrid(point.y)
  }
}

interface Positionable {
  x: number
  y: number
  width?: number
  height?: number
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface MeasuredRect extends Rect {
  marginX: number
  marginY: number
}

interface PlacementOptions<T extends Positionable> {
  cards: T[]
  size?: { width?: number; height?: number }
  origin?: { x: number; y: number }
  canvasSize?: { width: number; height: number }
  gridSpacing?: number
}

interface PlacementResult {
  position: { x: number; y: number }
  overflowed: boolean
}

function normalizeDimension(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(parsed, GRID_SPACING)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function computeAdaptiveGaps(width: number, height: number) {
  const xGap = clamp(BASE_HORIZONTAL_GAP + HORIZONTAL_GAP_FACTOR * width, MIN_HORIZONTAL_GAP, MAX_HORIZONTAL_GAP)
  const yGap = clamp(BASE_VERTICAL_GAP + VERTICAL_GAP_FACTOR * height, MIN_VERTICAL_GAP, MAX_VERTICAL_GAP)

  return {
    xGap,
    yGap,
    marginX: xGap / 2,
    marginY: yGap / 2
  }
}

function toMeasuredRect(card: Positionable): MeasuredRect {
  const width = normalizeDimension(card.width, DEFAULT_CARD_WIDTH)
  const height = normalizeDimension(card.height, DEFAULT_CARD_HEIGHT)
  const gaps = computeAdaptiveGaps(width, height)

  return {
    x: card.x,
    y: card.y,
    width,
    height,
    marginX: gaps.marginX,
    marginY: gaps.marginY
  }
}

function expandRect(rect: Rect, marginX: number, marginY: number): Rect {
  return {
    x: rect.x - marginX,
    y: rect.y - marginY,
    width: rect.width + marginX * 2,
    height: rect.height + marginY * 2
  }
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  )
}

function fitsAt(
  position: { x: number; y: number },
  size: { width: number; height: number },
  spacing: { marginX: number; marginY: number },
  existing: MeasuredRect[]
): boolean {
  const base = { x: position.x, y: position.y, width: size.width, height: size.height }
  const candidate = expandRect(base, spacing.marginX, spacing.marginY)

  for (const rect of existing) {
    const expanded = expandRect(rect, rect.marginX, rect.marginY)
    if (rectsOverlap(candidate, expanded)) {
      return false
    }

    const horizontalMargin = Math.max(spacing.marginX, rect.marginX)
    const verticalMargin = Math.max(spacing.marginY, rect.marginY)
    const candidateWithSharedMargin = expandRect(base, horizontalMargin, verticalMargin)
    const expandedExistingWithSharedMargin = expandRect(rect, horizontalMargin, verticalMargin)

    if (rectsOverlap(candidateWithSharedMargin, expandedExistingWithSharedMargin)) {
      return false
    }
  }

  return true
}

function resolvePlacement<T extends Positionable>({
  cards,
  size,
  origin,
  canvasSize,
  gridSpacing
}: PlacementOptions<T>): PlacementResult {
  if (cards.length === 0) {
    const startX = origin?.x ?? 0
    const startY = origin?.y ?? 0
    const snapped = snapPointToGrid({ x: startX, y: startY })
    return { position: snapped, overflowed: false }
  }

  const spacing = gridSpacing ?? GRID_SPACING
  const measuredCards = cards.map((card) => toMeasuredRect(card))

  const width = normalizeDimension(size?.width, DEFAULT_CARD_WIDTH)
  const height = normalizeDimension(size?.height, DEFAULT_CARD_HEIGHT)
  const candidateSpacing = computeAdaptiveGaps(width, height)

  const candidateSize = { width, height }
  const columnSpan = Math.max(1, Math.ceil(width / DEFAULT_CARD_WIDTH))
  const rowSpan = Math.max(1, Math.ceil(height / DEFAULT_CARD_HEIGHT))

  const originX = origin?.x ?? 0
  const originY = origin?.y ?? 0

  let minCol = Math.floor(originX / spacing)
  let maxCol = Math.ceil((originX + width) / spacing)
  let minRow = Math.floor(originY / spacing)
  let maxRow = Math.ceil((originY + height) / spacing)

  for (const rect of measuredCards) {
    minCol = Math.min(minCol, Math.floor((rect.x - rect.marginX) / spacing))
    maxCol = Math.max(maxCol, Math.ceil((rect.x + rect.width + rect.marginX) / spacing))
    minRow = Math.min(minRow, Math.floor((rect.y - rect.marginY) / spacing))
    maxRow = Math.max(maxRow, Math.ceil((rect.y + rect.height + rect.marginY) / spacing))
  }

  const padding = Math.max(4, Math.ceil(Math.sqrt(cards.length + 1)))

  for (let row = minRow; row <= maxRow + padding; row += 1) {
    const y = row * spacing
    const snappedY = snapValueToGrid(y)

    for (let col = minCol; col <= maxCol + padding; col += 1) {
      const x = col * spacing
      const snappedX = snapValueToGrid(x)

      if (canvasSize) {
        if (snappedX + candidateSize.width > canvasSize.width) {
          continue
        }
        if (snappedY + candidateSize.height > canvasSize.height) {
          continue
        }
      }

      if (fitsAt({ x: snappedX, y: snappedY }, candidateSize, candidateSpacing, measuredCards)) {
        return { position: { x: snappedX, y: snappedY }, overflowed: false }
      }
    }
  }

  const fallbackCol = Math.max(
    0,
    Math.ceil((maxCol + padding + 1) / columnSpan) * columnSpan
  )
  const fallbackRow = Math.max(
    0,
    Math.ceil((maxRow + padding + 1) / rowSpan) * rowSpan
  )

  const fallbackPosition = {
    x: fallbackCol * spacing,
    y: fallbackRow * spacing
  }

  return { position: fallbackPosition, overflowed: true }
}

export function findNextGridPositionWithOverflow<T extends Positionable>(
  cards: T[]
): { position: { x: number; y: number }; overflowed: boolean } {
  return resolvePlacement({ cards, size: { width: DEFAULT_CARD_WIDTH, height: DEFAULT_CARD_HEIGHT } })
}

export function findNextGridPosition<T extends Positionable>(cards: T[]): { x: number; y: number } {
  return findNextGridPositionWithOverflow(cards).position
}

export function getNextCardPosition<T extends Positionable>(
  size: { width?: number; height?: number },
  cards: T[],
  canvasSize?: { width: number; height: number },
  grid?: { spacing?: number; origin?: { x: number; y: number } }
): { x: number; y: number } {
  const result = resolvePlacement({
    cards,
    size,
    canvasSize,
    gridSpacing: grid?.spacing,
    origin: grid?.origin
  })

  return result.position
}
