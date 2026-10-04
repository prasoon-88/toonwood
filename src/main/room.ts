import { nativeImage } from 'electron'
import { io, type Socket } from 'socket.io-client'
import QRCode from 'qrcode'
import type { RoomMessage, RoomPost, RoomState } from '../shared/types'

// Host side of the room: the desktop app connects to room-server over Socket.IO,
// creates a room, and receives guest messages in real time.

interface JoinResult {
  ok: boolean
  error?: string
  roomId: string
  hostKey: string
  joinUrl: string
  messages: RoomMessage[]
}

const ACK_TIMEOUT_MS = 5000
/** Room pictures are re-encoded smaller than the AI's copy: phones don't need full resolution. */
const ROOM_IMAGE_MAX_WIDTH = 1280
const ROOM_IMAGE_QUALITY = 70
let socket: Socket | null = null
let resumeKey: { roomId: string; hostKey: string } | null = null
let state: RoomState = { status: 'idle', guests: [], messages: [] }
let notify: (state: RoomState) => void = () => {}

function setState(patch: Partial<RoomState>): void {
  state = { ...state, ...patch }
  notify(state)
}

export function getRoomState(): RoomState {
  return state
}

export function onRoomState(cb: (state: RoomState) => void): void {
  notify = cb
}

async function joinOrCreate(s: Socket): Promise<void> {
  try {
    let result: JoinResult | null = null
    if (resumeKey) result = await s.timeout(ACK_TIMEOUT_MS).emitWithAck('room:resume', resumeKey)
    if (!result?.ok) result = await s.timeout(ACK_TIMEOUT_MS).emitWithAck('room:create')
    if (!result?.ok) throw new Error(result?.error ?? 'Could not create a room')
    resumeKey = { roomId: result.roomId, hostKey: result.hostKey }
    const qr = await QRCode.toDataURL(result.joinUrl, { margin: 1, width: 260 })
    setState({
      status: 'open',
      roomId: result.roomId,
      joinUrl: result.joinUrl,
      qr,
      messages: result.messages,
      error: undefined
    })
  } catch (err) {
    setState({ status: 'error', error: (err as Error).message })
  }
}

export function startRoom(serverUrl: string, appKey: string): void {
  stopRoom()
  setState({ status: 'connecting', guests: [], messages: [], roomId: undefined, joinUrl: undefined, qr: undefined, error: undefined })

  const s = io(serverUrl, {
    auth: { role: 'host', appKey },
    transports: ['websocket'],
    reconnectionDelayMax: 5000
  })
  socket = s

  s.on('connect', () => joinOrCreate(s))
  s.on('disconnect', () => {
    if (state.status === 'open') setState({ status: 'reconnecting' })
  })
  s.on('connect_error', (err) => {
    setState({ status: state.roomId ? 'reconnecting' : 'error', error: `Cannot reach room server: ${err.message}` })
  })
  s.on('fatal', ({ error }: { error: string }) => {
    s.close()
    socket = null
    setState({ status: 'error', error })
  })
  s.on('message:new', (m: RoomMessage) => setState({ messages: [...state.messages, m].slice(-200) }))
  s.on('room:presence', ({ guests }: { guests: string[] }) => setState({ guests }))
  s.on('room:closed', ({ reason }: { reason: string }) => {
    resumeKey = null
    s.close()
    socket = null
    setState({ status: 'idle', error: reason, roomId: undefined, joinUrl: undefined, qr: undefined, guests: [] })
  })
}

function shrinkImage(dataUrl: string): string | undefined {
  let image = nativeImage.createFromDataURL(dataUrl)
  if (image.isEmpty()) return undefined
  if (image.getSize().width > ROOM_IMAGE_MAX_WIDTH) image = image.resize({ width: ROOM_IMAGE_MAX_WIDTH, quality: 'good' })
  return `data:image/jpeg;base64,${image.toJPEG(ROOM_IMAGE_QUALITY).toString('base64')}`
}

/** Post to the room as the host. Does nothing when no room is open. */
export function sendRoomMessage(post: RoomPost | string): void {
  if (!socket || (state.status !== 'open' && state.status !== 'reconnecting')) return
  const { text, name, image } = typeof post === 'string' ? { text: post } : post
  socket.emit('message:send', { text, name, image: image ? shrinkImage(image) : undefined })
}

/** Disconnect. With `close`, the room is deleted on the server and guests are told. */
export function stopRoom(close = false): void {
  if (socket && close) socket.emit('room:close')
  socket?.close()
  socket = null
  if (close) resumeKey = null
  setState({ status: 'idle', roomId: undefined, joinUrl: undefined, qr: undefined, guests: [] })
}
