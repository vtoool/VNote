import { useCallback, useRef, useState } from 'react'

export function useUndoRedo<T>(initial: T) {
  const [present, setPresent] = useState(initial)
  const pastRef = useRef<T[]>([])
  const futureRef = useRef<T[]>([])

  const set = useCallback((value: T) => {
    pastRef.current = [present, ...pastRef.current].slice(0, 50)
    setPresent(value)
    futureRef.current = []
  }, [present])

  const replace = useCallback((value: T) => {
    pastRef.current = []
    futureRef.current = []
    setPresent(value)
  }, [])

  const undo = useCallback(() => {
    const previous = pastRef.current.shift()
    if (!previous) return present
    futureRef.current = [present, ...futureRef.current]
    setPresent(previous)
    return previous
  }, [present])

  const redo = useCallback(() => {
    const next = futureRef.current.shift()
    if (!next) return present
    pastRef.current = [present, ...pastRef.current]
    setPresent(next)
    return next
  }, [present])

  return { value: present, set, replace, undo, redo }
}
