import './env.js'
import { networkInterfaces } from 'node:os'
import { fileURLToPath } from 'node:url'
import { createServer } from './app.js'
import { createDb } from './db/index.js'

const PORT = Number(process.env.PORT ?? 3030)

function lanIp() {
  const all = Object.values(networkInterfaces()).flat()
  const ipv4 = all.filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => a.address)
  return ipv4.find((a) => a.startsWith('192.168.')) ?? ipv4.find((a) => a.startsWith('10.')) ?? ipv4[0] ?? 'localhost'
}

/** Base URL that phones use; on a hosted server set PUBLIC_URL to its https address. */
const publicUrl = (process.env.PUBLIC_URL ?? `http://${lanIp()}:${PORT}`).replace(/\/$/, '')

const config = {
  appKey: process.env.APP_KEY ?? '',
  publicUrl,
  webUrl: (process.env.WEB_URL ?? publicUrl).replace(/\/$/, ''),
  trustProxy: Boolean(process.env.TRUST_PROXY),
  secureCookies: publicUrl.startsWith('https://'),
  webDist: null
}

// Local dev without Postgres: PGlite stored in .data/. Production must set DATABASE_URL.
const LOCAL_DB = `pglite:${fileURLToPath(new URL('./.data/pglite', import.meta.url))}`
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL is required')
const db = await createDb(process.env.DATABASE_URL ?? LOCAL_DB)

const { http } = createServer({ config, db })

http.listen(PORT, () => {
  console.log(`Toonwide server listening on :${PORT}`)
  console.log(`Guests join at ${publicUrl}/r/<roomId>`)
  console.log(`App key ${config.appKey ? 'required' : 'NOT set (anyone can use the API)'}`)
  if (!process.env.DEEPGRAM_API_KEY) console.warn('DEEPGRAM_API_KEY not set: live transcription will not work')
  if (!process.env.TYPESAFE_API_KEY) console.warn('TYPESAFE_API_KEY not set: the app falls back to local preset matching')
})
