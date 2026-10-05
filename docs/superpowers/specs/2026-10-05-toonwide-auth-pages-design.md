# Toonwide auth pages: design

Date: 2026-10-05
Status: approved in chat ("go")

## 1. Goal

Redesign the sign-up, log-in, confirm-email, forgot-password and reset-password pages in the landing page's visual
language (`web/src/landing/` tokens, fonts, GlowButton, Logo). Behaviour, API calls and every accessible name the
tests use stay exactly as they are.

## 2. Constraints

- Same rules as the landing page: MUI components + Bootstrap grid; MUI 9 `sx` only; light theme (`landingTheme`)
  for these pages; fonts from npm; no images (CSS/SVG art); responsive to 360 px with no horizontal scroll;
  AA contrast; decorative art `aria-hidden`; reduced motion respected; neutral copy (never "undetectable"/"cheat",
  no interview/exam framing).
- **Unchanged accessibility contract** (tests depend on it): field labels "Email", "Password", "Confirm password",
  "New password"; buttons "Create account", "Log in", "Send reset link", "Change password", "Confirm my email";
  page headings (the page's single h1) "Create your account", "Check your email", "Log in", "Confirm your email",
  "Verifying…" (if still used), "Email verified", "Link not valid", "Reset your password", "Choose a new password",
  "Password changed"; errors inside `role="alert"` whose textContent is exactly the message; links "Log in",
  "Forgot password?", "Create an account".
- New controls must not collide with those names: the password visibility toggle's accessible name is
  "Show characters" / "Hide characters" (never containing the word "password", because Playwright's `getByLabel`
  matches substrings).
- Existing tests (`src/pages/Signup.test.tsx`, `src/pages/Verify.test.tsx`, `e2e/signup.spec.ts`) keep passing unchanged.

## 3. Shared layout: `web/src/auth/AuthLayout.tsx`

`AuthLayout({ title, subtitle?, children, footer? })`, wrapped in `ThemeProvider theme={landingTheme}` + `CssBaseline`:

- Full-height split (`container-fluid`, `row g-0`, `min-vh-100`):
  - **Left** (`col-lg-6`, hidden below `lg`, `aria-hidden`): `tokens.sky` background with the same soft hills/scrim
    treatment as the hero; top-left `Logo color="#fff"`; centred serif line (`fonts.display`, 56 px, white)
    "Real-time answers, right on your call"; below it a compact glass answer panel (reuse the ProductShot panel
    look: header "AI · 12:41 left", blue pill "What should I say?", one-line answer
    "“Start with the trade-off, then give one clear example.”").
  - **Right** (`col-12 col-lg-6`, white): flex column; top bar with a "← Back to home" link (`/`) and, on phones,
    the dark `Logo`; centred form column max-width 420 px; title as h1 (`fonts.display`, 44 px desktop / 36 px
    mobile, ink); optional subtitle (muted, 16 px); children; optional `footer` (links row, 14 px muted); bottom
    "© {year} Toonwide" (12 px faint).
- `AuthField` (`web/src/auth/AuthField.tsx`): MUI `TextField` `fullWidth`, 48 px tall input, radius 12, label
  above-style (MUI outlined is fine), no `required` prop (keeps labels exact); `type="password"` fields get an end
  adornment `IconButton` with `aria-label` "Show characters"/"Hide characters" toggling visibility; optional
  `helperText`.
- `PasswordStrength` (`web/src/auth/PasswordStrength.tsx`): small bar + text under the Sign-up/Reset password field:
  "Too short" (< 10 chars), "Okay" (10–13), "Strong" (≥ 14 with a mix of letters and digits/symbols). Purely a hint;
  server rules are unchanged.
- Primary actions use `GlowButton` (full width, `type="submit"`); errors `Alert severity="error"`; success/info
  states use a centred CSS/SVG illustration (`aria-hidden`): an envelope for "Check your email", an envelope with a
  check for verify, a key for password changed.

## 4. Pages

| Page | Title / subtitle | Body |
|---|---|---|
| Sign up `/signup` | "Create your account" / "Start with 60 free minutes." | Email, Password (+ strength), Confirm password, "Create account"; footer "Already have an account? Log in". Done state: "Check your email" + "We sent a link to **{email}**. Open it to activate your account and get your free minutes." + "Go to log in" link. |
| Log in `/login` | "Log in" / "Welcome back to Toonwide." | Email, Password (+ toggle), "Log in"; footer "Forgot password? · Create an account". |
| Confirm `/verify` | "Confirm your email" / "Click the button to verify your email address." | Envelope-check art, "Confirm my email". Success: "Email verified" + "Your free minutes are ready. Log in to continue." + GlowButton link "Log in". Error: "Link not valid" + alert + "Log in to get a new link." |
| Forgot `/forgot` | "Reset your password" / "Enter your email and we'll send you a reset link." | Email, "Send reset link"; done: "Check your email" + "If an account exists for **{email}**, we sent a link to reset the password. It's valid for 1 hour." + "Back to log in". |
| Reset `/reset` | "Choose a new password" | New password (+ strength), Confirm password, "Change password"; done: "Password changed" + "You've been logged out everywhere. Log in with your new password." + GlowButton link "Log in". |

The old `web/src/components/Card.tsx` and `Field.tsx` are removed once no page uses them (Dashboard still uses
`Card`; keep `Card` until the Dashboard redesign).

## 5. Testing

- `web/src/auth/AuthLayout.test.tsx`: renders the h1 title, the "Back to home" link to `/`, and the decorative
  panel is `aria-hidden`.
- `web/src/auth/AuthField.test.tsx`: password toggle switches `type` between password and text and its name between
  "Show characters" and "Hide characters"; `getByLabelText('Password')` still resolves to the input.
- `web/src/auth/PasswordStrength.test.tsx`: the three levels.
- Page tests: Login (renders title, links, error alert on 401); Forgot (done state); Reset (mismatch error without a
  request; done state). Existing Signup/Verify tests unchanged.
- Playwright `e2e/signup.spec.ts` unchanged and passing; add a 375 px no-horizontal-scroll check for `/login` and
  `/signup` in `e2e/auth.spec.ts`.
