import { safeEqual } from '../util.js'
import { findWebSessionUser } from './webSessions.js'

export const SESSION_COOKIE = 'tw_session'
export const CSRF_COOKIE = 'tw_csrf'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Sets req.user from the login cookie (or null). */
export function loadUser({ db, now }) {
  return async (req, _res, next) => {
    req.user = await findWebSessionUser(db, req.cookies?.[SESSION_COOKIE], now())
    next()
  }
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in' })
  next()
}

/** Double-submit CSRF check: the header must echo the tw_csrf cookie. */
export function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next()
  const cookie = req.cookies?.[CSRF_COOKIE]
  const header = req.get('x-csrf-token')
  if (!cookie || !header || !safeEqual(cookie, header)) {
    return res.status(403).json({ error: 'Your page is out of date. Refresh it and try again.' })
  }
  next()
}
