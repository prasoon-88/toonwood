# Toonwide server

Express + Socket.IO backend for Toonwide. It holds the product's service keys, the database (users, minute packs,
sessions) and serves the website from `../web/dist`.

- **Website + accounts**: sign up, email verification (grants the free 60-minute pack), login, password reset,
  dashboard (`/api/auth/*`, `/api/account`)
- **`/api/stt/token`**: short-lived Deepgram token for live transcription
- **`/api/classify`**: question detection + preset matching with TypeSafe Jev
- **Rooms**: the app hosts a room, guests scan a QR and chat from `/r/<roomId>` (Markdown, sanitized)

## Run locally

```bash
npm install
cp .env.example .env   # fill in DEEPGRAM_API_KEY (and TYPESAFE_API_KEY, APP_KEY)
npm start
```

Phones on the same Wi-Fi can join rooms. Windows may ask to allow Node.js through the firewall: allow **Private** networks.

## Database

Postgres via Drizzle ORM. Without `DATABASE_URL` the server uses PGlite stored in `.data/` (no install needed);
tests use an in-memory PGlite. Migrations in `db/migrations/` run automatically on start.

After changing `db/schema.js`: `npm run db:generate -- --name <change>` and commit the new migration.

To give someone a pack by hand (until payments exist), insert into `grants` or call `grantPack()` from
`billing/grants.js`.

## Website

`cd ../web && npm install && npm run build`, then the server serves it at `/`. For live editing run
`npm run dev` in `web/` (port 5174) with `WEB_URL=http://localhost:5174` in this server's `.env`.

## Deploy

Deploy this folder to any Node 20+ host (Render, Railway, Fly.io, a VPS) and set:

| Env var | Purpose |
|---|---|
| `NODE_ENV` | Set to `production` |
| `PUBLIC_URL` | Public https address, e.g. `https://toonwide.app` (QR codes, cookies); required in production |
| `DATABASE_URL` | Postgres connection string; required in production |
| `WEB_URL` | Website address used in email links; defaults to `PUBLIC_URL` |
| `MAIL_DRIVER` | `resend` in production (the default there) |
| `RESEND_API_KEY` | Resend API key for sending email; required in production |
| `MAIL_FROM` | Sender, e.g. `Toonwide <no-reply@toonwide.app>` |
| `APP_KEY` | Shared key built into the app (`MAIN_VITE_APP_KEY`); only the app can use the API and host rooms |
| `DEEPGRAM_API_KEY` | Deepgram key with **Member** role or higher (needed to mint temporary tokens) |
| `TYPESAFE_API_KEY` | Optional; without it the app falls back to offline preset matching |
| `TRUST_PROXY` | Set to `1` (or `true`) behind a hosting proxy so rate limits use the real client IP |
| `PORT` | Usually set by the host |

In production (`NODE_ENV=production` or an https `PUBLIC_URL`) the server refuses to start unless `DATABASE_URL`,
an https `PUBLIC_URL`, `MAIL_DRIVER=resend` and `RESEND_API_KEY` are all set.

## API

All `/api` requests need `X-Device-Id` (random per install) and, when `APP_KEY` is set, `X-App-Key`.
Rate limits are per device and per IP (in memory).

| Endpoint | Body | Response |
|---|---|---|
| `POST /api/stt/token` | `{}` | `{ token, expiresIn }` |
| `POST /api/classify` | `{ state: string, presets: string[] }` | `{ isQuestion: 0..1, probabilities: number[] }` (same order as `presets`) |

## Socket events (rooms)

| Who | Event | Payload |
|---|---|---|
| host → server | `room:create` (ack) | → `{ ok, roomId, hostKey, joinUrl, messages }` |
| host → server | `room:resume` (ack) | `{ roomId, hostKey }` → same as create |
| host → server | `room:close` | |
| any → server | `message:send` | `{ text }` (guests get an ack `{ ok, error? }`); hosts may add `name` and `image` (JPEG/PNG/WebP data: URL) |
| server → room | `message:new` | `{ id, name, text, at, host, image? }` |
| server → room | `room:presence` | `{ guests: string[], hostOnline }` |
| server → guest | `room:history` | `Message[]` |
| server → all | `room:closed` / `fatal` | `{ reason }` / `{ error }` |

Hosts authenticate with `auth: { role: 'host', appKey }`. Limits: 1000 chars per guest message (10,000 for the
host), 1 message per 0.8 s per guest, images 1 MB (host only, the latest 30 are kept), 50 guests, 500 messages of
history. Rooms close when the host closes them, 30 min after the host
disconnects, or after 12 h. Everything is in memory.

## Before going big

This is ready for a beta. For a public launch, add user accounts (so usage is tied to people, not device ids),
persistent rate limits / quotas (e.g. Redis), and billing if you pay for Deepgram / TypeSafe on users' behalf.

## Test

```bash
npm test
```
