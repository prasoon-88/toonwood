import { createHash, randomBytes } from 'node:crypto'

/** 256-bit random token, safe for URLs and cookies. */
export function newToken() {
  return randomBytes(32).toString('base64url')
}

/** Tokens are stored only as SHA-256 hashes, so a database leak can't be replayed. */
export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex')
}
