// Converts the 2-channel graph (ch0 = mic / "you", ch1 = system audio / "them")
// into interleaved 16-bit PCM chunks of ~100 ms for Deepgram multichannel streaming.
const CHUNK_SAMPLES = 1600 * 2

function toInt16(s) {
  s = Math.max(-1, Math.min(1, s))
  return s < 0 ? s * 0x8000 : s * 0x7fff
}

class PcmWorklet extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buf = new Int16Array(CHUNK_SAMPLES)
    this.n = 0
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true
    const left = input[0]
    const right = input[1] || input[0]
    for (let i = 0; i < left.length; i++) {
      this.buf[this.n++] = toInt16(left[i])
      this.buf[this.n++] = toInt16(right[i])
      if (this.n === CHUNK_SAMPLES) {
        this.port.postMessage(this.buf.buffer, [this.buf.buffer])
        this.buf = new Int16Array(CHUNK_SAMPLES)
        this.n = 0
      }
    }
    return true
  }
}

registerProcessor('pcm-worklet', PcmWorklet)
