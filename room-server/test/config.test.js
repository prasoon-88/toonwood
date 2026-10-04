import { test } from 'node:test'
import assert from 'node:assert/strict'
import { productionProblems, trustProxyOn } from '../config.js'

const FULL = { NODE_ENV: 'production', PUBLIC_URL: 'https://toonwide.app', DATABASE_URL: 'postgres://x', RESEND_API_KEY: 're_1' }
const URL = 'https://toonwide.app'

test('a dev environment has no production problems', () => {
  assert.deepEqual(productionProblems({}, 'http://192.168.1.5:3030'), [])
})

test('production with nothing set lists every missing setting', () => {
  const problems = productionProblems({ NODE_ENV: 'production' }, 'http://192.168.1.5:3030')
  assert.equal(problems.length, 3)
  assert.match(problems.join('\n'), /DATABASE_URL/)
  assert.match(problems.join('\n'), /PUBLIC_URL/)
  assert.match(problems.join('\n'), /RESEND_API_KEY/)
})

test('an https PUBLIC_URL alone makes it production', () => {
  assert.ok(productionProblems({ PUBLIC_URL: URL }, URL).length > 0)
})

test('a non-resend mail driver is refused in production', () => {
  for (const MAIL_DRIVER of ['console', 'outbox', 'memory']) {
    const problems = productionProblems({ ...FULL, MAIL_DRIVER }, URL)
    assert.equal(problems.length, 1, MAIL_DRIVER)
    assert.match(problems[0], /MAIL_DRIVER/)
  }
})

test('a fully configured production environment is fine', () => {
  assert.deepEqual(productionProblems(FULL, URL), [])
  assert.deepEqual(productionProblems({ ...FULL, MAIL_DRIVER: 'resend' }, URL), [])
})

test('only 1 or true turn TRUST_PROXY on', () => {
  for (const v of ['1', 'true', 'TRUE']) assert.equal(trustProxyOn(v), true, v)
  for (const v of [undefined, '', '0', 'false', 'no']) assert.equal(trustProxyOn(v), false, String(v))
})
