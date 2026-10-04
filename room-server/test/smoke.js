// End-to-end check against a real server process:
// product API (with a fake Deepgram/TypeSafe upstream) + rooms (host, guest, chat, close).
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import assert from 'node:assert/strict'
import { io } from 'socket.io-client'

const PORT = 3999
const URL = `http://localhost:${PORT}`
const APP_KEY = 'test-app-key'

// Fake upstream for Deepgram's /v1/auth/grant and TypeSafe's /v1/systemone.
const upstreamCalls = []
const upstream = createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    upstreamCalls.push({ url: req.url, auth: req.headers.authorization, body: body ? JSON.parse(body) : null })
    res.setHeader('Content-Type', 'application/json')
    if (req.url === '/v1/auth/grant') return res.end(JSON.stringify({ access_token: 'jwt-123', expires_in: 60 }))
    res.end(
      JSON.stringify({
        answers: {
          is_question: { noul: 0.92 },
          preset: { choice: 'p1', confidence: 0.8, probabilities: { p0: 0.1, p1: 0.85, none_of_these: 0.05 } }
        }
      })
    )
  })
})
upstream.listen(0)
await once(upstream, 'listening')
const UPSTREAM = `http://localhost:${upstream.address().port}`

const server = spawn(process.execPath, ['server.js'], {
  cwd: new globalThis.URL('..', import.meta.url),
  env: {
    ...process.env,
    PORT: String(PORT),
    DATABASE_URL: 'memory',
    APP_KEY,
    PUBLIC_URL: URL,
    DEEPGRAM_API_KEY: 'dg-secret',
    TYPESAFE_API_KEY: 'ts-secret',
    DEEPGRAM_API_URL: UPSTREAM,
    TYPESAFE_API_URL: UPSTREAM
  },
  stdio: ['ignore', 'pipe', 'inherit']
})
await once(server.stdout, 'data')

const emitAck = (socket, event, ...args) => new Promise((resolve) => socket.emit(event, ...args, resolve))
const appHeaders = { 'Content-Type': 'application/json', 'X-App-Key': APP_KEY, 'X-Device-Id': 'device-test-1234' }
const post = (path, body, headers = appHeaders) =>
  fetch(`${URL}/api${path}`, { method: 'POST', headers, body: JSON.stringify(body ?? {}) })

try {
  // ---- API ----
  assert.equal((await post('/stt/token', {}, { 'X-Device-Id': 'device-test-1234' })).status, 401, 'app key required')
  assert.equal((await post('/stt/token', {}, { 'X-App-Key': APP_KEY })).status, 400, 'device id required')

  const token = await post('/stt/token')
  assert.equal(token.status, 200)
  assert.deepEqual(await token.json(), { token: 'jwt-123', expiresIn: 60 })
  const grant = upstreamCalls.find((c) => c.url === '/v1/auth/grant')
  assert.equal(grant.auth, 'Token dg-secret', 'server key is used upstream, never sent to the app')
  assert.equal(grant.body.ttl_seconds, 60)

  assert.equal((await post('/classify', { state: '' , presets: [] })).status, 400)
  const classify = await post('/classify', { state: 'Them: what is react?', presets: ['Tell me about yourself', 'What is React'] })
  assert.equal(classify.status, 200)
  assert.deepEqual(await classify.json(), { isQuestion: 0.92, probabilities: [0.1, 0.85] })
  const jev = upstreamCalls.find((c) => c.url === '/v1/systemone')
  assert.equal(jev.auth, 'Bearer ts-secret')
  assert.equal(jev.body.questions.preset.criteria.p1, 'What is React')

  // ---- Rooms ----
  const intruder = io(URL, { auth: { role: 'host', appKey: 'nope' }, reconnection: false })
  const [fatal] = await once(intruder, 'fatal')
  assert.equal(fatal.error, 'Unknown app')
  intruder.close()

  const host = io(URL, { auth: { role: 'host', appKey: APP_KEY } })
  const room = await emitAck(host, 'room:create')
  assert.ok(room.ok)
  assert.equal(room.joinUrl, `${URL}/r/${room.roomId}`)

  assert.equal((await fetch(room.joinUrl)).status, 200)
  assert.equal((await fetch(`${URL}/r/doesnotexist`)).status, 404)
  assert.equal((await fetch(`${URL}/vendor/marked.js`)).status, 200)
  assert.equal((await fetch(`${URL}/vendor/purify.js`)).status, 200)
  assert.equal((await fetch(`${URL}/vendor/other.js`)).status, 404)

  const guest = io(URL, { auth: { role: 'guest', roomId: room.roomId, name: 'Rajat' } })
  await once(guest, 'room:history')

  const received = once(host, 'message:new')
  assert.deepEqual(await emitAck(guest, 'message:send', { text: '  What is React?  \r\n- hooks\n\n\n\n- state ' }), { ok: true })
  const [msg] = await received
  assert.equal(msg.name, 'Rajat')
  // Line breaks survive (Markdown lists), trailing spaces and extra blank lines are trimmed.
  assert.equal(msg.text, 'What is React?\n- hooks\n\n- state')

  // Rate limit: an immediate second message is refused.
  assert.equal((await emitAck(guest, 'message:send', { text: 'again' })).ok, false)

  // Host messages reach guests.
  const toGuest = once(guest, 'message:new')
  host.emit('message:send', { text: 'Hi from host' })
  assert.equal((await toGuest)[0].host, true)

  // The app shares its Live session: named host messages, long answers and screenshots.
  const image = `data:image/jpeg;base64,${Buffer.alloc(300 * 1024, 7).toString('base64')}`
  const shared = once(guest, 'message:new')
  host.emit('message:send', { name: 'Copilot', text: 'x'.repeat(5000), image })
  const [answerMsg] = await shared
  assert.equal(answerMsg.name, 'Copilot')
  assert.equal(answerMsg.text.length, 5000, 'host messages may be longer than guest ones')
  assert.equal(answerMsg.image, image)

  // Anything that isn't an image data: URL is dropped; a message with nothing left isn't posted.
  const badImage = once(guest, 'message:new')
  host.emit('message:send', { image: 'javascript:alert(1)' })
  host.emit('message:send', { text: 'pic?', image: 'data:text/html;base64,PGI+' })
  assert.deepEqual([(await badImage)[0].text, (await badImage)[0].image], ['pic?', undefined])

  // Guests can't post pictures.
  await new Promise((r) => setTimeout(r, 900))
  const fromGuest = once(host, 'message:new')
  await emitAck(guest, 'message:send', { text: 'hello', image })
  assert.equal((await fromGuest)[0].image, undefined)

  // Host can resume its room from a new connection.
  const host2 = io(URL, { auth: { role: 'host', appKey: APP_KEY } })
  const resumed = await emitAck(host2, 'room:resume', { roomId: room.roomId, hostKey: room.hostKey })
  assert.ok(resumed.ok)
  assert.equal(resumed.messages.length, 5)
  assert.equal((await emitAck(host2, 'room:resume', { roomId: room.roomId, hostKey: 'bad' })).ok, false)

  const closed = once(guest, 'room:closed')
  host2.emit('room:close')
  await closed
  assert.equal((await fetch(room.joinUrl)).status, 404)

  ;[host, host2, guest].forEach((s) => s.close())
  console.log('✓ server smoke test passed (API + rooms)')
} finally {
  server.kill()
  upstream.close()
}
