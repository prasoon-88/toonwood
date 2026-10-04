export interface User {
  id: string
  email: string
  emailVerified: boolean
}
export interface Pack {
  id: string
  planName: string
  minutesTotal: number
  minutesLeft: number
  endsAt: string
}
export interface Account {
  user: User
  minutesLeft: number
  packs: Pack[]
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let csrf: string | null = null

async function csrfToken(): Promise<string> {
  if (!csrf) {
    const res = await fetch('/api/auth/csrf', { credentials: 'same-origin' })
    csrf = ((await res.json()) as { csrfToken: string }).csrfToken
  }
  return csrf
}

/** GET when `body` is undefined, otherwise POST with JSON and the CSRF header. */
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { credentials: 'same-origin' }
  if (body !== undefined) {
    init.method = 'POST'
    init.headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': await csrfToken() }
    init.body = JSON.stringify(body)
  }
  const res = await fetch(`/api${path}`, init)
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Something went wrong (${res.status})`)
  return data as T
}
