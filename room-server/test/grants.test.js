import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDb } from '../db/index.js'
import { plans, sessionCharges, sessions } from '../db/schema.js'
import { activeGrants, grantFreePack, grantPack, minutesLeft } from '../billing/grants.js'
import { createUser } from '../testing/factories.js'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date('2026-10-05T10:00:00Z')

test('the free pack is granted once and lasts 7 days', async () => {
  const db = await createDb('memory')
  const user = await createUser(db)
  const grant = await grantFreePack(db, user.id, NOW)
  assert.equal(grant.minutesTotal, 60)
  assert.equal(grant.endsAt.getTime(), NOW.getTime() + 7 * DAY)
  assert.equal(await grantFreePack(db, user.id, NOW), null)
  assert.equal(await minutesLeft(db, user.id, NOW), 60)
})

test('expired packs no longer count', async () => {
  const db = await createDb('memory')
  const user = await createUser(db)
  await grantFreePack(db, user.id, NOW)
  assert.equal(await minutesLeft(db, user.id, new Date(NOW.getTime() + 8 * DAY)), 0)
})

test('charged minutes are subtracted from their pack', async () => {
  const db = await createDb('memory')
  const user = await createUser(db)
  const grant = await grantFreePack(db, user.id, NOW)
  const [session] = await db
    .insert(sessions)
    .values({ userId: user.id, status: 'ended', endsAt: NOW })
    .returning()
  await db.insert(sessionCharges).values({ sessionId: session.id, grantId: grant.id, minutes: 25 })
  assert.equal(await minutesLeft(db, user.id, NOW), 35)
})

test('several packs add up and are listed soonest-expiring first', async () => {
  const db = await createDb('memory')
  await db.insert(plans).values({
    id: 'pack300', name: 'Starter', minutes: 300, validDays: 30, sessionMaxMinutes: 60, historyDays: 90, features: {}
  })
  const user = await createUser(db)
  await grantPack(db, { userId: user.id, planId: 'pack300', source: 'admin', now: NOW })
  await grantFreePack(db, user.id, NOW)
  const packs = await activeGrants(db, user.id, NOW)
  assert.deepEqual(packs.map((p) => [p.planName, p.minutesLeft]), [['Free', 60], ['Starter', 300]])
  assert.equal(await minutesLeft(db, user.id, NOW), 360)
})

test('granting an unknown plan fails', async () => {
  const db = await createDb('memory')
  const user = await createUser(db)
  await assert.rejects(grantPack(db, { userId: user.id, planId: 'nope', source: 'admin', now: NOW }), /Unknown plan/)
})
