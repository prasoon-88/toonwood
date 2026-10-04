import { appendFile } from 'node:fs/promises'

const DRIVERS = ['memory', 'console', 'outbox', 'resend']

/** Send transactional email. `console` and `outbox` are for development and tests only. */
export function createMailer({ driver = 'console', apiKey = '', from = 'Toonwide <no-reply@toonwide.app>', outboxFile = '', log = console } = {}) {
  if (!DRIVERS.includes(driver)) throw new Error(`Unknown mail driver ${driver}`)
  const sent = []

  async function send({ to, subject, text, html }) {
    const mail = { from, to, subject, text, html }
    if (driver === 'memory') {
      sent.push(mail)
    } else if (driver === 'console') {
      log.info(`[mail] to=${to} subject="${subject}"\n${text}`)
    } else if (driver === 'outbox') {
      await appendFile(outboxFile, `${JSON.stringify(mail)}\n`)
    } else {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text, html }),
        signal: AbortSignal.timeout(10000)
      })
      if (!res.ok) throw new Error(`Resend ${res.status}`)
    }
  }

  return { send, sent }
}
