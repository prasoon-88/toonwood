import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import type { Card } from '../hooks/useAssistant'
import { Kbd } from '../commands'
import { Markdown } from './Markdown'

interface Props {
  card: Card | null
  setCard: (update: (c: Card | null) => Card | null) => void
  empty: ReactNode
  autoScroll: boolean
  sectionRef: RefObject<HTMLElement | null>
}

const SCROLL_STEP = 160

export async function copyAnswer(card: Card | null): Promise<boolean> {
  if (!card?.text) return false
  await window.api.copyText(card.text)
  return true
}

export function scrollAnswer(ref: RefObject<HTMLElement | null>, direction: 1 | -1): void {
  ref.current?.scrollBy({ top: direction * SCROLL_STEP, behavior: 'smooth' })
}

export function AnswerCard({ card, setCard, empty, autoScroll, sectionRef }: Props) {
  const [copied, setCopied] = useState(false)

  // Follow a streaming answer as it grows.
  useEffect(() => {
    const el = sectionRef.current
    if (el && autoScroll && card?.streaming) el.scrollTop = el.scrollHeight
  }, [card?.text, card?.streaming, autoScroll])

  async function copy() {
    if (await copyAnswer(card)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }
  }

  return (
    <section className="card" ref={sectionRef}>
      {card ? (
        <>
          <div className="card-head">
            <span className="badge">{card.source}</span>
            {card.streaming && <span className="muted small">writing…</span>}
            {card.text && (
              <button className="tool" onClick={copy}>
                {copied ? 'Copied' : 'Copy'} <Kbd action="copyAnswer" />
              </button>
            )}
          </div>
          {card.image && <img className="shot" src={card.image} alt="Screenshot sent to the AI" />}
          <div className="question">“{card.question}”</div>
          {card.text && <Markdown text={card.text} />}
          {card.error && <div className="error">{card.error}</div>}
          {card.warning && <div className="muted small">{card.warning}</div>}
          {!!card.alternatives?.length && (
            <div className="alts">
              <span className="muted small">Other matches:</span>
              {card.alternatives.map((a) => (
                <button
                  key={a.preset.id}
                  className="alt"
                  onClick={() =>
                    setCard((c) => c && { ...c, text: a.preset.answer, source: `Preset · ${Math.round(a.score * 100)}%` })
                  }
                >
                  {a.preset.question} <span className="muted">{Math.round(a.score * 100)}%</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="muted">{empty}</div>
      )}
    </section>
  )
}
