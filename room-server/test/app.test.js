import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startTestServer } from '../testing/server.js'

test('createServer serves /health without listening on a fixed port', async () => {
  const server = await startTestServer()
  try {
    const res = await fetch(`${server.url}/health`)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { ok: true, rooms: 0 })
  } finally {
    await server.close()
  }
})
