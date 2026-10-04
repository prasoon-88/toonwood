import type { SttAuth } from '../../../shared/types'

export type Speaker = 'you' | 'them'

export interface Utterance {
  speaker: Speaker
  text: string
  final: boolean
}

interface DeepgramMessage {
  type: string
  channel_index?: number[]
  channel?: { alternatives?: { transcript?: string }[] } | number[]
  is_final?: boolean
  speech_final?: boolean
}

const SPEAKERS: Speaker[] = ['you', 'them']

/** Streams 2-channel linear16 audio to Deepgram and emits per-speaker utterances. */
export class DeepgramStream {
  private ws: WebSocket | null = null
  private keepAlive: number | undefined
  private pending = ['', '']

  constructor(
    /** The user's own Deepgram key, or a short-lived token from the Call Copilot backend. */
    private auth: SttAuth,
    private onUtterance: (u: Utterance) => void,
    private onClose: (reason: string) => void
  ) {}

  connect(): Promise<void> {
    const params = new URLSearchParams({
      model: 'nova-3',
      encoding: 'linear16',
      sample_rate: '16000',
      channels: '2',
      multichannel: 'true',
      interim_results: 'true',
      smart_format: 'true',
      endpointing: '600',
      utterance_end_ms: '1500'
    })
    const ws = new WebSocket(`wss://api.deepgram.com/v1/listen?${params}`, [this.auth.scheme, this.auth.value])
    this.ws = ws
    ws.onmessage = (e) => this.handle(JSON.parse(e.data as string) as DeepgramMessage)
    ws.onclose = (e) => {
      window.clearInterval(this.keepAlive)
      this.onClose(e.reason || `Connection closed (${e.code})`)
    }
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        this.keepAlive = window.setInterval(() => this.sendJson({ type: 'KeepAlive' }), 8000)
        resolve()
      }
      ws.onerror = () => reject(new Error('Could not start transcription. Try again in a moment.'))
    })
  }

  send(pcm: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(pcm)
  }

  close(): void {
    this.sendJson({ type: 'CloseStream' })
    window.clearInterval(this.keepAlive)
    this.ws?.close()
    this.ws = null
  }

  private sendJson(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg))
  }

  private flush(ch: number): void {
    const text = this.pending[ch].trim()
    this.pending[ch] = ''
    if (text) this.onUtterance({ speaker: SPEAKERS[ch], text, final: true })
  }

  private handle(msg: DeepgramMessage): void {
    if (msg.type === 'UtteranceEnd') {
      const ch = Array.isArray(msg.channel) ? msg.channel[0] : 0
      this.flush(ch)
      return
    }
    if (msg.type !== 'Results' || Array.isArray(msg.channel)) return
    const ch = msg.channel_index?.[0] ?? 0
    const text = msg.channel?.alternatives?.[0]?.transcript ?? ''
    if (msg.is_final) {
      if (text) this.pending[ch] = `${this.pending[ch]} ${text}`.trim()
      if (msg.speech_final) this.flush(ch)
      else if (this.pending[ch]) this.onUtterance({ speaker: SPEAKERS[ch], text: this.pending[ch], final: false })
    } else if (text) {
      this.onUtterance({ speaker: SPEAKERS[ch], text: `${this.pending[ch]} ${text}`.trim(), final: false })
    }
  }
}
