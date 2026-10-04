export interface Capture {
  hasSystemAudio: boolean
  hasMic: boolean
  stop: () => Promise<void>
}

/**
 * Mic -> channel 0 ("you"), system loopback audio -> channel 1 ("them"), as 16 kHz PCM chunks.
 * With `useMic` off the microphone is never opened and channel 0 stays silent.
 */
export async function startCapture(onChunk: (pcm: ArrayBuffer) => void, useMic: boolean): Promise<Capture> {
  const mic = useMic
    ? await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    : null

  let system: MediaStream | null = null
  try {
    // The main process answers this with { audio: 'loopback' } — no picker is shown.
    // The (tiny) video track is required by the API; it is kept alive but unused,
    // because stopping it can also end the loopback audio track.
    system = await navigator.mediaDevices.getDisplayMedia({
      video: { width: 1, height: 1, frameRate: 1 },
      audio: true
    })
    if (!system.getAudioTracks().length) system = null
  } catch (err) {
    console.warn('System audio capture unavailable', err)
  }
  if (!mic && !system) throw new Error('Could not capture call audio. Turn on "Use my microphone" in Settings to use the mic instead.')

  const ctx = new AudioContext({ sampleRate: 16000 })
  await ctx.audioWorklet.addModule(new URL('pcm-worklet.js', document.baseURI).href)

  const merger = ctx.createChannelMerger(2)
  if (mic) ctx.createMediaStreamSource(mic).connect(merger, 0, 0)
  if (system) ctx.createMediaStreamSource(new MediaStream(system.getAudioTracks())).connect(merger, 0, 1)

  const worklet = new AudioWorkletNode(ctx, 'pcm-worklet', {
    channelCount: 2,
    channelCountMode: 'explicit',
    channelInterpretation: 'discrete'
  })
  worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => onChunk(e.data)
  merger.connect(worklet)
  // Keep the node pulled by the graph without playing anything back.
  const mute = ctx.createGain()
  mute.gain.value = 0
  worklet.connect(mute).connect(ctx.destination)

  return {
    hasSystemAudio: Boolean(system),
    hasMic: Boolean(mic),
    stop: async () => {
      mic?.getTracks().forEach((t) => t.stop())
      system?.getTracks().forEach((t) => t.stop())
      await ctx.close()
    }
  }
}
