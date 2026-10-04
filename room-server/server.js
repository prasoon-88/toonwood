import './env.js'
import { networkInterfaces } from 'node:os'
import { fileURLToPath } from 'node:url'
import { createServer } from './app.js'
import { productionProblems, trustProxyOn } from './config.js'
import { createDb } from './db/index.js'
import { createMailer } from './mail/index.js'

const PORT = Number(process.env.PORT ?? 3030)

function lanIp() {
  const all = Object.values(networkInterfaces()).flat()
  const ipv4 = all.filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => a.address)
  return ipv4.find((a) => a.startsWith('192.168.')) ?? ipv4.find((a) => a.startsWith('10.')) ?? ipv4[0] ?? 'localhost'
}

/** Base URL that phones use; on a hosted server set PUBLIC_URL to its https address. */
const publicUrl = (process.env.PUBLIC_URL ?? `http://${lanIp()}:${PORT}`).replace(/\/$/, '')

const production = process.env.NODE_ENV === 'production' || publicUrl.startsWith('https://')
const problems = productionProblems(process.env, publicUrl)
if (problems.length) throw new Error(`Refusing to start in production:\n - ${problems.join('\n - ')}`)

const config = {
  appKey: process.env.APP_KEY ?? '',
  publicUrl,
  webUrl: (process.env.WEB_URL ?? publicUrl).replace(/\/$/, ''),
  trustProxy: trustProxyOn(process.env.TRUST_PROXY),
  secureCookies: publicUrl.startsWith('https://'),
  webDist: process.env.WEB_DIST ?? fileURLToPath(new URL('../web/dist', import.meta.url))
}

// Local dev without Postgres: PGlite stored in .data/. Production must set DATABASE_URL.
const LOCAL_DB = `pglite:${fileURLToPath(new URL('./.data/pglite', import.meta.url))}`
const db = await createDb(process.env.DATABASE_URL ?? LOCAL_DB)

const mailDriver = process.env.MAIL_DRIVER ?? (production ? 'resend' : 'console')
const mailer = createMailer({
  driver: mailDriver,
  apiKey: process.env.RESEND_API_KEY ?? '',
  from: process.env.MAIL_FROM,
  outboxFile: process.env.MAIL_OUTBOX ?? ''
})

const { http } = createServer({ config, db, mailer })

http.listen(PORT, () => {
  console.log(`Toonwide server listening on :${PORT}`)
  console.log(`Guests join at ${publicUrl}/r/<roomId>`)
  console.log(`App key ${config.appKey ? 'required' : 'NOT set (anyone can use the API)'}`)
  if (!process.env.DEEPGRAM_API_KEY) console.warn('DEEPGRAM_API_KEY not set: live transcription will not work')
  if (!process.env.TYPESAFE_API_KEY) console.warn('TYPESAFE_API_KEY not set: the app falls back to local preset matching')
})
