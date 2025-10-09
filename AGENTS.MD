# Agent Notes

- Use the helpers in `src/lib/canvasLayout.ts` when working with canvas positioning so grid spacing and snapping stay consistent.
- When touching the canvas UI, remember panning is now managed via pointer listeners on the wrapper (`CanvasBoard`) and zoom via the wheel handler—keep that pattern intact.
- Cards are sized responsively; rely on intrinsic layout (`width?: number`, `height?: number`) and scrollable bodies instead of fixed dimensions.
- New cards should be placed via `getNextCardPosition` (with `toPlacementRects` for existing cards) to avoid overlapping; drag/resize updates must snap positions with `snapPointToGrid`.
- Keep scroll locking limited to the canvas container; other parts of the app should retain default scrolling.
