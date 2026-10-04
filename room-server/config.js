/** Only "1" or "true" (any case) turn the proxy setting on; "0" and "false" must not. */
export function trustProxyOn(value) {
  return ['1', 'true'].includes(String(value ?? '').trim().toLowerCase())
}

/** Everything wrong with a production setup; empty in dev. Production = NODE_ENV=production or an https PUBLIC_URL. */
export function productionProblems(env, publicUrl) {
  const production = env.NODE_ENV === 'production' || publicUrl.startsWith('https://')
  if (!production) return []
  const problems = []
  if (!env.DATABASE_URL) problems.push('DATABASE_URL is required (Postgres connection string)')
  if (!env.PUBLIC_URL || !env.PUBLIC_URL.startsWith('https://')) problems.push('PUBLIC_URL must be set to the public https address')
  const driver = env.MAIL_DRIVER ?? 'resend'
  if (driver !== 'resend') problems.push(`MAIL_DRIVER must be "resend" in production (got "${driver}")`)
  if (!env.RESEND_API_KEY) problems.push('RESEND_API_KEY is required to send email')
  return problems
}
