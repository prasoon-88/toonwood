import { useEffect, useRef, useState } from 'react'
import type { Settings } from '../../../shared/types'
import { startCapture, type Capture } from '../audio/capture'
import { DeepgramStream, type Speaker, type Utterance } from '../audio/deepgram'
import { AnswerCard, copyAnswer, scrollAnswer } from '../components/AnswerCard'
import { Kbd, useCommands } from '../commands'
import { useAssistant, type Card } from '../hooks/useAssistant'

interface Line {
  id: number
  speaker: Speaker
  text: string
}

const CONTEXT_LINES = 12
/** Names the Live session uses when it is shared to the room. */
const ROOM_NAMES: Record<Speaker, string> = { them: 'Call · Them', you: 'Call · Host' }

/** Wait this long after the speaker stops before treating their speech as a finished question. */
const QUESTION_PAUSE_MS = 1300

/** Mirror a finished Live answer to the open room (no-op when no room is open). */
function shareAnswer(card: Card) {
  window.api.sendRoomMessage({ name: 'Copilot', text: `**Q:** ${card.question}\n\n${card.text}`, image: card.image })
}

export function Live({ settings }: { settings: Settings }) {
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('Idle')
  const [lines, setLines] = useState<Line[]>([])
  const [interim, setInterim] = useState<Partial<Record<Speaker, string>>>({})
  const { card, setCard, respond, respondToScreenshot } = useAssistant(settings, (c) => {
    if (settings.roomShareAnswers) shareAnswer(c)
  })

  const linesRef = useRef<Line[]>([])
  const captureRef = useRef<Capture | null>(null)
  const sttRef = useRef<DeepgramStream | null>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const pendingRef = useRef('')
  const pauseTimerRef = useRef<number | undefined>(undefined)
  const cardRef = useRef<HTMLElement | null>(null)
  const transcriptRef = useRef<HTMLElement | null>(null)

  useCommands('live', (action) => {
    if (action === 'answerNow') answerLast()
    else if (action === 'screenshotAnswer') answerScreenshot()
    else if (action === 'toggleListening') running ? stop() : start()
    else if (action === 'newChat') newChat()
    else if (action === 'copyAnswer') copyAnswer(card)
    else if (action === 'scrollUp') scrollAnswer(cardRef, -1)
    else if (action === 'scrollDown') scrollAnswer(cardRef, 1)
  })

  useEffect(() => {
    const el = transcriptRef.current
    if (el && settings.autoScroll) el.scrollTop = el.scrollHeight
  }, [lines, interim, settings.autoScroll])

  function contextText(): string {
    return linesRef.current
      .slice(-CONTEXT_LINES)
      .map((l) => `${l.speaker === 'them' ? 'Them' : 'You'}: ${l.text}`)
      .join('\n')
  }

  function answer(question: string, force: boolean) {
    respond(question, contextText(), force).catch((err) => setStatus(`Error: ${err.message}`))
  }

  function answerLast() {
    window.clearTimeout(pauseTimerRef.current)
    pendingRef.current = ''
    // Use the last couple of lines: a question is often split across utterances.
    const recent = linesRef.current.slice(-2).map((l) => l.text).join(' ')
    if (recent) answer(recent, true)
  }

  async function answerScreenshot() {
    window.clearTimeout(pauseTimerRef.current)
    pendingRef.current = ''
    const previous = status
    setStatus('Taking screenshot…')
    const shot = await window.api.captureScreen()
    if (!shot.ok || !shot.image) return setStatus(`Error: ${shot.error ?? 'Screenshot failed'}`)
    setStatus(previous)
    const recent = linesRef.current.slice(-2).map((l) => l.text).join(' ')
    respondToScreenshot(shot.image, recent, contextText()).catch((err) => setStatus(`Error: ${err.message}`))
  }

  function newChat() {
    window.clearTimeout(pauseTimerRef.current)
    pendingRef.current = ''
    linesRef.current = []
    setLines([])
    setInterim({})
    setCard(() => null)
  }

  function triggers(speaker: Speaker): boolean {
    return speaker === 'them' || settingsRef.current.listenTo === 'both'
  }

  // Restart the pause timer; when the speaker has been quiet long enough, answer what they said.
  function schedulePending() {
    window.clearTimeout(pauseTimerRef.current)
    pauseTimerRef.current = window.setTimeout(() => {
      const text = pendingRef.current
      pendingRef.current = ''
      if (text) answer(text, false)
    }, QUESTION_PAUSE_MS)
  }

  function onUtterance(u: Utterance) {
    if (!u.final) {
      setInterim((i) => ({ ...i, [u.speaker]: u.text }))
      // Still talking: don't answer a half-finished question yet.
      if (pendingRef.current && triggers(u.speaker)) schedulePending()
      return
    }
    setInterim((i) => ({ ...i, [u.speaker]: undefined }))
    const line = { id: Date.now() + Math.random(), speaker: u.speaker, text: u.text }
    linesRef.current = [...linesRef.current, line].slice(-200)
    setLines(linesRef.current)
    if (settingsRef.current.roomShareTranscript) window.api.sendRoomMessage({ name: ROOM_NAMES[u.speaker], text: u.text })
    if (triggers(u.speaker)) {
      pendingRef.current = `${pendingRef.current} ${u.text}`.trim()
      schedulePending()
    }
  }

  async function start() {
    try {
      setStatus('Connecting…')
      const grant = await window.api.sttAuth()
      if (!grant.ok || !grant.auth) throw new Error(grant.error ?? 'Transcription is unavailable right now.')
      const stt = new DeepgramStream(grant.auth, onUtterance, (reason) => {
        setStatus(`Stopped: ${reason}`)
        stop()
      })
      await stt.connect()
      sttRef.current = stt
      const capture = await startCapture((pcm) => stt.send(pcm), settingsRef.current.captureMic)
      captureRef.current = capture
      setRunning(true)
      const sources = [capture.hasSystemAudio && 'call audio', capture.hasMic && 'your mic'].filter(Boolean)
      setStatus(`Listening: ${sources.join(' + ')}`)
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`)
      await stop()
    }
  }

  async function stop() {
    window.clearTimeout(pauseTimerRef.current)
    pendingRef.current = ''
    sttRef.current?.close()
    sttRef.current = null
    await captureRef.current?.stop()
    captureRef.current = null
    setRunning(false)
  }

  return (
    <div className="live">
      <div className="row controls">
        <button className={running ? 'danger' : 'primary'} onClick={running ? stop : start}>
          {running ? 'Stop' : 'Start listening'} <Kbd action="toggleListening" />
        </button>
        <button onClick={answerLast}>
          Answer now <Kbd action="answerNow" />
        </button>
        <button onClick={answerScreenshot} title="Screenshot the screen under the mouse and ask the AI about it">
          Screenshot <Kbd action="screenshotAnswer" />
        </button>
        <span className="status">{status}</span>
      </div>

      <AnswerCard
        card={card}
        setCard={setCard}
        sectionRef={cardRef}
        autoScroll={settings.autoScroll}
        empty="Answers appear here when the other person asks a question."
      />

      <section className="transcript" ref={transcriptRef}>
        {lines.slice(-40).map((l) => (
          <div key={l.id} className={`line ${l.speaker}`}>
            <b>{l.speaker === 'them' ? 'Them' : 'You'}</b> {l.text}
          </div>
        ))}
        {(['them', 'you'] as Speaker[]).map(
          (s) =>
            interim[s] && (
              <div key={s} className={`line ${s} interim`}>
                <b>{s === 'them' ? 'Them' : 'You'}</b> {interim[s]}
              </div>
            )
        )}
      </section>
    </div>
  )
}
