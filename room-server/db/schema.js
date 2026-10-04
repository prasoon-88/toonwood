import { sql } from 'drizzle-orm'
import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

const ts = (name) => timestamp(name, { withTimezone: true })

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    emailVerifiedAt: ts('email_verified_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
    deletedAt: ts('deleted_at')
  },
  (t) => [uniqueIndex('users_email_key').on(t.email)]
)

/** Website login sessions; the cookie holds the token, the table only its SHA-256 hash. */
export const webSessions = pgTable(
  'web_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: ts('expires_at').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
    userAgent: text('user_agent')
  },
  (t) => [index('web_sessions_user_idx').on(t.userId)]
)

/** Single-use links sent by email (verify address, reset password). */
export const emailTokens = pgTable(
  'email_tokens',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    purpose: text('purpose', { enum: ['verify', 'reset'] }).notNull(),
    expiresAt: ts('expires_at').notNull(),
    usedAt: ts('used_at'),
    createdAt: ts('created_at').notNull().defaultNow()
  },
  (t) => [index('email_tokens_user_idx').on(t.userId)]
)

/** Catalog of minute packs: "N minutes valid for M days". One-time, never recurring. */
export const plans = pgTable('plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  minutes: integer('minutes').notNull(),
  validDays: integer('valid_days').notNull(),
  sessionMaxMinutes: integer('session_max_minutes').notNull(),
  historyDays: integer('history_days').notNull(),
  features: jsonb('features').notNull().default({}),
  priceCents: integer('price_cents'),
  stripePriceId: text('stripe_price_id')
})

/** Packs a user holds. Minutes are spent from the pack that expires soonest. */
export const grants = pgTable(
  'grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    planId: text('plan_id').notNull().references(() => plans.id),
    minutesTotal: integer('minutes_total').notNull(),
    startsAt: ts('starts_at').notNull(),
    endsAt: ts('ends_at').notNull(),
    source: text('source', { enum: ['free', 'purchase', 'admin'] }).notNull(),
    createdAt: ts('created_at').notNull().defaultNow()
  },
  (t) => [
    index('grants_user_idx').on(t.userId, t.endsAt),
    // The free pack can only ever be granted once per user.
    uniqueIndex('grants_one_free_key').on(t.userId).where(sql`"source" = 'free'`)
  ]
)

/** A timed app session (max 60 min). Plan 2 adds launch codes and the session lifecycle. */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    deviceId: text('device_id'),
    status: text('status', { enum: ['pending', 'active', 'ended'] }).notNull(),
    startedAt: ts('started_at').notNull().defaultNow(),
    endsAt: ts('ends_at').notNull(),
    endedAt: ts('ended_at'),
    endReason: text('end_reason'),
    saveHistory: boolean('save_history').notNull().default(true)
  },
  (t) => [index('sessions_user_status_idx').on(t.userId, t.status)]
)

/** Which pack paid for how many minutes of a session. */
export const sessionCharges = pgTable(
  'session_charges',
  {
    sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
    grantId: uuid('grant_id').notNull().references(() => grants.id, { onDelete: 'cascade' }),
    minutes: integer('minutes').notNull()
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.grantId] }), index('session_charges_grant_idx').on(t.grantId)]
)
