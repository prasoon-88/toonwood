# Toonwide: accounts, timed sessions, server-side AI and chat history

Date: 2026-10-05
Status: approved in chat, pending written-spec review

## 1. Goal

Turn Call Copilot into **Toonwide**, a shippable product:

- Users sign up on a website with email + password and verify their email.
- On the dashboard they click **Start session**. The website launches the installed desktop app, which works only
  while that session is active.
- Sessions last at most 60 minutes and are paid for from **minute packs** ("N minutes valid for M days").
- AI is included: the server calls the model with the operator's key, chosen per scenario by config (LangChain).
- Everything in a session (transcript, Q&A, screenshots, room messages) is stored and viewable afterwards.

Out of scope for this spec (designed for, built later): payments (Stripe), plan purchase UI, admin UI beyond a CLI
script, macOS/Linux builds, a browser-only client.

## 2. Decisions

| Topic | Decision |
|---|---|
| Client | The website launches the existing Electron desktop app via a `toonwide://` deep link |
| Architecture | Approach A: grow `room-server/` into the single backend (Express + Socket.IO), which also serves the website |
| Website | New `web/` folder: React + Vite + TypeScript, built to static files served by the backend |
| Database | Postgres with Drizzle ORM |
| Login | Own email + password (argon2id), verified email required |
| AI | Server-side, operator's keys, LangChain `initChatModel`, model per scenario in `ai.config.js`; default DeepSeek `deepseek-v4-flash` for all scenarios |
| Concurrency | One active session per account; starting a new one ends the old one |
| Session end | Countdown, warnings at 5 and 1 minute, then everything stops and the app locks |
| Plans | One-time minute packs only, **no recurring**; users can hold several packs |
| Free pack | Granted once after email verification: 60 minutes, valid 7 days |
| History | Stored per session, kept 90 days (plan setting), "Save chat history" switch on by default |
| Email | Resend behind a small interface; dev mode prints links to the console |
| Name | **Toonwide** everywhere: website, app, installer, `com.toonwide.app`, `toonwide://` |

## 3. Architecture

```
Website (web/, React)  ──cookie──►┐
                                   │
Desktop app (Electron) ──token──► Backend (room-server/ → Express + Socket.IO)
   │                               ├─ auth, sessions, minute packs
   │                               ├─ /api/ai/answer  ── LangChain ──► AI providers (operator keys)
   │                               ├─ /api/stt/token  ─────────────► Deepgram (mints short-lived tokens)
   │                               ├─ /api/classify   ─────────────► TypeSafe Jev
   │                               ├─ rooms (Socket.IO) ◄── phones (/r/:id)
   │                               └─ Postgres (Drizzle) + image storage (local dir / S3 / R2)
   └── audio WebSocket (short-lived token) ──► Deepgram
```

Audio still streams directly from the app to Deepgram (lowest latency). Everything else goes through the backend.

### Backend layout (`room-server/`, renamed in package metadata to `toonwide-server`)

| Module | Responsibility |
|---|---|
| `db/schema.js`, `db/index.js` | Drizzle schema and connection |
| `auth/` | sign-up, login, logout, verify email, forgot/reset password, cookie sessions, CSRF |
| `sessions/` | start, status, end, launch codes, exchange, token checks, expiry sweeper |
| `billing/` | packs (grants), minutes left, session length, charging used minutes |
| `ai/` | `ai.config.js`, `prompts.js`, model factory (LangChain), `/api/ai/answer` streaming, limits, usage |
| `history/` | chat message batches, AI answer saving, images, listing, deletion, retention sweeper |
| `rooms/` | existing room logic, now authenticated by session token and persisted |
| `mail/` | `sendMail` interface: Resend in production, console in development |
| `storage/` | `put/get/delete` for images: local folder in dev, S3/R2 in production |
| `api.js` | existing `/api/stt/token`, `/api/classify`, now session-token protected |
| `server.js` | wiring, security headers, static website, health check |

## 4. Data model (Postgres)

| Table | Columns (main) |
|---|---|
| `users` | id, email (unique, lowercased), password_hash, email_verified_at, created_at, deleted_at |
| `web_sessions` | id (random, stored hashed), user_id, expires_at, created_at, user_agent |
| `email_tokens` | id, user_id, purpose (`verify`/`reset`), token_hash, expires_at, used_at |
| `plans` | id, name, minutes, valid_days, session_max_minutes, history_days, features (jsonb), price_cents, stripe_price_id |
| `grants` | id, user_id, plan_id, minutes_total, starts_at, ends_at, source (`free`/`purchase`/`admin`), created_at |
| `sessions` | id, user_id, device_id, status (`pending`/`active`/`ended`), started_at, ends_at, ended_at, end_reason, save_history |
| `launch_codes` | code_hash, session_id, expires_at, used_at |
| `session_charges` | session_id, grant_id, minutes |
| `usage` | session_id, scenario, model, input_tokens, output_tokens, created_at |
| `chat_messages` | id, session_id, seq, kind (`transcript`/`question`/`answer`/`room`), speaker, name, text, image_id, model, source, created_at |
| `images` | id, session_id, storage_key, mime, bytes, created_at |
| `rooms` | id, session_id, created_at, closed_at |

`plans.features` example:
```json
{ "rooms": true, "screenshots": true,
  "models": { "screenshot": "anthropic:claude-sonnet-5-5" },
  "limits": { "answersPerMinute": 30, "answersPerSession": 300 } }
```

Seed plan: `free` = 60 minutes, valid 7 days, session max 60, history 90 days, all features, default models.

## 5. Flows

### 5.1 Sign-up, verification, login
1. Sign-up: email + password (min 10 chars, not in a common-password list) → user created → verification email
   (single-use token, 24 h).
2. Opening the link sets `email_verified_at` and grants the free pack once (guarded by a unique
   `(user_id, source='free')` check).
3. Login → `web_sessions` row, cookie `tw_session` (`httpOnly`, `Secure`, `SameSite=Lax`, 30 days). Failed logins
   are rate limited: 5 per email and 50 per IP per 15 minutes, then `429`.
4. Forgot password → reset email (single-use, 1 h). Reset ends all web sessions and any active app session.

### 5.2 Start session
1. Dashboard → `POST /api/sessions` (cookie + CSRF token). Requires a verified email.
2. Server: minutes left = sum over unexpired grants of (minutes_total − charged). If 0 → `402 out_of_minutes`.
3. Ends the user's existing active session (end_reason `replaced`), closing its room.
4. Creates session `pending`, `ends_at = now + min(session_max_minutes, minutes left)`; creates a launch code
   (random 32 bytes, hash stored, 60 s).
5. Page opens `toonwide://launch?code=<code>`. If the app doesn't respond (no blur within 2 s), show
   "Download Toonwide".

### 5.3 App exchange and use
1. App receives the deep link (single-instance lock; second launch forwards the URL), calls
   `POST /api/app/exchange { code, deviceId }`.
2. Server checks hash, unused, unexpired; marks used; sets session `active`, `device_id`; returns a signed token
   (JWT HS256, claims `sid`, `uid`, `did`, `exp = ends_at`) and `endsAt`.
3. App stores the token with `safeStorage`, unlocks, shows the countdown.
4. Every app request sends `Authorization: Bearer <token>` and `X-Device-Id`. The server checks signature, expiry,
   that the session is `active`, and that `did` matches. Session status is cached in memory for 5 s.

### 5.4 End of session
Triggers: `ends_at` reached (sweeper every 15 s plus check on each request), user clicks End (app or dashboard),
replaced by a new session, password reset.

Server: status `ended`, records `end_reason`, charges `ceil(actual minutes)` across grants (soonest-expiring
first, recorded in `session_charges`), closes the room (`room:closed`), rejects further requests with
`401 session_ended`.

App: warnings at 5 and 1 minute; at 0 or on `session_ended`, stops listening, cancels the answer, locks with
"Session ended" and an "Open website" button.

### 5.5 Errors
| Case | Behaviour |
|---|---|
| Code expired / used | App: "Link expired, click Start session again" |
| App opened without a session | Locked screen with "Open website" |
| Offline mid-session | Requests fail with a retry message; countdown continues from stored `endsAt`; resync on reconnect |
| Out of minutes | Dashboard: "Out of minutes" (later "Buy minutes") |

## 6. AI proxy

`POST /api/ai/answer` (session token). Body:
`{ scenario: 'speech'|'screenshot'|'room', question, transcript, references, context: { resume, role, systemPrompt }, image? }`.
Response: `text/event-stream` with events `delta { text }`, `done { usage }`, `error { message }`.

`ai.config.js`:
```js
export default {
  scenarios: {
    speech:     { model: 'deepseek:deepseek-v4-flash', maxOutputTokens: 600 },
    screenshot: { model: 'deepseek:deepseek-v4-flash', maxOutputTokens: 2000, vision: true },
    room:       { model: 'deepseek:deepseek-v4-flash', maxOutputTokens: 800 },
  },
}
```
Model choice: `plan.features.models[scenario]` → `scenarios[scenario].model`. Models are created with LangChain
`initChatModel` and cached. Provider keys come only from server env (`DEEPSEEK_API_KEY`, ...). Provider packages
are installed as needed, starting with `@langchain/deepseek`.

Prompts (`prompts.js`): the existing spoken-answer prompt and the answer-only screenshot prompt move from
`src/main/llm.ts`. `context` fields are capped at 4,000 characters each. A user `systemPrompt` replaces the default
for `speech` and `room` only.

Screenshots: sent as an image content part (data URL, JPEG). Route body limit 4 MB. If the resolved screenshot
model isn't marked `vision: true` → `422` with a clear message.

Limits (from plan features): 1 answer in flight per session (a new one aborts the old), 30 per minute,
300 per session, `maxOutputTokens` per scenario. Client disconnect aborts the model call.

Usage: token counts from LangChain usage metadata go to `usage`. The answer (question, text, model, scenario,
image) is written to `chat_messages` when the stream finishes (if `save_history`).

Errors returned to the app are short and generic; details go to server logs without message text or keys.

## 7. Chat history

- App batches transcript lines and preset answers to `POST /api/sessions/:id/messages` every 3 s (max 100 per
  batch, retried on failure, client-generated ids to avoid duplicates).
- AI answers and room messages are saved by the server.
- Writes to an ended session or with `save_history = false` are rejected / skipped.
- Images go to `storage/` (local folder in dev, S3/R2 in prod); the DB holds the key.
- Website: Sessions list → session detail timeline with Copy buttons; delete session; delete account.
- Retention sweeper (hourly) deletes messages and images older than the plan's `history_days` (90).
- The app's "Save chat history" switch is sent at exchange time and stored on the session.

## 8. Rooms

- Hosts authenticate with the session token (`auth: { role: 'host', token }`) instead of `APP_KEY`.
- A room belongs to a session (`rooms` table); messages are saved to `chat_messages` (`kind = room`).
- On session end the room closes. Room history survives server restarts.
- Room features are gated by `plan.features.rooms`.

## 9. Desktop app changes (`call-copilot/` → product name Toonwide)

- Rename: `productName` Toonwide, `appId com.toonwide.app`, window/tray titles, installer name, README.
- Register `toonwide://` (`app.setAsDefaultProtocolClient`), single-instance lock, handle `second-instance` URLs.
- New `src/main/session.ts`: exchange, token storage (`safeStorage`), status, countdown events, end handling.
- `backend.ts` sends the bearer token; `llm.ts` is replaced by a streaming client for `/api/ai/answer`.
- Locked screen, countdown in the header, 5/1 minute toasts, "Session ended" screen.
- Settings: AI provider/key and own Deepgram/TypeSafe key sections removed; resume, role, custom prompt and
  "Save chat history" remain.
- Electron hardening: `sandbox: true`, CSP in `index.html`, IPC sender checks, deep link format validation.

## 10. Security summary

argon2id passwords; rate-limited login; hashed single-use email and launch tokens; `httpOnly` `Secure`
`SameSite=Lax` cookies with CSRF tokens on state-changing website requests; signed session tokens checked against
the DB; device binding; HTTPS only (HSTS); `helmet` headers; zod validation on every input; request size limits;
per-user rate limits; no message text, tokens or keys in logs; `APP_KEY` removed.

## 11. Configuration (server env)

`DATABASE_URL`, `PUBLIC_URL`, `SESSION_TOKEN_SECRET`, `DEEPSEEK_API_KEY` (and other provider keys as configured),
`DEEPGRAM_API_KEY`, `TYPESAFE_API_KEY`, `RESEND_API_KEY`, `MAIL_FROM`, `STORAGE_DRIVER` (`local`/`s3`),
`STORAGE_DIR` or S3 settings, `TRUST_PROXY`, `PORT`.

## 12. Testing

- Server (node test runner + a test Postgres): auth flows; start session (minutes left, replacement, length);
  exchange (expired, reused, wrong device); charging across several grants; AI proxy with a fake LangChain model
  (streaming, cancel, limits, vision check, usage); history batches, deletion, retention; rooms with session auth.
  The existing smoke test is extended.
- Website: component tests for forms; one Playwright run: sign up → verify (console mail) → start session.
- App: typecheck; manual check of deep link → unlock → countdown → end.

## 13. Build order

1. Database, plans, grants, auth (website login works).
2. Sessions, launch codes, exchange, expiry and charging.
3. AI proxy (LangChain) and moving `/api/stt/token`, `/api/classify` behind session tokens.
4. Desktop app: rename, deep link, session lock/countdown, server AI client, hardening.
5. Chat history (server + app batching + website timeline).
6. Rooms on session auth and persisted.
7. Website polish, retention sweeper, docs.
