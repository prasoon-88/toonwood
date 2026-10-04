import { users } from '../db/schema.js'

let counter = 0

/** Insert a user directly (no password checks); for tests only. */
export async function createUser(db, { email = `user${++counter}@example.com`, verified = true } = {}) {
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash: 'not-a-real-hash', emailVerifiedAt: verified ? new Date() : null })
    .returning()
  return user
}
