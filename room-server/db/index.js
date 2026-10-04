import { fileURLToPath } from 'node:url'
import * as schema from './schema.js'

const migrationsFolder = fileURLToPath(new URL('./migrations', import.meta.url))

/** The pack every verified user gets once. Edit here (or in the table) to change the free offer. */
const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  minutes: 60,
  validDays: 7,
  sessionMaxMinutes: 60,
  historyDays: 90,
  features: { rooms: true, screenshots: true, models: {}, limits: { answersPerMinute: 30, answersPerSession: 300 } }
}

export async function seed(db) {
  await db.insert(schema.plans).values(FREE_PLAN).onConflictDoNothing()
}

/**
 * Open the database and bring it up to date.
 * 'memory' = throwaway PGlite (tests), 'pglite:<dir>' = PGlite on disk (local dev), anything else = Postgres URL.
 */
export async function createDb(databaseUrl) {
  let db
  if (databaseUrl === 'memory' || databaseUrl.startsWith('pglite:')) {
    const { PGlite } = await import('@electric-sql/pglite')
    const { drizzle } = await import('drizzle-orm/pglite')
    const { migrate } = await import('drizzle-orm/pglite/migrator')
    db = drizzle(new PGlite(databaseUrl === 'memory' ? undefined : databaseUrl.slice('pglite:'.length)), { schema })
    await migrate(db, { migrationsFolder })
  } else {
    const { default: pg } = await import('pg')
    const { drizzle } = await import('drizzle-orm/node-postgres')
    const { migrate } = await import('drizzle-orm/node-postgres/migrator')
    db = drizzle(new pg.Pool({ connectionString: databaseUrl }), { schema })
    await migrate(db, { migrationsFolder })
  }
  await seed(db)
  return db
}
