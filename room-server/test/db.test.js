import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDb, seed } from '../db/index.js'
import { plans, users } from '../db/schema.js'

test('a fresh database is migrated and has the free plan', async () => {
  const db = await createDb('memory')
  const rows = await db.select().from(plans)
  assert.deepEqual(
    rows.map((p) => [p.id, p.name, p.minutes, p.validDays, p.sessionMaxMinutes, p.historyDays]),
    [['free', 'Free', 60, 7, 60, 90]]
  )
  assert.equal(rows[0].features.rooms, true)
})

test('seeding twice keeps a single free plan', async () => {
  const db = await createDb('memory')
  await seed(db)
  assert.equal((await db.select().from(plans)).length, 1)
})

test('emails are unique', async () => {
  const db = await createDb('memory')
  await db.insert(users).values({ email: 'a@example.com', passwordHash: 'x' })
  await assert.rejects(db.insert(users).values({ email: 'a@example.com', passwordHash: 'y' }))
})
