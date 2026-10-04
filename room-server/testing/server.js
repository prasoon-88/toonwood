import { createServer } from '../app.js'
import { createDb } from '../db/index.js'

const TEST_CONFIG = {
  appKey: '',
  publicUrl: 'http://localhost',
  webUrl: 'http://localhost',
  trustProxy: false,
  secureCookies: false,
  webDist: null
}

/** Start the backend in-process on a free port. Later tasks add `db` and `mailer` here. */
export async function startTestServer({ config = {} } = {}) {
  const db = await createDb('memory')
  const server = createServer({ config: { ...TEST_CONFIG, ...config }, db })
  await new Promise((resolve) => server.http.listen(0, resolve))
  const url = `http://localhost:${server.http.address().port}`
  return { url, db, close: server.close }
}

/** Minimal browser stand-in: keeps cookies and sends the CSRF header like the website does. */
export function client(url) {
  const jar = new Map()
  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' }
    if (jar.size) headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
    if (jar.has('tw_csrf')) headers['X-CSRF-Token'] = jar.get('tw_csrf')
    const res = await fetch(url + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
    for (const cookie of res.headers.getSetCookie()) {
      const [pair, ...attrs] = cookie.split(';')
      const i = pair.indexOf('=')
      const name = pair.slice(0, i).trim()
      const value = pair.slice(i + 1)
      const expired = attrs.some((a) => /expires=thu, 01 jan 1970/i.test(a.trim()))
      if (expired || value === '') jar.delete(name)
      else jar.set(name, value)
    }
    const data = await res.json().catch(() => null)
    return { status: res.status, data }
  }
  return { jar, get: (path) => request('GET', path), post: (path, body = {}) => request('POST', path, body) }
}
