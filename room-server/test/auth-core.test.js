import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDb } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { hashToken, newToken } from '../auth/tokens.js'
import { hashPassword, passwordProblem, verifyPassword } from '../auth/password.js'
import { createLimiter } from '../auth/limiter.js'
import { consumeEmailToken, createEmailToken, EMAIL_TOKEN_TTL_MS } from '../auth/emailTokens.js'
import { createWebSession, deleteUserWebSessions, findWebSessionUser, WEB_SESSION_MS } from '../auth/webSessions.js'
import { createUser } from '../testing/factories.js'

const NOW = new Date('2026-10-05T10:00:00Z')
const later = (ms) => new Date(NOW.getTime() + ms)

test('tokens are random and hash deterministically', () => {
  const a = newToken()
  assert.equal(a.length, 43)
  assert.notEqual(a, newToken())
  assert.equal(hashToken(a), hashToken(a))
  assert.match(hashToken(a), /^[0-9a-f]{64}$/)
})

test('password policy', () => {
  assert.match(passwordProblem('short'), /at least 10/)
  assert.match(passwordProblem('password123'), /too common/)
  assert.match(passwordProblem('x'.repeat(201)), /too long/)
  assert.equal(passwordProblem('a good long passphrase'), null)
})

test('password hashing round trip', async () => {
  const hash = await hashPassword('a good long passphrase')
  assert.match(hash, /^\$argon2id\$/)
  assert.equal(await verifyPassword(hash, 'a good long passphrase'), true)
  assert.equal(await verifyPassword(hash, 'wrong passphrase!!'), false)
  assert.equal(await verifyPassword('garbage', 'anything at all'), false)
})

test('limiter blocks after max failures and forgets after the window', () => {
  let t = 0
  const limiter = createLimiter({ max: 3, windowMs: 1000, now: () => t })
  for (let i = 0; i < 3; i++) limiter.fail('k')
  assert.equal(limiter.blocked('k'), true)
  assert.equal(limiter.blocked('other'), false)
  t = 1001
  assert.equal(limiter.blocked('k'), false)
  limiter.fail('k')
  limiter.reset('k')
  assert.equal(limiter.blocked('k'), false)
})

test('email tokens are single-use, purpose-bound and expire', async () => {
  const db = await createDb('memory')
  const user = await createUser(db)
  const token = await createEmailToken(db, { userId: user.id, purpose: 'verify', now: NOW })
  assert.equal(await consumeEmailToken(db, { token, purpose: 'reset', now: NOW }), null)
  assert.equal(await consumeEmailToken(db, { token, purpose: 'verify', now: NOW }), user.id)
  assert.equal(await consumeEmailToken(db, { token, purpose: 'verify', now: NOW }), null)

  const reset = await createEmailToken(db, { userId: user.id, purpose: 'reset', now: NOW })
  assert.equal(await consumeEmailToken(db, { token: reset, purpose: 'reset', now: later(EMAIL_TOKEN_TTL_MS.reset + 1) }), null)
  assert.equal(await consumeEmailToken(db, { token: '', purpose: 'reset', now: NOW }), null)
})

test('web sessions find their user until they expire or are deleted', async () => {
  const db = await createDb('memory')
  const user = await createUser(db)
  const token = await createWebSession(db, { userId: user.id, userAgent: 'test', now: NOW })
  assert.equal((await findWebSessionUser(db, token, NOW)).id, user.id)
  assert.equal(await findWebSessionUser(db, token, later(WEB_SESSION_MS + 1)), null)
  assert.equal(await findWebSessionUser(db, 'nope', NOW), null)
  assert.equal(await findWebSessionUser(db, undefined, NOW), null)

  await db.update(users).set({ deletedAt: NOW }).where(eq(users.id, user.id))
  assert.equal(await findWebSessionUser(db, token, NOW), null)
  await db.update(users).set({ deletedAt: null }).where(eq(users.id, user.id))

  await deleteUserWebSessions(db, user.id)
  assert.equal(await findWebSessionUser(db, token, NOW), null)
})
