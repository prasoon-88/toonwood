# Call Copilot Backend

Express + Socket.IO server behind the desktop app. It holds the product's service keys so app users only need
their own AI key.

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

## Deploy

Deploy this folder to any Node 20+ host (Render, Railway, Fly.io, a VPS) and set:

| Env var | Purpose |
|---|---|
| `PUBLIC_URL` | Public https address, e.g. `https://api.callcopilot.app` (used in QR codes) |
| `APP_KEY` | Shared key built into the app (`MAIN_VITE_APP_KEY`); only the app can use the API and host rooms |
| `DEEPGRAM_API_KEY` | Deepgram key with **Member** role or higher (needed to mint temporary tokens) |
| `TYPESAFE_API_KEY` | Optional; without it the app falls back to offline preset matching |
| `TRUST_PROXY` | Set to `1` behind a hosting proxy so rate limits use the real client IP |
| `PORT` | Usually set by the host |

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
