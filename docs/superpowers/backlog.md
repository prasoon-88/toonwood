# Toonwide backlog: deferred from Phase 1

Findings from the Phase 1 reviews that were deferred on purpose. Pick them up in the phase named, or earlier.

## Before public launch (Phase 7 polish or earlier)

- Content Security Policy: helmet runs without CSP; MUI/emotion inline styles and `room-server/public/room.html` inline script need nonces or route-scoped policies.
- Verification hardening: per-recipient limit on verify emails; bind verification to the password (or require login) so an attacker-triggered link cannot verify an account with the attacker password.
- `auth/limiter.js` never sweeps untouched keys: unbounded memory under distinct-key floods (one entry per visitor IP in mail limits).
- Replace the 28-entry common-password list with a real breach list (10+ character entries).
- JSON error handler for `/api` (mail-provider failures currently surface as HTML 500).
- Graceful shutdown: SIGTERM handler, close the pg pool / PGlite (`createDb` has no `close()`).

## Phase 2 (sessions) and payments

- `billing/grants.js` `grantPack` uses an untargeted `onConflictDoNothing()`: scope it to the free-pack index before paid grants exist, or duplicate paid grants silently return null.
- Password reset should also end the active app session (Plan 2).

## Smaller items

- Task 1: minor (deferred): testing/server.js close() not idempotent (second call rejects)
- Task 2: minor (deferred): createDb exposes no close(); pg.Pool/PGlite not released by server.close
- Task 2: minor (deferred): free-pack partial index not tested in db.test.js (covered behaviourally by Task 3 grants test)
- Task 2: minor (deferred): users_email_key case-sensitive — relies on Task 6 zod lowercasing (planned)
- Task 3: minor (deferred): grantPack onConflictDoNothing() untargeted — would swallow future unique conflicts on grants (e.g. payment ref); scope to free index when payments land
- Task 3: minor (deferred): no tests for fully-used pack filtered out / pack not yet started
- Task 4: minor (deferred): no boot-time guard against MAIL_DRIVER=console in production; resend w/o apiKey / outbox w/o file only fail at send time
- Task 4: minor (deferred): templates interpolate url unescaped into HTML (server-built URLs only today)
- Task 4: minor (deferred): thin template/console-driver test coverage
- Task 5: minor (deferred): limiter Map never sweeps untouched keys — unbounded memory under distinct-key floods
- Task 5: minor (deferred): unknown purpose → Invalid Date in createEmailToken; common-password list minimal; no deleteWebSession test
- Task 6: minor (deferred): timing differences reveal account existence on signup/forgot paths
- Task 6: minor (deferred): /verify consumes token outside tx; no null/deletedAt check on user in verify; reset ignores deletedAt and isn't transactional
- Task 6: minor (deferred): mailer.send failure → 500 via default handler, no JSON error handler
- Task 6: minor (deferred): test "free pack granted once" doesn't test the grant path twice; no tests for 30/IP mail and 50/IP login limits
- Task 6: minor (deferred): per-IP login counter now counts successful logins too (50/15min cap on all attempts per IP)
- Task 7: minor (deferred): api.ts csrf fetch unchecked (res.ok); no 403 retry; Dashboard logout no try/catch; Forgot/Reset no busy state; mixed quote style in Dashboard sx; app.test.js imports mid-file
- Task 8: minor (deferred): room-server/README Deploy env table still lists old keys only (no DATABASE_URL/MAIL_*/WEB_URL), old callcopilot host
- Task 8: minor (deferred): playwright webServer default 60s timeout incl. build; e2e/playwright config not type-checked
