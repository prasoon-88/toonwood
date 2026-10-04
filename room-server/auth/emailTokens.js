import { and, eq, gt, isNull } from 'drizzle-orm'
import { emailTokens } from '../db/schema.js'
import { hashToken, newToken } from './tokens.js'

const HOUR_MS = 60 * 60 * 1000
export const EMAIL_TOKEN_TTL_MS = { verify: 24 * HOUR_MS, reset: HOUR_MS }

/** Create a single-use link token; returns the raw token to put in the email. */
export async function createEmailToken(db, { userId, purpose, now = new Date() }) {
  const token = newToken()
  await db.insert(emailTokens).values({
    tokenHash: hashToken(token),
    userId,
    purpose,
    expiresAt: new Date(now.getTime() + EMAIL_TOKEN_TTL_MS[purpose])
  })
  return token
}

/** Mark the token used (atomically) and return its user id, or null if invalid, used, expired or wrong purpose. */
export async function consumeEmailToken(db, { token, purpose, now = new Date() }) {
  if (typeof token !== 'string' || !token) return null
  const [row] = await db
    .update(emailTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(emailTokens.tokenHash, hashToken(token)),
        eq(emailTokens.purpose, purpose),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, now)
      )
    )
    .returning({ userId: emailTokens.userId })
  return row?.userId ?? null
}
