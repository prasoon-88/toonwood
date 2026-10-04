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

import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('the built website is served, with index.html for its routes', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'tw-web-'))
  await writeFile(join(dist, 'index.html'), '<!doctype html><title>Toonwide</title>')
  await writeFile(join(dist, 'app.js'), 'console.log(1)')
  const server = await startTestServer({ config: { webDist: dist } })
  try {
    for (const path of ['/', '/login', '/dashboard', '/verify']) {
      const res = await fetch(server.url + path)
      assert.equal(res.status, 200, path)
      assert.match(await res.text(), /<title>Toonwide<\/title>/)
    }
    assert.equal(await (await fetch(`${server.url}/app.js`)).text(), 'console.log(1)')
    assert.equal((await fetch(`${server.url}/no-such-page`)).status, 404)
  } finally {
    await server.close()
  }
})
