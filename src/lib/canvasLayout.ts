export const GRID_SPACING = 48
const DEFAULT_CARD_WIDTH = GRID_SPACING * 6
const DEFAULT_CARD_HEIGHT = GRID_SPACING * 5

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

function getFootprint(card: Positionable): Footprint {
  const width = normalizeDimension(card.width, DEFAULT_CARD_WIDTH)
  const height = normalizeDimension(card.height, DEFAULT_CARD_HEIGHT)
  const colStart = Math.floor(card.x / GRID_SPACING)
  const rowStart = Math.floor(card.y / GRID_SPACING)
  const colSpan = Math.max(1, Math.ceil(width / GRID_SPACING))
  const rowSpan = Math.max(1, Math.ceil(height / GRID_SPACING))
  return {
    colStart,
    colEnd: colStart + colSpan - 1,
    rowStart,
    rowEnd: rowStart + rowSpan - 1
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

  const footprints = cards.map(getFootprint)
  const candidateColSpan = Math.ceil(DEFAULT_CARD_WIDTH / GRID_SPACING)
  const candidateRowSpan = Math.ceil(DEFAULT_CARD_HEIGHT / GRID_SPACING)

  const minCol = Math.min(0, ...footprints.map((footprint) => footprint.colStart))
  const minRow = Math.min(0, ...footprints.map((footprint) => footprint.rowStart))
  const maxCol = Math.max(
    candidateColSpan - 1,
    ...footprints.map((footprint) => footprint.colEnd)
  )
  const maxRow = Math.max(
    candidateRowSpan - 1,
    ...footprints.map((footprint) => footprint.rowEnd)
  )

  const padding = Math.max(4, Math.ceil(Math.sqrt(cards.length + 1)))

  for (let row = minRow; row <= maxRow + padding; row += 1) {
    for (let col = minCol; col <= maxCol + padding; col += 1) {
      const candidate: Footprint = {
        colStart: col,
        colEnd: col + candidateColSpan - 1,
        rowStart: row,
        rowEnd: row + candidateRowSpan - 1
      }

      if (!footprints.some((footprint) => overlaps(footprint, candidate))) {
        return {
          position: { x: candidate.colStart * GRID_SPACING, y: candidate.rowStart * GRID_SPACING },
          overflowed: false
        }
      }
    }
  }

  const fallback = {
    colStart: maxCol + padding + 1,
    rowStart: maxRow + padding + 1
  }

  return {
    position: { x: fallback.colStart * GRID_SPACING, y: fallback.rowStart * GRID_SPACING },
    overflowed: true
  }
}

export function findNextGridPosition<T extends Positionable>(cards: T[]): { x: number; y: number } {
  return findNextGridPositionWithOverflow(cards).position
}
