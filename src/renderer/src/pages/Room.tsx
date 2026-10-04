import { useEffect, useRef, useState } from 'react'
import type { RoomMessage, RoomState, Settings } from '../../../shared/types'
import { AnswerCard, copyAnswer, scrollAnswer } from '../components/AnswerCard'
import { Markdown } from '../components/Markdown'
import { Kbd, useCommands } from '../commands'
import { useAssistant } from '../hooks/useAssistant'

const CONTEXT_MESSAGES = 12

interface Props {
  settings: Settings
  update: (patch: Partial<Settings>) => Promise<void>
}

function time(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function Room({ settings, update }: Props) {
  const [room, setRoom] = useState<RoomState>({ status: 'idle', guests: [], messages: [] })
  const [showQr, setShowQr] = useState(true)
  const [copied, setCopied] = useState(false)
  /** "<message id>:text|image" of the message whose Copy button was just clicked. */
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [answeringId, setAnsweringId] = useState<number | null>(null)
  /** "New chat" hides messages up to this id (they stay on the server for guests). */
  const [clearedBefore, setClearedBefore] = useState(0)
  const { card, setCard, respond } = useAssistant(settings)
  const lastHandledRef = useRef<number | null>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const cardRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<HTMLElement | null>(null)

  const visible = room.messages.filter((m) => m.id > clearedBefore)

  useEffect(() => {
    window.api.roomState().then(setRoom)
    return window.api.onRoomState(setRoom)
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (el && settings.autoScroll) el.scrollTop = el.scrollHeight
  }, [visible.length, settings.autoScroll])

  useCommands('room', (action) => {
    if (action === 'answerNow') answerLatest()
    else if (action === 'newChat') newChat()
    else if (action === 'copyAnswer') copyAnswer(card)
    else if (action === 'scrollUp') scrollAnswer(cardRef, -1)
    else if (action === 'scrollDown') scrollAnswer(cardRef, 1)
  })

  function contextUpTo(id: number): string {
    return room.messages
      .filter((m) => m.id <= id && m.id > clearedBefore)
      .slice(-CONTEXT_MESSAGES)
      .map((m) => `${m.name}: ${m.text}`)
      .join('\n')
  }

  function answer(m: RoomMessage, force: boolean) {
    setAnsweringId(m.id)
    respond(m.text, contextUpTo(m.id), force).catch((err) =>
      setCard(() => ({ question: m.text, source: 'Error', text: '', error: err.message }))
    )
  }

  function answerLatest() {
    const latest = [...visible].reverse().find((m) => !m.host)
    if (latest) answer(latest, true)
  }

  function newChat() {
    setClearedBefore(room.messages.at(-1)?.id ?? 0)
    setAnsweringId(null)
    setCard(() => null)
  }

  // Auto-answer only messages that arrive while the room is open, never the history.
  useEffect(() => {
    const latest = room.messages.at(-1)
    if (!latest) return
    if (lastHandledRef.current === null) {
      lastHandledRef.current = latest.id
      return
    }
    const fresh = room.messages.filter((m) => m.id > lastHandledRef.current! && !m.host)
    lastHandledRef.current = latest.id
    const newest = fresh.at(-1)
    if (newest && settingsRef.current.roomAutoAnswer) answer(newest, false)
  }, [room.messages])

  async function copyMessage(m: RoomMessage, what: 'text' | 'image') {
    if (what === 'image' && m.image) await window.api.copyImage(m.image)
    else await window.api.copyText(m.text)
    const id = `${m.id}:${what}`
    setCopiedId(id)
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1200)
  }

  async function copyLink() {
    if (!room.joinUrl) return
    await window.api.copyText(room.joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const live = room.status === 'open' || room.status === 'reconnecting'

  if (!live) {
    return (
      <div className="page room-empty">
        <div className="room-hero">
          <h2>Room</h2>
          <p className="muted">
            Start a room and show the QR code. Anyone who scans it can send messages from their phone. The assistant
            answers them here.
          </p>
          <button className="primary big" onClick={() => window.api.startRoom()} disabled={room.status === 'connecting'}>
            {room.status === 'connecting' ? 'Connecting…' : 'Start room'}
          </button>
          {room.error && <div className="error">{room.error}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="live room">
      <div className="room-bar">
        <span className={`pill ${room.status === 'open' ? 'on' : 'warn'}`}>
          {room.status === 'open' ? '● Live' : '● Reconnecting'}
        </span>
        <span className="room-count" title={room.guests.join(', ')}>
          {room.guests.length} {room.guests.length === 1 ? 'person' : 'people'}
        </span>
        <button className="tool" onClick={() => setShowQr((v) => !v)}>
          {showQr ? 'Hide QR' : 'Show QR'}
        </button>
        <button className="tool danger-text" onClick={() => window.api.stopRoom(true)}>
          Close room
        </button>
      </div>

      {showQr && (
        <div className="qr-panel">
          {room.qr && <img className="qr" src={room.qr} alt="QR code to join the room" />}
          <div className="qr-side">
            <div className="small muted">Scan to join</div>
            <div className="room-code">{room.roomId}</div>
            <button className="tool" onClick={copyLink}>
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          </div>
        </div>
      )}

      <div className="row room-actions">
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.roomAutoAnswer}
            onChange={(e) => update({ roomAutoAnswer: e.target.checked })}
          />
          Auto-answer
        </label>
        <label className="switch" title="Post the Live tab's transcript (both sides of the call) to this room">
          <input
            type="checkbox"
            checked={settings.roomShareTranscript}
            onChange={(e) => update({ roomShareTranscript: e.target.checked })}
          />
          Share transcript
        </label>
        <label className="switch" title="Post Live answers and their screenshots to this room">
          <input
            type="checkbox"
            checked={settings.roomShareAnswers}
            onChange={(e) => update({ roomShareAnswers: e.target.checked })}
          />
          Share answers
        </label>
        <button onClick={answerLatest} disabled={!visible.some((m) => !m.host)}>
          Answer latest <Kbd action="answerNow" />
        </button>
      </div>

      <AnswerCard
        card={card}
        setCard={setCard}
        sectionRef={cardRef}
        autoScroll={settings.autoScroll}
        empty="Answers to room messages appear here."
      />

      <section className="chat" ref={listRef}>
        {visible.length === 0 && <div className="chat-empty">No messages yet. Share the QR code to get started.</div>}
        {visible.slice(-80).map((m) => (
          <div key={m.id} className={`bubble-msg ${m.host ? 'host' : ''} ${answeringId === m.id ? 'answering' : ''}`}>
            <div className="bubble-meta">
              <span className="bubble-name">{m.name}</span>
              <span>{time(m.at)}</span>
              <span className="bubble-actions">
                {m.text && (
                  <button className="link-btn" onClick={() => copyMessage(m, 'text')}>
                    {copiedId === `${m.id}:text` ? 'Copied' : 'Copy'}
                  </button>
                )}
                {m.image && (
                  <button className="link-btn" onClick={() => copyMessage(m, 'image')}>
                    {copiedId === `${m.id}:image` ? 'Copied' : 'Copy image'}
                  </button>
                )}
                {!m.host && (
                  <button className="link-btn" onClick={() => answer(m, true)}>
                    Answer
                  </button>
                )}
              </span>
            </div>
            {m.image && <img className="shot" src={m.image} alt="Picture shared to the room" />}
            {m.text && <Markdown text={m.text} />}
          </div>
        ))}
      </section>
    </div>
  )
}
