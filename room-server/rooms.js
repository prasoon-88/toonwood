import { randomBytes } from 'node:crypto'
import { safeEqual } from './util.js'

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

export { MAX_IMAGE }

/**
 * Room logic (host creates, guests join by QR) on a Socket.IO server.
 * Returns a small handle used by HTTP routes and shutdown.
 */
export function attachRooms(io, { appKey, publicUrl }) {
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
    return { roomId: room.id, hostKey: room.hostKey, joinUrl: `${publicUrl}/r/${room.id}`, messages: room.messages }
  }

  function handleHost(socket) {
    if (appKey && !safeEqual(socket.handshake.auth.appKey, appKey)) {
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
  const sweeper = setInterval(() => {
    const now = Date.now()
    for (const room of rooms.values()) {
      if (now - room.createdAt > ROOM_TTL_MS) closeRoom(room, 'This room expired.')
      else if (room.hostLeftAt && now - room.hostLeftAt > HOST_GRACE_MS) closeRoom(room, 'The host left.')
    }
  }, 60 * 1000)
  sweeper.unref()

  return {
    count: () => rooms.size,
    has: (id) => rooms.has(id),
    stop: () => clearInterval(sweeper)
  }
}
