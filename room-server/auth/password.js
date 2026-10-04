import { hash, verify } from '@node-rs/argon2'

const MIN_LENGTH = 10
const MAX_LENGTH = 200
// Most common passwords that pass the length check; a full breach list can replace this later.
const COMMON = new Set([
  '1234567890', '12345678910', '0123456789', 'qwertyuiop', 'password12', 'password123', 'password1234',
  'iloveyou12', 'qwerty1234', 'qwerty12345', '1q2w3e4r5t', '1qaz2wsx3edc', 'abcdefghij', 'abc1234567',
  'aaaaaaaaaa', '1111111111', 'letmein123', 'welcome123', 'admin12345', 'football12', 'baseball12',
  'passw0rd12', 'p@ssw0rd12', 'trustno1234', 'sunshine12', 'princess12', 'superman12', 'changeme123'
])

/** Human-readable reason the password is not acceptable, or null if it is fine. */
export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters`
  if (password.length > MAX_LENGTH) return 'Password is too long'
  if (COMMON.has(password.toLowerCase())) return 'This password is too common, choose another one'
  return null
}

/** argon2id with the library's defaults. */
export function hashPassword(password) {
  return hash(password)
}

export async function verifyPassword(passwordHash, password) {
  try {
    return await verify(passwordHash, password)
  } catch {
    return false
  }
}
