import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type UseSpeech = {
  supported: boolean
  listening: boolean
  interim: string
  finalText: string
  lang: string
  start: () => void
  stop: () => void
  setLang: (l: string) => void
  clear: () => void
}

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

export function useSpeech(initialLang = "en-US"): UseSpeech {
  const SpeechRecognition = useMemo(() => getSpeechRecognition(), [])
  const supported = !!SpeechRecognition

  const recognitionRef = useRef<any>(null)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState("")
  const [finalText, setFinalText] = useState("")
  const [lang, _setLang] = useState(initialLang)

  useEffect(() => {
    if (!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = lang

    rec.onresult = (event: any) => {
      let interimText = ""
      let finalChunks = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) finalChunks += res[0]?.transcript ?? ""
        else interimText += res[0]?.transcript ?? ""
      }
      if (finalChunks) {
        setFinalText((prev) => `${prev}${finalChunks}`)
      }
      setInterim(interimText)
    }

    rec.onend = () => {
      setListening(false)
      setInterim("")
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
  }, [SpeechRecognition, lang])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.lang = lang
      recognitionRef.current.start()
      setListening(true)
    } catch (error) {
      console.error("Failed to start speech recognition", error)
    }
  }, [lang])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const setLang = useCallback((l: string) => {
    _setLang(l)
  }, [])

  const clear = useCallback(() => {
    setInterim("")
    setFinalText("")
  }, [])

  return { supported, listening, interim, finalText, lang, start, stop, setLang, clear }
}
