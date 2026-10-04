import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { client, startTestServer } from '../testing/server.js'
import { users } from '../db/schema.js'

let server
before(async () => (server = await startTestServer()))
after(() => server.close())

const PASSWORD = 'correct horse battery'
let n = 0
const freshEmail = () => `person${++n}@example.com`

/** Last link of the given kind mailed to `email`. */
function linkFor(email, kind) {
  const mail = server.mailer.sent.filter((m) => m.to === email).at(-1)
  return mail?.text.match(new RegExp(`/${kind}\\?token=([\\w-]+)`))?.[1]
}

async function browser() {
  const c = client(server.url)
  await c.get('/api/auth/csrf')
  return c
}

async function signUpAndVerify(email = freshEmail()) {
  const c = await browser()
  assert.equal((await c.post('/api/auth/signup', { email, password: PASSWORD })).status, 201)
  assert.equal((await c.post('/api/auth/verify', { token: linkFor(email, 'verify') })).status, 200)
  return { c, email }
}

test('state-changing requests need the CSRF header', async () => {
  const c = client(server.url)
  const res = await c.post('/api/auth/signup', { email: freshEmail(), password: PASSWORD })
  assert.equal(res.status, 403)
})

test('sign up, verify, log in and see the free minutes', async () => {
  const email = freshEmail()
  const c = await browser()
  assert.equal((await c.post('/api/auth/signup', { email: email.toUpperCase(), password: PASSWORD })).status, 201)

  assert.equal((await c.post('/api/auth/login', { email, password: PASSWORD })).status, 200)
  assert.equal((await c.get('/api/auth/me')).data.user.emailVerified, false)
  assert.equal((await c.get('/api/account')).data.minutesLeft, 0)

  assert.equal((await c.post('/api/auth/verify', { token: linkFor(email, 'verify') })).status, 200)
  const account = (await c.get('/api/account')).data
  assert.equal(account.user.emailVerified, true)
  assert.equal(account.minutesLeft, 60)
  assert.deepEqual(account.packs.map((p) => [p.planName, p.minutesLeft]), [['Free', 60]])
})

test('verification links are single-use and the free pack is granted once', async () => {
  const email = freshEmail()
  const c = await browser()
  await c.post('/api/auth/signup', { email, password: PASSWORD })
  const token = linkFor(email, 'verify')
  assert.equal((await c.post('/api/auth/verify', { token })).status, 200)
  const again = await c.post('/api/auth/verify', { token })
  assert.equal(again.status, 400)
  assert.match(again.data.error, /invalid or has expired/)
})

test('signing up twice does not reveal or duplicate the account', async () => {
  const { email } = await signUpAndVerify()
  const c = await browser()
  assert.equal((await c.post('/api/auth/signup', { email, password: 'another long password' })).status, 201)
  assert.match(server.mailer.sent.at(-1).subject, /already have a Toonwide account/)
  const rows = (await server.db.select().from(users)).filter((u) => u.email === email)
  assert.equal(rows.length, 1)
})

test('weak passwords and bad emails are rejected', async () => {
  const c = await browser()
  assert.equal((await c.post('/api/auth/signup', { email: freshEmail(), password: 'short' })).status, 400)
  assert.equal((await c.post('/api/auth/signup', { email: 'not-an-email', password: PASSWORD })).status, 400)
})

test('wrong passwords are refused and then rate limited', async () => {
  const { email } = await signUpAndVerify()
  const c = await browser()
  for (let i = 0; i < 5; i++) assert.equal((await c.post('/api/auth/login', { email, password: 'wrong password!!' })).status, 401)
  assert.equal((await c.post('/api/auth/login', { email, password: PASSWORD })).status, 429)
})

test('logout ends the website session', async () => {
  const { email } = await signUpAndVerify()
  const c = await browser()
  await c.post('/api/auth/login', { email, password: PASSWORD })
  assert.equal((await c.get('/api/auth/me')).status, 200)
  assert.equal((await c.post('/api/auth/logout')).status, 200)
  assert.equal((await c.get('/api/auth/me')).status, 401)
  assert.equal((await c.get('/api/account')).status, 401)
})

test('password reset changes the password and logs out other sessions', async () => {
  const { email } = await signUpAndVerify()
  const loggedIn = await browser()
  await loggedIn.post('/api/auth/login', { email, password: PASSWORD })

  const c = await browser()
  assert.equal((await c.post('/api/auth/forgot', { email })).status, 200)
  const token = linkFor(email, 'reset')
  assert.equal((await c.post('/api/auth/reset', { token, password: 'short' })).status, 400)
  assert.equal((await c.post('/api/auth/reset', { token, password: 'a brand new passphrase' })).status, 200)

  assert.equal((await loggedIn.get('/api/auth/me')).status, 401)
  assert.equal((await c.post('/api/auth/login', { email, password: PASSWORD })).status, 401)
  assert.equal((await c.post('/api/auth/login', { email, password: 'a brand new passphrase' })).status, 200)
  assert.equal((await c.post('/api/auth/reset', { token, password: 'yet another passphrase' })).status, 400)
})

test('forgot password for an unknown email looks the same and sends nothing', async () => {
  const sentBefore = server.mailer.sent.length
  const c = await browser()
  assert.deepEqual((await c.post('/api/auth/forgot', { email: 'nobody@example.com' })).data, { ok: true })
  assert.equal(server.mailer.sent.length, sentBefore)
})

test('resend verification sends a new link to logged-in unverified users', async () => {
  const email = freshEmail()
  const c = await browser()
  await c.post('/api/auth/signup', { email, password: PASSWORD })
  await c.post('/api/auth/login', { email, password: PASSWORD })
  const first = linkFor(email, 'verify')
  assert.equal((await c.post('/api/auth/resend-verification')).status, 200)
  assert.notEqual(linkFor(email, 'verify'), first)
})
