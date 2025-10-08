export const GRID_SPACING = 56
const DEFAULT_CARD_WIDTH = GRID_SPACING * 7
const DEFAULT_CARD_HEIGHT = GRID_SPACING * 5
const CARD_MARGIN = 0
const DEFAULT_COLUMN_SPAN = Math.max(1, Math.ceil(DEFAULT_CARD_WIDTH / GRID_SPACING))
const DEFAULT_ROW_SPAN = Math.max(1, Math.ceil(DEFAULT_CARD_HEIGHT / GRID_SPACING))

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

interface Footprint {
  colStart: number
  colEnd: number
  rowStart: number
  rowEnd: number
}

function normalizeDimension(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(parsed, GRID_SPACING)
}

function getFootprint(card: Positionable, margin = 0): Footprint {
  const width = normalizeDimension(card.width, DEFAULT_CARD_WIDTH)
  const height = normalizeDimension(card.height, DEFAULT_CARD_HEIGHT)
  const colStart = Math.floor(card.x / GRID_SPACING)
  const rowStart = Math.floor(card.y / GRID_SPACING)
  const colSpan = Math.max(1, Math.ceil(width / GRID_SPACING))
  const rowSpan = Math.max(1, Math.ceil(height / GRID_SPACING))
  const colEnd = colStart + colSpan - 1
  const rowEnd = rowStart + rowSpan - 1
  if (margin <= 0) {
    return { colStart, colEnd, rowStart, rowEnd }
  }
  return {
    colStart: colStart - margin,
    colEnd: colEnd + margin,
    rowStart: rowStart - margin,
    rowEnd: rowEnd + margin
  }
}

function overlaps(a: Footprint, b: Footprint): boolean {
  return !(
    a.colEnd < b.colStart ||
    b.colEnd < a.colStart ||
    a.rowEnd < b.rowStart ||
    b.rowEnd < a.rowStart
  )
}

export function findNextGridPositionWithOverflow<T extends Positionable>(
  cards: T[]
): { position: { x: number; y: number }; overflowed: boolean } {
  if (cards.length === 0) {
    return { position: { x: 0, y: 0 }, overflowed: false }
  }

  const footprints = cards.map((card) => getFootprint(card, CARD_MARGIN))
  const candidatePrototype = getFootprint({ x: 0, y: 0, width: DEFAULT_CARD_WIDTH, height: DEFAULT_CARD_HEIGHT })
  const minCol = Math.min(0, candidatePrototype.colStart, ...footprints.map((footprint) => footprint.colStart))
  const minRow = Math.min(0, candidatePrototype.rowStart, ...footprints.map((footprint) => footprint.rowStart))
  const maxCol = Math.max(candidatePrototype.colEnd, ...footprints.map((footprint) => footprint.colEnd))
  const maxRow = Math.max(candidatePrototype.rowEnd, ...footprints.map((footprint) => footprint.rowEnd))

  const padding = Math.max(4, Math.ceil(Math.sqrt(cards.length + 1)))

  for (let row = minRow; row <= maxRow + padding; row += 1) {
    for (let col = minCol; col <= maxCol + padding; col += 1) {
      const candidate = getFootprint(
        { x: col * GRID_SPACING, y: row * GRID_SPACING, width: DEFAULT_CARD_WIDTH, height: DEFAULT_CARD_HEIGHT },
        CARD_MARGIN
      )

      if (!footprints.some((footprint) => overlaps(footprint, candidate))) {
        return {
          position: { x: col * GRID_SPACING, y: row * GRID_SPACING },
          overflowed: false
        }
      }
    }
  }

  const fallback = {
    colStart:
      Math.max(0, Math.ceil((maxCol + padding + 1) / DEFAULT_COLUMN_SPAN) * DEFAULT_COLUMN_SPAN),
    rowStart:
      Math.max(0, Math.ceil((maxRow + padding + 1) / DEFAULT_ROW_SPAN) * DEFAULT_ROW_SPAN)
  }

  return {
    position: { x: fallback.colStart * GRID_SPACING, y: fallback.rowStart * GRID_SPACING },
    overflowed: true
  }
}

export function findNextGridPosition<T extends Positionable>(cards: T[]): { x: number; y: number } {
  return findNextGridPositionWithOverflow(cards).position
}
