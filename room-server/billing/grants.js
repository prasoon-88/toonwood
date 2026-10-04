import { and, asc, eq, gt, inArray, lte, sql } from 'drizzle-orm'
import { grants, plans, sessionCharges } from '../db/schema.js'

const DAY_MS = 24 * 60 * 60 * 1000

/** Give a user a pack of the plan's minutes, valid for the plan's days from `now`. */
export async function grantPack(db, { userId, planId, source, now = new Date() }) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId))
  if (!plan) throw new Error(`Unknown plan ${planId}`)
  const rows = await db
    .insert(grants)
    .values({
      userId,
      planId,
      minutesTotal: plan.minutes,
      startsAt: now,
      endsAt: new Date(now.getTime() + plan.validDays * DAY_MS),
      source
    })
    .onConflictDoNothing()
    .returning()
  return rows[0] ?? null
}

/** The once-per-account free pack (the unique index makes repeats a no-op). */
export function grantFreePack(db, userId, now = new Date()) {
  return grantPack(db, { userId, planId: 'free', source: 'free', now })
}

/** Usable packs (started, not expired, minutes left), soonest-expiring first. */
export async function activeGrants(db, userId, now = new Date()) {
  const rows = await db
    .select({ grant: grants, planName: plans.name })
    .from(grants)
    .innerJoin(plans, eq(grants.planId, plans.id))
    .where(and(eq(grants.userId, userId), lte(grants.startsAt, now), gt(grants.endsAt, now)))
    .orderBy(asc(grants.endsAt))
  if (!rows.length) return []

  const used = await db
    .select({
      grantId: sessionCharges.grantId,
      minutes: sql`coalesce(sum(${sessionCharges.minutes}), 0)`.mapWith(Number)
    })
    .from(sessionCharges)
    .where(inArray(sessionCharges.grantId, rows.map((r) => r.grant.id)))
    .groupBy(sessionCharges.grantId)
  const usedByGrant = new Map(used.map((u) => [u.grantId, u.minutes]))

  return rows
    .map(({ grant, planName }) => ({
      id: grant.id,
      planId: grant.planId,
      planName,
      minutesTotal: grant.minutesTotal,
      minutesLeft: Math.max(0, grant.minutesTotal - (usedByGrant.get(grant.id) ?? 0)),
      startsAt: grant.startsAt,
      endsAt: grant.endsAt,
      source: grant.source
    }))
    .filter((g) => g.minutesLeft > 0)
}

export async function minutesLeft(db, userId, now = new Date()) {
  return (await activeGrants(db, userId, now)).reduce((sum, g) => sum + g.minutesLeft, 0)
}
