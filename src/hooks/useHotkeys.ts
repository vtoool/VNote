import { useHotkeys } from 'react-hotkeys-hook'

export function useAppHotkeys(map: Record<string, () => void>, deps: any[] = []) {
  Object.entries(map).forEach(([combo, handler]) => {
    useHotkeys(combo, handler, { enableOnFormTags: ['input', 'textarea'] }, deps)
  })
}
