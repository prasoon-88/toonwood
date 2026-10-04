import express from 'express'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { emailTokens, users } from '../db/schema.js'
import { grantFreePack } from '../billing/grants.js'
import { existingAccountMessage, resetEmailMessage, verifyEmailMessage } from '../mail/templates.js'
import { consumeEmailToken, createEmailToken } from './emailTokens.js'
import { CSRF_COOKIE, SESSION_COOKIE, loadUser, requireCsrf, requireUser } from './middleware.js'
import { hashPassword, passwordProblem, verifyPassword } from './password.js'
import { createLimiter } from './limiter.js'
import { newToken } from './tokens.js'
import { createWebSession, deleteUserWebSessions, deleteWebSession, WEB_SESSION_MS } from './webSessions.js'

const Email = z.string().trim().toLowerCase().pipe(z.email().max(254))
const Credentials = z.object({ email: Email, password: z.string().max(500) })
const TokenBody = z.object({ token: z.string().min(1).max(200) })
const ResetBody = z.object({ token: z.string().min(1).max(200), password: z.string().max(500) })

export function publicUser(user) {
  return { id: user.id, email: user.email, emailVerified: Boolean(user.emailVerifiedAt) }
}

/** Website login: sign up, verify email, log in/out, forgot/reset password. Mounted at /api/auth. */
export function authRouter({ db, mailer, config, now }) {
  const router = express.Router()
  const WINDOW_MS = 15 * 60 * 1000
  const emailFailures = createLimiter({ max: 5, windowMs: WINDOW_MS })
  // Higher per-IP ceiling: offices and phones on mobile data share one address.
  const ipFailures = createLimiter({ max: 50, windowMs: WINDOW_MS })
  // Sign-up and forgot-password emails, per IP: stops one visitor from mailing strangers in bulk.
  const mailRequests = createLimiter({ max: 30, windowMs: WINDOW_MS })
  let dummyHash
  const cookieBase = { secure: config.secureCookies, path: '/' }

  router.use(express.json({ limit: '16kb' }))
  router.use(requireCsrf)
  router.use(loadUser({ db, now }))

  const link = (path, token) => `${config.webUrl}${path}?token=${token}`

  async function sendVerification(user) {
    const token = await createEmailToken(db, { userId: user.id, purpose: 'verify', now: now() })
    await mailer.send({ to: user.email, ...verifyEmailMessage(link('/verify', token)) })
  }

  function tooManyMails(req, res) {
    if (mailRequests.blocked(`ip:${req.ip}`)) {
      res.status(429).json({ error: 'Too many requests. Try again in a few minutes.' })
      return true
    }
    mailRequests.fail(`ip:${req.ip}`)
    return false
  }

  router.get('/csrf', (req, res) => {
    const token = req.cookies?.[CSRF_COOKIE] || newToken()
    res.cookie(CSRF_COOKIE, token, { ...cookieBase, sameSite: 'strict', httpOnly: false, maxAge: WEB_SESSION_MS })
    res.json({ csrfToken: token })
  })

  router.post('/signup', async (req, res) => {
    const body = Credentials.safeParse(req.body)
    if (!body.success) return res.status(400).json({ error: 'Enter a valid email address' })
    const problem = passwordProblem(body.data.password)
    if (problem) return res.status(400).json({ error: problem })
    if (tooManyMails(req, res)) return

    const { email, password } = body.data
    const [existing] = await db.select().from(users).where(eq(users.email, email))
    if (existing?.emailVerifiedAt) {
      await mailer.send({ to: email, ...existingAccountMessage(`${config.webUrl}/login`) })
    } else if (existing) {
      // Whoever claims an unverified address last owns it: drop any earlier password, link and session.
      await db.transaction(async (tx) => {
        await tx.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, existing.id))
        await tx.delete(emailTokens).where(and(eq(emailTokens.userId, existing.id), eq(emailTokens.purpose, 'verify'), isNull(emailTokens.usedAt)))
        await deleteUserWebSessions(tx, existing.id)
      })
      await sendVerification(existing)
    } else {
      const [user] = await db
        .insert(users)
        .values({ email, passwordHash: await hashPassword(password) })
        .onConflictDoNothing()
        .returning()
      if (user) await sendVerification(user)
    }
    res.status(201).json({ ok: true })
  })

  router.post('/verify', async (req, res) => {
    const body = TokenBody.safeParse(req.body)
    const userId = body.success ? await consumeEmailToken(db, { token: body.data.token, purpose: 'verify', now: now() }) : null
    if (!userId) return res.status(400).json({ error: 'This link is invalid or has expired. Request a new one.' })
    await db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId))
      if (!user.emailVerifiedAt) {
        await tx.update(users).set({ emailVerifiedAt: now() }).where(eq(users.id, userId))
        // End sessions opened before the email was proven.
        await deleteUserWebSessions(tx, userId)
      }
      await grantFreePack(tx, userId, now())
    })
    res.json({ ok: true })
  })

  router.post('/resend-verification', requireUser, async (req, res) => {
    if (req.user.emailVerifiedAt) return res.status(400).json({ error: 'Your email is already verified' })
    if (tooManyMails(req, res)) return
    await sendVerification(req.user)
    res.json({ ok: true })
  })

  router.post('/login', async (req, res) => {
    const body = Credentials.safeParse(req.body)
    if (!body.success) return res.status(400).json({ error: 'Enter your email and password' })
    const { email, password } = body.data
    if (emailFailures.blocked(email) || ipFailures.blocked(req.ip)) {
      return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes or reset your password.' })
    }

    // Count the attempt before the slow hash check so parallel guesses can't all slip past the limit.
    emailFailures.fail(email)
    ipFailures.fail(req.ip)

    const [user] = await db.select().from(users).where(eq(users.email, email))
    // Verify against a dummy hash for unknown emails so response time doesn't reveal which emails exist.
    dummyHash ??= await hashPassword(newToken())
    const ok = (await verifyPassword(user?.passwordHash ?? dummyHash, password)) && user && !user.deletedAt
    if (!ok) {
      return res.status(401).json({ error: 'Wrong email or password' })
    }

    emailFailures.reset(email)
    const token = await createWebSession(db, { userId: user.id, userAgent: req.get('user-agent'), now: now() })
    res.cookie(SESSION_COOKIE, token, { ...cookieBase, httpOnly: true, sameSite: 'lax', maxAge: WEB_SESSION_MS })
    res.json({ user: publicUser(user) })
  })

  router.post('/logout', async (req, res) => {
    await deleteWebSession(db, req.cookies?.[SESSION_COOKIE])
    res.clearCookie(SESSION_COOKIE, { ...cookieBase, httpOnly: true, sameSite: 'lax' })
    res.json({ ok: true })
  })

  router.get('/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }))

  router.post('/forgot', async (req, res) => {
    const email = Email.safeParse(req.body?.email)
    if (!email.success) return res.status(400).json({ error: 'Enter a valid email address' })
    if (tooManyMails(req, res)) return
    const [user] = await db.select().from(users).where(eq(users.email, email.data))
    if (user && !user.deletedAt) {
      const token = await createEmailToken(db, { userId: user.id, purpose: 'reset', now: now() })
      await mailer.send({ to: user.email, ...resetEmailMessage(link('/reset', token)) })
    }
    res.json({ ok: true })
  })

  router.post('/reset', async (req, res) => {
    const body = ResetBody.safeParse(req.body)
    if (!body.success) return res.status(400).json({ error: 'This link is invalid or has expired. Request a new one.' })
    const problem = passwordProblem(body.data.password)
    if (problem) return res.status(400).json({ error: problem })
    const userId = await consumeEmailToken(db, { token: body.data.token, purpose: 'reset', now: now() })
    if (!userId) return res.status(400).json({ error: 'This link is invalid or has expired. Request a new one.' })
    await db.update(users).set({ passwordHash: await hashPassword(body.data.password) }).where(eq(users.id, userId))
    await deleteUserWebSessions(db, userId)
    // The lockout message tells people to reset: a successful reset must lift it.
    const [owner] = await db.select().from(users).where(eq(users.id, userId))
    if (owner) emailFailures.reset(owner.email)
    res.json({ ok: true })
  })

  return router
}
