import express from 'express'

// Product API used by the desktop app. Third-party service keys live only here, never in the app:
// - POST /api/stt/token   short-lived Deepgram token for live transcription
// - POST /api/classify    preset matching with TypeSafe Jev
// Requests carry X-Device-Id (random per install) and, if APP_KEY is set, X-App-Key.

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY ?? ''
const TYPESAFE_API_KEY = process.env.TYPESAFE_API_KEY ?? ''
// Overridable for tests / regional endpoints.
const DEEPGRAM_API_URL = process.env.DEEPGRAM_API_URL ?? 'https://api.deepgram.com'
const TYPESAFE_API_URL = process.env.TYPESAFE_API_URL ?? 'https://api.typesafe.ai'

const HOUR_MS = 60 * 60 * 1000
const STT_TOKEN_TTL_S = 60
const MAX_PRESETS = 254
const MAX_STATE = 8000
const MAX_PRESET_TEXT = 500

/** Fixed-window rate limiter kept in memory, per device and per IP (IP gets a higher ceiling for shared networks). */
function rateLimit(bucket, perHour) {
  const hits = new Map()
  setInterval(() => hits.clear(), HOUR_MS).unref()
  return (req, res, next) => {
    for (const [key, max] of [
      [`d:${req.deviceId}`, perHour],
      [`ip:${req.ip}`, perHour * 5]
    ]) {
      const count = (hits.get(key) ?? 0) + 1
      hits.set(key, count)
      if (count > max) return res.status(429).json({ error: `Too many ${bucket} requests, try again later` })
    }
    next()
  }
}

function requireApp(appKey, safeEqual) {
  return (req, res, next) => {
    if (appKey && !safeEqual(req.get('x-app-key'), appKey)) return res.status(401).json({ error: 'Unknown app' })
    const deviceId = req.get('x-device-id') ?? ''
    if (!/^[A-Za-z0-9-]{8,64}$/.test(deviceId)) return res.status(400).json({ error: 'Missing device id' })
    req.deviceId = deviceId
    next()
  }
}

async function deepgramToken() {
  const res = await fetch(`${DEEPGRAM_API_URL}/v1/auth/grant`, {
    method: 'POST',
    headers: { Authorization: `Token ${DEEPGRAM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl_seconds: STT_TOKEN_TTL_S }),
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) throw new Error(`Deepgram ${res.status}`)
  const data = await res.json()
  return { token: data.access_token, expiresIn: data.expires_in }
}

/** Ask Jev whether the last lines are a question and which preset (by index) they match. */
async function jevClassify(state, presets) {
  const criteria = {}
  presets.forEach((text, i) => (criteria[`p${i}`] = text))
  criteria.none_of_these = 'None of the above, or not a question'

  const questions = {
    is_question: {
      type: 'noul',
      instructions:
        'The LAST lines contain a complete question or request for information that the user should answer now (not a greeting, not cut off mid-sentence)'
    }
  }
  if (presets.length) {
    questions.preset = {
      type: 'choice',
      instructions: 'Which prepared question has the same meaning as the LAST lines (meaning, not exact words)?',
      criteria
    }
  }

  const res = await fetch(`${TYPESAFE_API_URL}/v1/systemone`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TYPESAFE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'jev-latest', state, questions }),
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) throw new Error(`Jev ${res.status}`)
  const data = await res.json()
  const probabilities = presets.map((_, i) => data.answers.preset?.probabilities?.[`p${i}`] ?? 0)
  return { isQuestion: data.answers.is_question.noul, probabilities }
}

export function createApi({ appKey, safeEqual }) {
  const api = express.Router()
  api.use(express.json({ limit: '64kb' }))
  api.use(requireApp(appKey, safeEqual))

  api.post('/stt/token', rateLimit('transcription', 120), async (_req, res) => {
    if (!DEEPGRAM_API_KEY) return res.status(503).json({ error: 'Transcription is not configured on the server' })
    try {
      res.json(await deepgramToken())
    } catch (err) {
      console.error('stt token:', err.message)
      res.status(502).json({ error: 'Transcription service unavailable' })
    }
  })

  api.post('/classify', rateLimit('classify', 2000), async (req, res) => {
    if (!TYPESAFE_API_KEY) return res.status(503).json({ error: 'Preset matching is not configured on the server' })
    const { state, presets } = req.body ?? {}
    if (typeof state !== 'string' || !state.trim() || !Array.isArray(presets) || presets.some((p) => typeof p !== 'string')) {
      return res.status(400).json({ error: 'Expected { state: string, presets: string[] }' })
    }
    try {
      res.json(await jevClassify(state.slice(-MAX_STATE), presets.slice(0, MAX_PRESETS).map((p) => p.slice(0, MAX_PRESET_TEXT))))
    } catch (err) {
      console.error('classify:', err.message)
      res.status(502).json({ error: 'Preset matching service unavailable' })
    }
  })

  api.use((_req, res) => res.status(404).json({ error: 'Not found' }))
  return api
}
