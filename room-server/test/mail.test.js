import { mock, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMailer } from '../mail/index.js'
import { verifyEmailMessage } from '../mail/templates.js'

test('memory driver keeps sent mail', async () => {
  const mailer = createMailer({ driver: 'memory' })
  await mailer.send({ to: 'a@example.com', ...verifyEmailMessage('http://x/verify?token=abc') })
  assert.equal(mailer.sent.length, 1)
  assert.equal(mailer.sent[0].to, 'a@example.com')
  assert.match(mailer.sent[0].text, /http:\/\/x\/verify\?token=abc/)
  assert.match(mailer.sent[0].from, /Toonwide/)
})

test('outbox driver appends JSON lines', async () => {
  const file = join(await mkdtemp(join(tmpdir(), 'tw-mail-')), 'outbox.jsonl')
  const mailer = createMailer({ driver: 'outbox', outboxFile: file })
  await mailer.send({ to: 'a@example.com', subject: 'One', text: '1' })
  await mailer.send({ to: 'b@example.com', subject: 'Two', text: '2' })
  const lines = (await readFile(file, 'utf8')).trim().split('\n').map((l) => JSON.parse(l))
  assert.deepEqual(lines.map((m) => m.to), ['a@example.com', 'b@example.com'])
})

test('resend driver posts to the Resend API and fails loudly on errors', async () => {
  const calls = []
  mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init })
    return new Response('{}', { status: calls.length === 1 ? 200 : 500 })
  })
  try {
    const mailer = createMailer({ driver: 'resend', apiKey: 're_test', from: 'Toonwide <hi@toonwide.app>' })
    await mailer.send({ to: 'a@example.com', subject: 'S', text: 'T', html: '<p>T</p>' })
    assert.equal(calls[0].url, 'https://api.resend.com/emails')
    assert.equal(calls[0].init.headers.Authorization, 'Bearer re_test')
    assert.deepEqual(JSON.parse(calls[0].init.body).to, ['a@example.com'])
    await assert.rejects(mailer.send({ to: 'a@example.com', subject: 'S', text: 'T' }), /Resend 500/)
  } finally {
    mock.restoreAll()
  }
})

test('unknown driver is rejected at creation', () => {
  assert.throws(() => createMailer({ driver: 'smtp' }), /Unknown mail driver/)
})
