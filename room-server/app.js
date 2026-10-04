import { existsSync } from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import express from 'express'
import { Server } from 'socket.io'
import { accountRouter } from './account/routes.js'
import { createApi } from './api.js'
import { authRouter } from './auth/routes.js'
import { attachRooms, MAX_IMAGE } from './rooms.js'
import { safeEqual } from './util.js'

const require = createRequire(import.meta.url)
// Markdown rendering on the phone page: browser builds of marked and DOMPurify, served locally (no CDN).
const VENDOR = {
  'marked.js': join(dirname(require.resolve('marked')), 'marked.umd.js'),
  'purify.js': join(dirname(require.resolve('dompurify')), 'purify.min.js')
}
const ROOM_PAGE = fileURLToPath(new URL('./public/room.html', import.meta.url))

/**
 * Build the whole backend without listening, so tests can run it on a random port.
 * `config`: { appKey, publicUrl, webUrl, trustProxy, secureCookies, webDist }.
 */
export function createServer({ config, db = null, mailer = null, now = () => new Date() }) {
  const app = express()
  const http = createHttpServer(app)
  // Room for one host picture per packet; guests are still limited by the room's text checks.
  const io = new Server(http, { maxHttpBufferSize: MAX_IMAGE + 64 * 1024 })
  const rooms = attachRooms(io, { appKey: config.appKey, publicUrl: config.publicUrl })

  app.disable('x-powered-by')
  // Behind a hosting proxy (Render, Railway, nginx) this makes req.ip the real client IP for rate limiting.
  if (config.trustProxy) app.set('trust proxy', 1)

  app.get('/health', (_req, res) => res.json({ ok: true, rooms: rooms.count() }))
  app.use(cookieParser())
  // Website routes first: the app API below rejects anything without a device id.
  app.use('/api/auth', authRouter({ db, mailer, config, now }))
  app.use('/api/account', accountRouter({ db, now }))
  app.use('/api', createApi({ appKey: config.appKey, safeEqual }))
  app.get('/vendor/:file', (req, res) => {
    const file = VENDOR[req.params.file]
    if (!file) return res.sendStatus(404)
    res.set('Cache-Control', 'public, max-age=86400').sendFile(file)
  })
  app.get('/r/:id', (req, res) => {
    if (!rooms.has(req.params.id)) return res.status(404).send('This room does not exist or has been closed.')
    res.sendFile(ROOM_PAGE)
  })

  // The website (web/ build). Only its own routes fall back to index.html, so /api, /r and /socket.io are untouched.
  const SITE_ROUTES = ['/', '/signup', '/login', '/verify', '/forgot', '/reset', '/dashboard']
  if (config.webDist && existsSync(join(config.webDist, 'index.html'))) {
    app.use(express.static(config.webDist, { index: false, maxAge: '1h' }))
    app.get(SITE_ROUTES, (_req, res) => res.sendFile(join(config.webDist, 'index.html')))
  }

  async function close() {
    rooms.stop()
    await new Promise((resolve) => io.close(() => resolve()))
  }

  return { app, http, io, close }
}
