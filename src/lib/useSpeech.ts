import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type UseSpeech = {
  supported: boolean
  listening: boolean
  finalText: string
  start: () => void
  stop: () => void
  clear: () => void
}

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

export function useSpeech(): UseSpeech {
  const SpeechRecognition = useMemo(() => getSpeechRecognition(), [])
  const supported = !!SpeechRecognition

  const recognitionRef = useRef<any>(null)
  const [listening, setListening] = useState(false)
  const [finalText, setFinalText] = useState("")

  useEffect(() => {
    if (!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = "en-US"

    rec.onresult = (event: any) => {
      let finalChunks = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) finalChunks += res[0]?.transcript ?? ""
      }
      if (finalChunks) {
        setFinalText((prev) => `${prev}${finalChunks}`)
      }
    }

    rec.onend = () => {
      setListening(false)
    }
    rec.onerror = () => {
      setListening(false)
    }

    recognitionRef.current = rec

    return () => {
      rec.onresult = null
      rec.onend = null
      rec.onerror = null
      rec.stop?.()
      recognitionRef.current = null
    }
  }, [SpeechRecognition])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch (error) {
      console.error("Failed to start speech recognition", error)
    }
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const clear = useCallback(() => {
    setFinalText("")
  }, [])

  return { supported, listening, finalText, start, stop, clear }
}
