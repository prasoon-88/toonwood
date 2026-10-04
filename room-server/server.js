import './env.js'
import { createServer } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createRequire } from 'node:module'
import { networkInterfaces } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { Server } from 'socket.io'
import { createApi } from './api.js'

const PORT = Number(process.env.PORT ?? 3030)
/**
 * Shared key built into the desktop app. If set, only the app can use the API and host rooms
 * (keeps strangers from spending your Deepgram / TypeSafe credits).
 */
const APP_KEY = process.env.APP_KEY ?? ''

const ROOM_TTL_MS = 12 * 60 * 60 * 1000
const HOST_GRACE_MS = 30 * 60 * 1000
const MAX_HISTORY = 500
const MAX_TEXT = 1000
/** Host messages carry full AI answers and the shared call transcript. */
const MAX_HOST_TEXT = 10000
/** Host pictures (screenshots from the app): JPEG/PNG/WebP data: URLs only. */
const MAX_IMAGE = 1024 * 1024
const MAX_IMAGES_PER_ROOM = 30
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/
const MAX_NAME = 40
const MAX_GUESTS = 50
const MIN_SEND_INTERVAL_MS = 800

function lanIp() {
  const all = Object.values(networkInterfaces()).flat()
  const ipv4 = all.filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => a.address)
  return ipv4.find((a) => a.startsWith('192.168.')) ?? ipv4.find((a) => a.startsWith('10.')) ?? ipv4[0] ?? 'localhost'
}

/** Base URL that phones use; on a hosted server set PUBLIC_URL to its https address. */
const PUBLIC_URL = (process.env.PUBLIC_URL ?? `http://${lanIp()}:${PORT}`).replace(/\/$/, '')

function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ''))
  const y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Single-line text (names): collapse all whitespace. */
function cleanText(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

/** Message text: keep line breaks so Markdown lists/code survive, but tidy runs of spaces and blank lines. */
function cleanMessage(value, max) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)
}

function cleanImage(value) {
  return typeof value === 'string' && value.length <= MAX_IMAGE && IMAGE_DATA_URL.test(value) ? value : undefined
}

/**
 * @typedef {{ id: number, name: string, text: string, at: number, host: boolean, image?: string }} Message
 * @typedef {{ id: string, hostKey: string, messages: Message[], nextId: number, createdAt: number,
 *   hostSocketId: string | null, hostLeftAt: number | null }} Room
 */
/** @type {Map<string, Room>} */
const rooms = new Map()

function newRoomId() {
  // 8 chars from an unambiguous alphabet: hard to guess, easy to read aloud.
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  let id
  do id = Array.from(randomBytes(8), (b) => alphabet[b % alphabet.length]).join('')
  while (rooms.has(id))
  return id
}

const app = express()
const http = createServer(app)
// Room for one host picture per packet; guests are still limited to MAX_TEXT by cleanMessage.
const io = new Server(http, { maxHttpBufferSize: MAX_IMAGE + 64 * 1024 })

app.disable('x-powered-by')
// Behind a hosting proxy (Render, Railway, nginx) this makes req.ip the real client IP for rate limiting.
if (process.env.TRUST_PROXY) app.set('trust proxy', 1)
app.get('/health', (_req, res) => res.json({ ok: true, rooms: rooms.size }))
app.use('/api', createApi({ appKey: APP_KEY, safeEqual }))
// Markdown rendering on the phone page: parsed with marked, sanitized with DOMPurify (served locally, no CDN).
const require = createRequire(import.meta.url)
// The browser builds aren't in the packages' "exports", so locate them next to the main entry.
const VENDOR = {
  'marked.js': join(dirname(require.resolve('marked')), 'marked.umd.js'),
  'purify.js': join(dirname(require.resolve('dompurify')), 'purify.min.js')
}
app.get('/vendor/:file', (req, res) => {
  const file = VENDOR[req.params.file]
  if (!file) return res.sendStatus(404)
  res.set('Cache-Control', 'public, max-age=86400').sendFile(file)
})
app.get('/r/:id', (req, res) => {
  if (!rooms.has(req.params.id)) return res.status(404).send('This room does not exist or has been closed.')
  res.sendFile(fileURLToPath(new URL('./public/room.html', import.meta.url)))
})

function presence(room) {
  const guests = [...(io.sockets.adapter.rooms.get(room.id) ?? [])]
    .map((sid) => io.sockets.sockets.get(sid))
    .filter((s) => s?.data.role === 'guest')
    .map((s) => s.data.name)
  io.to(room.id).emit('room:presence', { guests, hostOnline: Boolean(room.hostSocketId) })
}

function post(room, name, text, host, image) {
  const message = { id: room.nextId++, name, text, at: Date.now(), host }
  if (image) message.image = image
  room.messages.push(message)
  if (room.messages.length > MAX_HISTORY) room.messages.shift()
  // Keep memory bounded: older pictures are dropped from the history (people already in the room keep them).
  const withImages = room.messages.filter((m) => m.image)
  for (const m of withImages.slice(0, -MAX_IMAGES_PER_ROOM)) {
    delete m.image
    if (!m.text) m.text = '_(picture no longer available)_'
  }
  io.to(room.id).emit('message:new', message)
}

function closeRoom(room, reason) {
  io.to(room.id).emit('room:closed', { reason })
  io.in(room.id).disconnectSockets(true)
  rooms.delete(room.id)
}

function rateLimited(socket) {
  const now = Date.now()
  if (now - (socket.data.lastSend ?? 0) < MIN_SEND_INTERVAL_MS) return true
  socket.data.lastSend = now
  return false
}

function attachHost(socket, room) {
  room.hostSocketId = socket.id
  room.hostLeftAt = null
  socket.data.roomId = room.id
  socket.join(room.id)
  presence(room)
  return { roomId: room.id, hostKey: room.hostKey, joinUrl: `${PUBLIC_URL}/r/${room.id}`, messages: room.messages }
}

function handleHost(socket) {
  if (APP_KEY && !safeEqual(socket.handshake.auth.appKey, APP_KEY)) {
    socket.emit('fatal', { error: 'Unknown app' })
    return socket.disconnect(true)
  }

  socket.on('room:create', (ack) => {
    if (typeof ack !== 'function') return
    const room = {
      id: newRoomId(),
      hostKey: randomBytes(16).toString('hex'),
      messages: [],
      nextId: 1,
      createdAt: Date.now(),
      hostSocketId: null,
      hostLeftAt: null
    }
    rooms.set(room.id, room)
    ack({ ok: true, ...attachHost(socket, room) })
  })

  // After a reconnect the host takes its room back with the key it got at creation.
  socket.on('room:resume', (payload, ack) => {
    if (typeof ack !== 'function') return
    const room = rooms.get(payload?.roomId)
    if (!room || !safeEqual(payload?.hostKey, room.hostKey)) return ack({ ok: false, error: 'Room not found' })
    ack({ ok: true, ...attachHost(socket, room) })
  })

  // The app posts its own messages plus the shared Live session ("Copilot", "Call · Them"…), optionally with a picture.
  socket.on('message:send', (payload) => {
    const room = rooms.get(socket.data.roomId)
    const text = cleanMessage(payload?.text, MAX_HOST_TEXT)
    const image = cleanImage(payload?.image)
    const name = cleanText(payload?.name, MAX_NAME) || 'Host'
    if (room && (text || image)) post(room, name, text, true, image)
  })

  socket.on('room:close', () => {
    const room = rooms.get(socket.data.roomId)
    if (room && room.hostSocketId === socket.id) closeRoom(room, 'The host closed the room.')
  })

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomId)
    if (!room || room.hostSocketId !== socket.id) return
    room.hostSocketId = null
    room.hostLeftAt = Date.now()
    presence(room)
  })
}

function handleGuest(socket) {
  const room = rooms.get(socket.handshake.auth.roomId)
  const name = cleanText(socket.handshake.auth.name, MAX_NAME) || 'Guest'
  if (!room) {
    socket.emit('fatal', { error: 'This room does not exist or has been closed.' })
    return socket.disconnect(true)
  }
  if ((io.sockets.adapter.rooms.get(room.id)?.size ?? 0) > MAX_GUESTS) {
    socket.emit('fatal', { error: 'This room is full.' })
    return socket.disconnect(true)
  }

  socket.data.name = name
  socket.data.roomId = room.id
  socket.join(room.id)
  socket.emit('room:history', room.messages)
  presence(room)

  socket.on('message:send', (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {}
    const text = cleanMessage(payload?.text, MAX_TEXT)
    if (!text) return reply({ ok: false, error: 'Empty message' })
    if (!rooms.has(room.id)) return reply({ ok: false, error: 'Room closed' })
    if (rateLimited(socket)) return reply({ ok: false, error: 'Slow down a little' })
    post(room, name, text, false)
    reply({ ok: true })
  })

  socket.on('disconnect', () => {
    if (rooms.has(room.id)) presence(room)
  })
}

io.on('connection', (socket) => {
  socket.data.role = socket.handshake.auth?.role === 'host' ? 'host' : 'guest'
  if (socket.data.role === 'host') handleHost(socket)
  else handleGuest(socket)
})

// Drop rooms that are too old or whose host has been gone for a while.
setInterval(() => {
  const now = Date.now()
  for (const room of rooms.values()) {
    if (now - room.createdAt > ROOM_TTL_MS) closeRoom(room, 'This room expired.')
    else if (room.hostLeftAt && now - room.hostLeftAt > HOST_GRACE_MS) closeRoom(room, 'The host left.')
  }
}, 60 * 1000).unref()

http.listen(PORT, () => {
  console.log(`Room server listening on :${PORT}`)
  console.log(`Guests join at ${PUBLIC_URL}/r/<roomId>`)
  console.log(`App key ${APP_KEY ? 'required' : 'NOT set (anyone can use the API)'}`)
  if (!process.env.DEEPGRAM_API_KEY) console.warn('DEEPGRAM_API_KEY not set: live transcription will not work')
  if (!process.env.TYPESAFE_API_KEY) console.warn('TYPESAFE_API_KEY not set: the app falls back to local preset matching')
})
