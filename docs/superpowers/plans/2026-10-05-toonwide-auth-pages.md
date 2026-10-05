# Toonwide Auth Pages: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sign-up, log-in, confirm-email, forgot-password and reset-password pages redesigned in the landing
page's visual language, one page per task, with behaviour and accessible names unchanged.

**Architecture:** New `web/src/auth/` module: `AuthLayout` (split screen: sky art panel + white form column, wrapped
in `landingTheme`), `AuthField` (TextField with password visibility toggle), `PasswordStrength`, and small
`AuthArt` illustrations. Each page in `web/src/pages/` is rewritten on top of them; API calls are untouched.

**Tech Stack:** React 19, MUI 9 (`sx` only), Bootstrap grid, react-router 7, `web/src/landing/` tokens/theme/
GlowButton/Logo, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-05-toonwide-auth-pages-design.md` (copy, layout and the accessibility
contract are binding; use its text verbatim).

## Global Constraints

- MUI components + Bootstrap grid; MUI 9 `sx` only; `landingTheme` (its breakpoints match Bootstrap: sm 576,
  md 768, lg 992, xl 1200); fonts from npm; no images; decorative art `aria-hidden`; AA contrast; visible focus;
  reduced motion; responsive 360–1440 with no horizontal overflow; neutral copy.
- Accessibility contract from spec §2 is fixed: field labels, button names, h1 titles, `role="alert"` errors, link
  names. The password toggle is named "Show characters" / "Hide characters" (never containing "password").
- `src/pages/Signup.test.tsx`, `src/pages/Verify.test.tsx` and `e2e/signup.spec.ts` must pass unchanged.
- Use landing tokens (`tokens.primaryGradient`, `tokens.divider`, `tokens.ink`, `fonts.display`…) instead of ad-hoc values.
- Visual check each task with Playwright screenshots at 360, 768, 1100 and 1440 px (scratch script, not committed).
- Work in `web/`: `npx vitest run`, `npm run build`, `npm run e2e`.

---

### Task 1: Shared auth layout and fields

**Files:** Create `web/src/auth/AuthLayout.tsx`, `AuthField.tsx`, `PasswordStrength.tsx`, `AuthArt.tsx`,
`AuthLayout.test.tsx`, `AuthField.test.tsx`, `PasswordStrength.test.tsx`.

**Interfaces (produced):**
- `AuthLayout({ title: string, subtitle?: ReactNode, children: ReactNode, footer?: ReactNode })`: renders the
  title as the page's single `h1`.
- `AuthField({ label, type?, autoComplete?, value, onChange, helperText? })`: MUI TextField, no `required` prop;
  for `type="password"` an end-adornment `IconButton` with `aria-label` "Show characters" / "Hide characters"
  toggles the input type.
- `passwordStrength(pw: string): 'Too short' | 'Okay' | 'Strong'` and `PasswordStrength({ value })` (bar + label;
  rendered only when `value` is non-empty).
- `AuthArt({ kind: 'mail' | 'mail-check' | 'key' | 'warning' })`: aria-hidden CSS/SVG illustration.

- [ ] **Step 1: Write the failing tests**

`web/src/auth/AuthLayout.test.tsx`:

```tsx
import { afterEach, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AuthLayout } from './AuthLayout'

afterEach(cleanup)

test('renders the title as the only h1, a back link and decorative art', () => {
  render(<MemoryRouter><AuthLayout title="Log in" subtitle="Welcome back to Toonwide.">form</AuthLayout></MemoryRouter>)
  const h1s = screen.getAllByRole('heading', { level: 1 })
  expect(h1s).toHaveLength(1)
  expect(h1s[0].textContent).toBe('Log in')
  expect(screen.getByText('Welcome back to Toonwide.')).toBeTruthy()
  expect(screen.getByRole('link', { name: /Back to home/ }).getAttribute('href')).toBe('/')
  expect(document.querySelector('[data-testid="auth-art-panel"]')?.getAttribute('aria-hidden')).toBe('true')
  expect(screen.getByText(`© ${new Date().getFullYear()} Toonwide`)).toBeTruthy()
})
```

`web/src/auth/AuthField.test.tsx`:

```tsx
import { afterEach, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { AuthField } from './AuthField'

afterEach(cleanup)

function PasswordHarness() {
  const [value, setValue] = useState('')
  return <AuthField label="Password" type="password" value={value} onChange={(e) => setValue(e.target.value)} />
}

test('password fields toggle visibility and keep their exact label', () => {
  render(<PasswordHarness />)
  const input = screen.getByLabelText('Password') as HTMLInputElement
  expect(input.type).toBe('password')
  fireEvent.click(screen.getByRole('button', { name: 'Show characters' }))
  expect(input.type).toBe('text')
  fireEvent.click(screen.getByRole('button', { name: 'Hide characters' }))
  expect(input.type).toBe('password')
})

test('non-password fields have no toggle', () => {
  render(<AuthField label="Email" type="email" value="" onChange={() => {}} />)
  expect(screen.getByLabelText('Email')).toBeTruthy()
  expect(screen.queryByRole('button')).toBeNull()
})
```

`web/src/auth/PasswordStrength.test.tsx`:

```tsx
import { afterEach, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PasswordStrength, passwordStrength } from './PasswordStrength'

afterEach(cleanup)

test('strength levels', () => {
  expect(passwordStrength('short')).toBe('Too short')
  expect(passwordStrength('abcdefghijk')).toBe('Okay')
  expect(passwordStrength('correct horse 42')).toBe('Strong')
  expect(passwordStrength('abcdefghijklmnop')).toBe('Okay')
})

test('renders the label only when there is a value', () => {
  const { rerender } = render(<PasswordStrength value="" />)
  expect(screen.queryByText(/Too short|Okay|Strong/)).toBeNull()
  rerender(<PasswordStrength value="correct horse 42" />)
  expect(screen.getByText('Strong')).toBeTruthy()
})
```

- [ ] **Step 2:** `npx vitest run src/auth` → FAIL (modules missing).
- [ ] **Step 3: Implement** spec §3 exactly: split layout (`container-fluid`, `row g-0 min-vh-100`; left
  `d-none d-lg-flex col-lg-6` with `data-testid="auth-art-panel"` and `aria-hidden="true"`: `tokens.sky`
  background, hills/scrim like the hero, white `Logo`, serif line, compact glass panel; right `col-12 col-lg-6`:
  top bar "← Back to home" link (MUI `Link component={RouterLink} to="/"`, visible focus) + dark `Logo` on phones,
  centred column `maxWidth: 420`, title `Typography component="h1"` with `fonts.display` `fontSize: { xs: 36,
  md: 44 }`, subtitle muted 16 px, children, footer 14 px muted, bottom "© {year} Toonwide"). Wrap in
  `ThemeProvider theme={landingTheme}` + `CssBaseline`. `passwordStrength`: `< 10` chars → "Too short";
  `>= 14` and contains a letter and a digit-or-symbol → "Strong"; else "Okay". Bar: 4 px tall, radius 999, colour
  by level (`#d64545`, `#d99a1e`, `#1f9d55`), label 13 px.
- [ ] **Step 4:** `npx vitest run` and `npm run build` pass.
- [ ] **Step 5: Commit** `feat(auth): split-screen auth layout, fields and password strength`.

---

### Task 2: Sign-up page

**Files:** Rewrite `web/src/pages/Signup.tsx` on `AuthLayout`/`AuthField`/`PasswordStrength`/`GlowButton`/`AuthArt`.
Tests: existing `src/pages/Signup.test.tsx` (unchanged) + new `src/pages/Signup.layout.test.tsx`.

- [ ] **Step 1: Write the failing test** `web/src/pages/Signup.layout.test.tsx`:

```tsx
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Signup } from './Signup'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('sign-up uses the auth layout with subtitle, strength hint and log-in link', () => {
  vi.stubGlobal('fetch', vi.fn())
  render(<MemoryRouter><Signup /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1, name: 'Create your account' })).toBeTruthy()
  expect(screen.getByText('Start with 60 free minutes.')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } })
  expect(screen.getByText('Too short')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/login')
  expect(screen.getAllByRole('button', { name: 'Show characters' }).length).toBe(2)
})
```

- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3: Implement** per spec §4 row "Sign up" verbatim (form + done state with `AuthArt kind="mail"`,
  heading "Check your email", "Go to log in" link). Keep the existing validation (mismatch → "Passwords do not
  match", < 10 chars → "Password must be at least 10 characters") and API call. Submit is a full-width
  `GlowButton type="submit"` named "Create account", disabled while busy.
- [ ] **Step 4:** `npx vitest run` (both Signup tests), `npm run build`, `npm run e2e` pass; screenshots.
- [ ] **Step 5: Commit** `feat(auth): redesigned sign-up page`.

---

### Task 3: Log-in page

**Files:** Rewrite `web/src/pages/Login.tsx`; create `web/src/pages/Login.test.tsx`.

- [ ] **Step 1: Write the failing test** `web/src/pages/Login.test.tsx`:

```tsx
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Login } from './Login'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('log-in page shows title, subtitle and links', () => {
  vi.stubGlobal('fetch', vi.fn())
  render(<MemoryRouter><Login /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1, name: 'Log in' })).toBeTruthy()
  expect(screen.getByText('Welcome back to Toonwide.')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Forgot password?' }).getAttribute('href')).toBe('/forgot')
  expect(screen.getByRole('link', { name: 'Create an account' }).getAttribute('href')).toBe('/signup')
})

test('a wrong password shows the server error in an alert', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) =>
    url.endsWith('/csrf')
      ? new Response(JSON.stringify({ csrfToken: 't' }), { status: 200 })
      : new Response(JSON.stringify({ error: 'Wrong email or password' }), { status: 401 })
  ))
  render(<MemoryRouter><Login /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@example.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong password!!' } })
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Wrong email or password')
})
```

- [ ] **Step 2:** run → FAIL (subtitle missing).
- [ ] **Step 3: Implement** spec §4 row "Log in" verbatim; keep the API call and the navigate to `/dashboard`.
- [ ] **Step 4:** tests, build, e2e pass; screenshots.
- [ ] **Step 5: Commit** `feat(auth): redesigned log-in page`.

---

### Task 4: Confirm-email page

**Files:** Rewrite `web/src/pages/Verify.tsx`; existing `src/pages/Verify.test.tsx` unchanged; create
`src/pages/Verify.layout.test.tsx`.

- [ ] **Step 1: Write the failing test** `web/src/pages/Verify.layout.test.tsx`:

```tsx
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Verify } from './Verify'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('confirm page uses the auth layout and shows a log-in button on success', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) =>
    new Response(JSON.stringify(url.endsWith('/csrf') ? { csrfToken: 't' } : { ok: true }), { status: 200 })
  ))
  render(<MemoryRouter initialEntries={['/verify?token=abc']}><Verify /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1, name: 'Confirm your email' })).toBeTruthy()
  expect(screen.getByText('Click the button to verify your email address.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Confirm my email' }))
  expect(await screen.findByRole('heading', { level: 1, name: 'Email verified' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/login')
})

test('an invalid link shows the error alert', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) =>
    url.endsWith('/csrf')
      ? new Response(JSON.stringify({ csrfToken: 't' }), { status: 200 })
      : new Response(JSON.stringify({ error: 'This link is invalid or has expired. Request a new one.' }), { status: 400 })
  ))
  render(<MemoryRouter initialEntries={['/verify?token=bad']}><Verify /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Confirm my email' }))
  expect(await screen.findByRole('heading', { level: 1, name: 'Link not valid' })).toBeTruthy()
  expect(screen.getByRole('alert').textContent).toBe('This link is invalid or has expired. Request a new one.')
})
```

- [ ] **Step 2:** run → FAIL until the page uses AuthLayout (the "Log in" link must be a GlowButton link to
  `/login`).
- [ ] **Step 3: Implement** spec §4 row "Confirm" verbatim with `AuthArt` (`mail-check`, `warning` for the error);
  keep the single-send guard and the button disabled while sending.
- [ ] **Step 4:** tests (both Verify files), build, e2e pass; screenshots.
- [ ] **Step 5: Commit** `feat(auth): redesigned confirm-email page`.

---

### Task 5: Forgot and reset password pages + mobile e2e

**Files:** Rewrite `web/src/pages/Forgot.tsx`, `web/src/pages/Reset.tsx`; create `src/pages/Forgot.test.tsx`,
`src/pages/Reset.test.tsx`, `web/e2e/auth.spec.ts`.

- [ ] **Step 1: Write the failing tests**

`web/src/pages/Forgot.test.tsx`:

```tsx
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Forgot } from './Forgot'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('forgot password sends the link and shows check-your-email', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) =>
    new Response(JSON.stringify(url.endsWith('/csrf') ? { csrfToken: 't' } : { ok: true }), { status: 200 })
  ))
  render(<MemoryRouter><Forgot /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1, name: 'Reset your password' })).toBeTruthy()
  expect(screen.getByText("Enter your email and we'll send you a reset link.")).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
  expect(await screen.findByRole('heading', { level: 1, name: 'Check your email' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Back to log in' }).getAttribute('href')).toBe('/login')
})
```

`web/src/pages/Reset.test.tsx`:

```tsx
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Reset } from './Reset'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('mismatched passwords show an error without calling the server', () => {
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  render(<MemoryRouter initialEntries={['/reset?token=abc']}><Reset /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1, name: 'Choose a new password' })).toBeTruthy()
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'a good long passphrase' } })
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'another passphrase!' } })
  fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
  expect(screen.getByRole('alert').textContent).toBe('Passwords do not match')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('a successful reset shows password changed with a log-in button', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) =>
    new Response(JSON.stringify(url.endsWith('/csrf') ? { csrfToken: 't' } : { ok: true }), { status: 200 })
  ))
  render(<MemoryRouter initialEntries={['/reset?token=abc']}><Reset /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'a good long passphrase' } })
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'a good long passphrase' } })
  fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
  expect(await screen.findByRole('heading', { level: 1, name: 'Password changed' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/login')
})
```

`web/e2e/auth.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

for (const path of ['/login', '/signup', '/forgot']) {
  test(`${path} fits a 360 px phone`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 760 })
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll('body *')].some((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.right > window.innerWidth + 1
      })
    )
    expect(overflow).toBe(false)
  })
}
```

- [ ] **Step 2:** run vitest → FAIL.
- [ ] **Step 3: Implement** spec §4 rows "Forgot" and "Reset" verbatim (`AuthArt kind="mail"` / `"key"`,
  strength hint on New password, mismatch check before any request, both submit buttons disabled while busy).
  After this task no page imports `components/Field.tsx`: delete it. Keep `components/Card.tsx` (Dashboard still
  uses it).
- [ ] **Step 4:** `npx vitest run`, `npm run build`, `npm run e2e` (all specs) pass; screenshots of all five pages
  at 360 and 1440.
- [ ] **Step 5: Commit** `feat(auth): redesigned forgot and reset password pages`.
