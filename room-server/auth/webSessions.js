import { and, eq, gt, isNull } from 'drizzle-orm'
import { users, webSessions } from '../db/schema.js'
import { hashToken, newToken } from './tokens.js'

export const WEB_SESSION_MS = 30 * 24 * 60 * 60 * 1000

/** Start a website login; returns the raw token for the cookie. */
export async function createWebSession(db, { userId, userAgent, now = new Date() }) {
  const token = newToken()
  await db.insert(webSessions).values({
    tokenHash: hashToken(token),
    userId,
    userAgent: userAgent ? String(userAgent).slice(0, 300) : null,
    expiresAt: new Date(now.getTime() + WEB_SESSION_MS)
  })
  return token
}

export async function findWebSessionUser(db, token, now = new Date()) {
  if (typeof token !== 'string' || !token) return null
  const [row] = await db
    .select({ user: users })
    .from(webSessions)
    .innerJoin(users, eq(webSessions.userId, users.id))
    .where(and(eq(webSessions.tokenHash, hashToken(token)), gt(webSessions.expiresAt, now), isNull(users.deletedAt)))
    .limit(1)
  return row?.user ?? null
}

export async function deleteWebSession(db, token) {
  if (typeof token === 'string' && token) await db.delete(webSessions).where(eq(webSessions.tokenHash, hashToken(token)))
}

/** Log a user out everywhere (e.g. after a password reset). */
export async function deleteUserWebSessions(db, userId) {
  await db.delete(webSessions).where(eq(webSessions.userId, userId))
}
