export const GRID_SPACING = 48

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
}

export function findNextGridPositionWithOverflow<T extends Positionable>(
  cards: T[]
): { position: { x: number; y: number }; overflowed: boolean } {
  const occupied = new Set(
    cards.map((card) => {
      const snapped = snapPointToGrid({ x: card.x, y: card.y })
      return `${snapped.x / GRID_SPACING}:${snapped.y / GRID_SPACING}`
    })
  )

  const searchLimit = Math.max(10, Math.ceil(Math.sqrt(cards.length + 1)) * 2)

  for (let row = 0; row < searchLimit; row += 1) {
    for (let col = 0; col < searchLimit; col += 1) {
      const key = `${col}:${row}`
      if (!occupied.has(key)) {
        return {
          position: { x: col * GRID_SPACING, y: row * GRID_SPACING },
          overflowed: false
        }
      }
    }
  }

  const fallbackIndex = cards.length + 1
  const fallbackRow = Math.floor(fallbackIndex / searchLimit)
  const fallbackCol = fallbackIndex % searchLimit
  return {
    position: { x: fallbackCol * GRID_SPACING, y: fallbackRow * GRID_SPACING },
    overflowed: true
  }
}

export function findNextGridPosition<T extends Positionable>(cards: T[]): { x: number; y: number } {
  return findNextGridPositionWithOverflow(cards).position
}
