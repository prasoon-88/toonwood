import { useEffect, useRef, useState } from 'react'
import type { Decision, ScoredPreset, Settings } from '../../../shared/types'

export interface Card {
  question: string
  source: string
  text: string
  streaming?: boolean
  error?: string
  warning?: string
  alternatives?: ScoredPreset[]
  /** Screenshot the answer is about (data: URL). */
  image?: string
}

/**
 * Turns a question into an answer card: preset match, "no match", or a streamed AI answer.
 * `onAnswer` gets each finished answer (preset or complete AI text), e.g. to share it to the room.
 */
export function useAssistant(settings: Settings, onAnswer?: (card: Card) => void) {
  const [card, setCard] = useState<Card | null>(null)
  const answerIdRef = useRef<number | null>(null)
  /** The card being streamed, with all text received so far. */
  const streamingRef = useRef<Card | null>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const onAnswerRef = useRef(onAnswer)
  onAnswerRef.current = onAnswer

  useEffect(() => {
    const offDelta = window.api.onAnswerDelta(({ id, text }) => {
      if (id !== answerIdRef.current) return
      if (streamingRef.current) streamingRef.current.text += text
      setCard((c) => c && { ...c, text: c.text + text })
    })
    const offDone = window.api.onAnswerDone(({ id, error }) => {
      if (id !== answerIdRef.current) return
      const done = streamingRef.current
      streamingRef.current = null
      setCard((c) => c && { ...c, streaming: false, error })
      if (done?.text && !error) onAnswerRef.current?.({ ...done, streaming: false })
    })
    return () => {
      offDelta()
      offDone()
    }
  }, [])

  function startStream(next: Card) {
    streamingRef.current = { ...next }
    setCard(next)
  }

  function cancelCurrent() {
    if (answerIdRef.current !== null) window.api.cancelAnswer(answerIdRef.current)
    answerIdRef.current = null
    streamingRef.current = null
  }

  /** `transcript` is the recent conversation; `force` answers even if it doesn't look like a question. */
  async function respond(question: string, transcript: string, force: boolean) {
    const decision: Decision = await window.api.decide(question, transcript, force)
    if (decision.kind === 'skip') return

    cancelCurrent()
    const s = settingsRef.current

    if (decision.kind === 'preset') {
      const next: Card = {
        question,
        source: `Preset · ${Math.round(decision.best.score * 100)}% · ${decision.via}`,
        text: decision.best.preset.answer,
        alternatives: decision.alternatives,
        warning: decision.warning
      }
      setCard(next)
      onAnswerRef.current?.(next)
    } else if (decision.kind === 'nomatch') {
      setCard({
        question,
        source: `No preset above ${Math.round(s.confidenceThreshold * 100)}%`,
        text: '',
        alternatives: decision.alternatives,
        warning: decision.warning
      })
    } else {
      startStream({
        question,
        source: `AI · ${s.llmProvider}/${s.llmModel}`,
        text: '',
        streaming: true,
        warning: decision.warning
      })
      answerIdRef.current = await window.api.answer({ question, transcript, references: decision.references })
    }
  }

  /** Ask the AI about a screenshot; `question` is the latest speech (may be empty). Skips presets. */
  async function respondToScreenshot(image: string, question: string, transcript: string) {
    cancelCurrent()
    const s = settingsRef.current
    startStream({
      question: question || 'Screenshot',
      source: `AI · screenshot · ${s.llmProvider}/${s.llmModel}`,
      text: '',
      streaming: true,
      image
    })
    answerIdRef.current = await window.api.answer({ question, transcript, references: [], image })
  }

  return { card, setCard, respond, respondToScreenshot }
}
