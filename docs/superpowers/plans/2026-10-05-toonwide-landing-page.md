# Toonwide Landing Page: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A polished, Cluely-style marketing landing page at `/` for Toonwide.

**Architecture:** New `web/src/landing/` module: design tokens + a light MUI theme, small shared components
(GlowButton, SectionHeading, SoftPanel, Logo, KeyCap), one component per page section, composed by
`LandingPage.tsx`. `App.tsx` renders it at `/`. All artwork is CSS/SVG.

**Tech Stack:** React 19, MUI 9 (`sx` only: MUI 9 removed system props), Bootstrap 5 grid-only CSS, react-router 7,
@fontsource/instrument-serif, @fontsource-variable/inter, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-05-toonwide-landing-page-design.md`. **The spec is the source for every
piece of copy, every colour and every section's content: use its text verbatim.**

## Global Constraints

- MUI components for UI; Bootstrap grid classes (`container`, `row`, `col-*`, `g-*`) for layout. MUI 9: style with
  `sx`, never system props like `mt=` or `fontWeight=`.
- Landing page always light (`landingTheme`), independent of OS dark mode.
- Fonts from npm (`@fontsource/instrument-serif`, `@fontsource-variable/inter`), no CDN. No images, no external assets.
- Copy verbatim from spec section 4; never the words "undetectable", "cheat" or proctoring evasion.
- Responsive to 360 px with no horizontal scroll; decorative art `aria-hidden`; one `h1`; section headings `h2`.
- `prefers-reduced-motion`: no animation.
- Work in `web/`. Tests: `npx vitest run` (component), `npm run build` (tsc + vite), `npm run e2e` (Playwright).
- Visual quality bar: match the reference style (generous whitespace, large type, soft gradients, glass panels,
  subtle shadows). After each section task, look at the page in a browser (`npm run build` then run the backend,
  or `npm run dev` with the backend on :3030) and fix anything that looks off before committing.

---

### Task 1: Design foundation

**Files:**
- Create: `web/src/landing/tokens.ts`, `theme.ts`, `GlowButton.tsx`, `SectionHeading.tsx`, `SoftPanel.tsx`, `Logo.tsx`, `KeyCap.tsx`, `LandingPage.tsx`, `web/src/landing/foundation.test.tsx`
- Modify: `web/src/App.tsx`, `web/package.json` (fonts)

**Interfaces (produced):**
- `tokens` object (spec §3 values) and `fonts = { display: "'Instrument Serif', Georgia, serif", sans: "'Inter Variable', system-ui, sans-serif" }`
- `landingTheme` (MUI light theme: primary `#1f63e6`, typography fontFamily `fonts.sans`, button textTransform none, shape borderRadius 12)
- `GlowButton({ to?, href?, variant?: 'primary' | 'dark' | 'light', size?: 'md' | 'lg', children })`: renders
  `Button` with `component={RouterLink}` when `to` is given
- `SectionHeading({ id?, title, subtitle?, align?: 'left' | 'center' })`: renders `<h2>` (`Typography variant="h2"
  component="h2"`) with gradient text `linear-gradient(90deg, #0f1115 55%, #5b6178)` and `WebkitBackgroundClip: text`
- `SoftPanel({ variant?: 'soft' | 'blue', sx?, children })`: radius 32, padding responsive
- `Logo({ color?: string })`: circle mark (SVG, aria-hidden) + "Toonwide" text
- `KeyCap({ children, variant?: 'flat' | 'float' })`
- `LandingPage()`: `ThemeProvider theme={landingTheme}` + `CssBaseline`, renders sections (empty placeholders
  `<main />` for now) and is mounted at `/`

- [ ] **Step 1: Install fonts**

```bash
cd web
npm install @fontsource/instrument-serif @fontsource-variable/inter
```

- [ ] **Step 2: Write the failing test**

Create `web/src/landing/foundation.test.tsx`:

```tsx
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { GlowButton } from './GlowButton'
import { SectionHeading } from './SectionHeading'
import { Logo } from './Logo'
import { App } from '../App'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('GlowButton with `to` is a link', () => {
  render(<MemoryRouter><GlowButton to="/signup">Get started free</GlowButton></MemoryRouter>)
  expect(screen.getByRole('link', { name: 'Get started free' }).getAttribute('href')).toBe('/signup')
})

test('SectionHeading renders an h2 with an id and subtitle', () => {
  render(<SectionHeading id="faq" title="Frequently asked questions" subtitle="Answers" />)
  const h2 = screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' })
  expect(h2.closest('[id="faq"]')).toBeTruthy()
  expect(screen.getByText('Answers')).toBeTruthy()
})

test('Logo shows the Toonwide name', () => {
  render(<Logo />)
  expect(screen.getByText('Toonwide')).toBeTruthy()
})

test('/ renders the landing page instead of redirecting', () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  window.history.pushState({}, '', '/')
  render(<App />)
  expect(window.location.pathname).toBe('/')
  expect(document.querySelector('[data-page="landing"]')).toBeTruthy()
})
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run src/landing/foundation.test.tsx`
Expected: FAIL (`Failed to resolve import "./GlowButton"`).

- [ ] **Step 4: Implement**

`web/src/landing/tokens.ts` (values from spec §3):

```ts
export const tokens = {
  ink: '#0f1115',
  inkEnd: '#5b6178',
  muted: '#5b6070',
  faint: '#8a90a2',
  primary: '#1f63e6',
  primaryLight: '#3f8cff',
  glow: 'rgba(31,99,230,.45)',
  sky: 'linear-gradient(180deg, #3d8bf2 0%, #5aa7f5 38%, #9fcaf6 62%, #f6d3b4 86%, #f4b48d 100%)',
  dusk: 'linear-gradient(160deg, #f7b27c, #e48a76 45%, #9b7fd4)',
  soft: 'linear-gradient(180deg, #c9d1e8, #e6e9f4)',
  blue: 'linear-gradient(180deg, #6d9bff, #4f86f7)',
  glass: 'rgba(28,30,38,.86)',
  glassBorder: 'rgba(255,255,255,.14)',
  footer: 'linear-gradient(180deg, #ffffff, #e3e6f1)',
  radius: { panel: 32, card: 20, button: 12, chip: 999 }
} as const

export const fonts = {
  display: "'Instrument Serif', Georgia, serif",
  sans: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
} as const
```

`web/src/landing/theme.ts`:

```ts
import { createTheme } from '@mui/material'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/inter'
import { fonts, tokens } from './tokens'

/** Always-light theme for the marketing page. */
export const landingTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: tokens.primary },
    text: { primary: tokens.ink, secondary: tokens.muted },
    background: { default: '#ffffff' }
  },
  shape: { borderRadius: tokens.radius.button },
  typography: {
    fontFamily: fonts.sans,
    h2: { fontWeight: 500, letterSpacing: '-1.5px', lineHeight: 1.08, fontSize: 'clamp(36px, 5vw, 56px)' },
    body1: { fontSize: 18, lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600 }
  }
})
```

Build `GlowButton`, `SectionHeading`, `SoftPanel`, `Logo`, `KeyCap` to the interfaces above:
- `GlowButton` primary: background `linear-gradient(180deg, tokens.primaryLight, tokens.primary)`, white text,
  `boxShadow: 0 10px 30px tokens.glow, inset 0 1px 0 rgba(255,255,255,.35)`, radius 12, padding `12px 24px`
  (lg: `14px 28px`, fontSize 17); hover lifts 1 px and deepens the shadow (no transform when
  `prefers-reduced-motion`). `dark`: `linear-gradient(180deg, #2a2d34, #0f1115)` with a light inner border
  highlight. `light`: white background, primary-coloured text (used in the nav).
- `SoftPanel`: `background: tokens.soft` (or `tokens.blue`), `borderRadius: 32`, `p: { xs: 3, md: 5 }`, `overflow: hidden`, `position: relative`.
- `KeyCap` flat: 40 px tall, white, 1 px `#dfe2ea` border, radius 10, shadow `0 2px 0 #cfd3de`, Inter 14 px 600.
  `float`: 120 px rounded square, white→`#eef1f8` gradient, soft large shadow, slight rotation, label 28 px.
- `LandingPage`: `<ThemeProvider theme={landingTheme}><CssBaseline /><div data-page="landing">…sections…</div></ThemeProvider>`.

`web/src/App.tsx`: replace the `/` route's `<Navigate to="/dashboard" replace />` with `<LandingPage />`
(import from `./landing/LandingPage`); keep the other routes.

- [ ] **Step 5: Run tests and build**

Run: `npx vitest run` → all pass (existing Signup/Verify tests too). `npm run build` → clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(landing): design tokens, light theme, fonts and shared components; / renders the landing page"
```

---

### Task 2: NavBar, Hero and product shot

**Files:** Create `web/src/landing/NavBar.tsx`, `Hero.tsx`, `ProductShot.tsx`, `web/src/landing/hero.test.tsx`; modify `LandingPage.tsx`.

**Interfaces:** consumes Task 1 components. `NavBar` renders a `<nav>` element (role navigation; the only one on the page) and fetches `GET /api/auth/me` once (`credentials: 'same-origin'`);
`status 200` → logged-in variant.

- [ ] **Step 1: Write the failing test** `web/src/landing/hero.test.tsx`:

```tsx
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderPage(meStatus: number) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ user: { email: 'a@b.c' } }), { status: meStatus })))
  return render(<MemoryRouter><LandingPage /></MemoryRouter>)
}

test('hero has the single h1 and the sign-up call to action', async () => {
  renderPage(401)
  const h1s = screen.getAllByRole('heading', { level: 1 })
  expect(h1s).toHaveLength(1)
  expect(h1s[0].textContent).toBe('Real-time answers, right on your call')
  // The final CTA (Task 5) repeats this button, so take the first one (the hero's).
  expect(screen.getAllByRole('link', { name: 'Get started free' })[0].getAttribute('href')).toBe('/signup')
  expect(screen.getByText('60 free minutes · Windows')).toBeTruthy()
})

test('logged-out nav shows Log in and Get started', async () => {
  renderPage(401)
  const nav = screen.getByRole('navigation')
  expect((await within(nav).findByRole('link', { name: 'Log in' })).getAttribute('href')).toBe('/login')
  expect(within(nav).getByRole('link', { name: 'Get started' }).getAttribute('href')).toBe('/signup')
})

test('logged-in nav shows Dashboard instead', async () => {
  renderPage(200)
  const nav = screen.getByRole('navigation')
  expect((await within(nav).findByRole('link', { name: 'Dashboard' })).getAttribute('href')).toBe('/dashboard')
  expect(within(nav).queryByRole('link', { name: 'Log in' })).toBeNull()
})

test('the product shot is decorative and shows the answer panel', () => {
  renderPage(401)
  expect(screen.getByText('What should I say?')).toBeTruthy()
  expect(document.querySelector('[data-testid="product-shot"]')?.getAttribute('aria-hidden')).toBe('true')
})
```

- [ ] **Step 2: Run to see it fail.** `npx vitest run src/landing/hero.test.tsx` → FAIL (no h1).

- [ ] **Step 3: Implement** per spec §4 items 1–2 (exact copy). Requirements:
  - Hero section background `tokens.sky`, full width, white text; NavBar absolutely positioned over it
    (`container`, flex, 72 px tall). Nav anchors hidden below `md` (`display: { xs: 'none', md: 'flex' }`).
  - h1 `Typography component="h1"` with `fontFamily: fonts.display`, `fontSize: { xs: 44, md: 80 }`,
    `lineHeight: 1.0`, `letterSpacing: '-1px'`, centred; divider 240 px × 1 px `rgba(255,255,255,.45)`.
  - Hills: two or three absolutely positioned SVG/radial-gradient layers at the hero bottom (white→peach haze),
    `aria-hidden`.
  - ProductShot (`data-testid="product-shot"`, `aria-hidden="true"`): max-width 1120 px centred,
    `tokens.dusk` frame with radius `24px 24px 0 0`, inner dark window (`#14161c`) with three dots, two call
    tiles (`linear-gradient(135deg,#2b3a55,#4b5f86)` and `(135deg,#4a3b5c,#7a6597)`), glass overlay panel
    (`tokens.glass`, `backdropFilter: blur(18px)`, border `tokens.glassBorder`, radius 16) with the spec's header,
    pill, answer text and action row (MUI icons `AutoAwesome`, `CropFree`, `ContentCopy` from
    `@mui/icons-material`, install it), and the dark control pill above the window. The frame overlaps the
    hero bottom (hero padding-bottom 0; the shot sits at the end of the hero).
- [ ] **Step 4:** `npx vitest run` and `npm run build` pass. Look at it in a browser at 1440 px and 375 px.
- [ ] **Step 5: Commit** `feat(landing): nav bar, hero and product shot`.

---

### Task 3: How it helps + Answers from your screen

**Files:** Create `HowItHelps.tsx`, `ScreenAnswers.tsx`, `web/src/landing/sections.test.tsx`; modify `LandingPage.tsx`.

- [ ] **Step 1: Write the failing test** `web/src/landing/sections.test.tsx`:

```tsx
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderPage() {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  return render(<MemoryRouter><LandingPage /></MemoryRouter>)
}

test('how-it-helps section has its anchor, heading and two cards', () => {
  renderPage()
  const h2 = screen.getByRole('heading', { level: 2, name: 'How Toonwide helps during a call' })
  expect(h2.closest('#how')).toBeTruthy()
  expect(screen.getByText('00:10')).toBeTruthy()
  expect(screen.getAllByText('Space').length).toBeGreaterThan(0)
})

test('screen answers section explains Ctrl + Alt + S', () => {
  renderPage()
  expect(screen.getByRole('heading', { level: 2, name: 'Answers from your screen' })).toBeTruthy()
  expect(screen.getByText(/Two Sum/)).toBeTruthy()
})
```

- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3: Implement** spec §4 items 3–4 verbatim (headings via `SectionHeading`; card titles as `h3`
  Typography 28–32 px weight 500). Blue card uses `SoftPanel variant="blue"` with white text; the "listens" word in
  a frosted pill (`rgba(255,255,255,.22)`, radius 999, MUI `GraphicEq` icon); timer 64 px weight 600; SVG waveform
  (≈40 rounded bars, heights tapering to dots, `aria-hidden`); faded glass input. Light card: `SoftPanel` soft
  with a white-to-`#eef0f6` inner, dark glass panel (`tokens.glass`), "Answer" blue pill, `KeyCap`s `Ctrl` `Alt`
  `Space`. Screen-answers: centred heading + subtitle, wide `SoftPanel` with a white rounded window
  (`row`: `col-md-5` problem card with title "Two Sum, find indices that add up to a target", a short example
  `nums = [2, 7, 11, 15], target = 9 → [0, 1]`; `col-md-7` dark code block, monospace 14 px, the TypeScript below,
  plus a floating badge "Ctrl + Alt + S"). Code text:

```ts
function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>()
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i]
    if (seen.has(need)) return [seen.get(need)!, i]
    seen.set(nums[i], i)
  }
  return []
}
```

  Sections get vertical padding `py: { xs: 10, md: 16 }` inside `container`.
- [ ] **Step 4:** tests + build pass; check visually.
- [ ] **Step 5: Commit** `feat(landing): how-it-helps cards and screen answers section`.

---

### Task 4: Features, Stats and FAQ

**Files:** Create `Features.tsx`, `Stats.tsx`, `Faq.tsx`, `web/src/landing/info.test.tsx`; modify `LandingPage.tsx`.

- [ ] **Step 1: Write the failing test** `web/src/landing/info.test.tsx`:

```tsx
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderPage() {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  return render(<MemoryRouter><LandingPage /></MemoryRouter>)
}

test('features section has its anchor and three features', () => {
  renderPage()
  expect(screen.getByRole('heading', { level: 2, name: 'Built for real calls' }).closest('#features')).toBeTruthy()
  expect(screen.getByText('Hidden from screen share.')).toBeTruthy()
  expect(screen.getByText('Rooms for your team.')).toBeTruthy()
  expect(screen.getByText('Your context, your answers.')).toBeTruthy()
})

test('stats show only true numbers', () => {
  renderPage()
  for (const value of ['60 min', '0 bots', '1 shortcut']) expect(screen.getByText(value)).toBeTruthy()
})

test('FAQ answers expand on click', () => {
  renderPage()
  expect(screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' }).closest('#faq')).toBeTruthy()
  const question = screen.getByRole('button', { name: 'Is Toonwide free?' })
  expect(question.getAttribute('aria-expanded')).toBe('false')
  fireEvent.click(question)
  expect(question.getAttribute('aria-expanded')).toBe('true')
  expect(screen.getByText(/Every new account gets 60 free minutes, valid for 7 days\. Larger minute packs/)).toBeTruthy()
})
```

- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3: Implement** spec §4 items 5–7 verbatim. Feature captions: bold lead (`<strong>`, the exact text
  e.g. "Hidden from screen share.") followed by the muted sentence, 20 px. Illustrations inside `SoftPanel`
  (aspect ~1:1, white inner cards, aria-hidden). "WORKS ALONGSIDE" label letter-spacing 3 px, 13 px, faint;
  names as plain text separated by generous gaps. Stats: `row` with `col-lg-5` transcript panel and `col-lg-7`
  rows; value 64 px weight 400, title 32 px, text muted 18 px; rows separated by 1 px `#e6e8ee`. FAQ: MUI
  `Accordion` with `disableGutters`, `elevation={0}`, no `::before` line, bottom border 1 px `#e6e8ee`, summary
  22 px weight 500, `ExpandMore` icon; questions are the accordion summaries (button role from MUI).
- [ ] **Step 4:** tests + build pass; check visually.
- [ ] **Step 5: Commit** `feat(landing): features, stats and FAQ`.

---

### Task 5: Final CTA, footer, floating CTA, e2e

**Files:** Create `FinalCta.tsx`, `Footer.tsx`, `FloatingCta.tsx`, `web/src/landing/footer.test.tsx`, `web/e2e/landing.spec.ts`; modify `LandingPage.tsx`.

- [ ] **Step 1: Write the failing tests**

`web/src/landing/footer.test.tsx`:

```tsx
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('final CTA, footer links and copyright', () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  render(<MemoryRouter><LandingPage /></MemoryRouter>)
  expect(screen.getByText('AI that helps during the call, not after.')).toBeTruthy()
  const footer = screen.getByRole('contentinfo')
  expect(within(footer).getByRole('link', { name: 'Sign up' }).getAttribute('href')).toBe('/signup')
  expect(within(footer).getByRole('link', { name: 'FAQ' }).getAttribute('href')).toBe('#faq')
  expect(within(footer).getByText(`© ${new Date().getFullYear()} Toonwide. All rights reserved.`)).toBeTruthy()
})

test('the page never uses evasion language', () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  render(<MemoryRouter><LandingPage /></MemoryRouter>)
  expect(document.body.textContent).not.toMatch(/undetectable|cheat/i)
})
```

`web/e2e/landing.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('landing page leads to sign-up', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Real-time answers, right on your call' })).toBeVisible()
  await page.getByRole('link', { name: 'Get started free' }).first().click()
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
})

test('no horizontal scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
```

- [ ] **Step 2:** run vitest → FAIL.
- [ ] **Step 3: Implement** spec §4 items 8–10. Final CTA + footer share `tokens.footer` background. CTA line
  32–40 px weight 500 ink, second line muted blue `#6b7fae`; `GlowButton variant="dark" size="lg"`; two `KeyCap
  variant="float"` ("Ctrl", "S") absolutely positioned right (hidden below `md`), aria-hidden. Footer
  `component="footer"` (role contentinfo): `Logo` left, columns right (`col-6 col-md-3`), divider, copyright row.
  FloatingCta: `position: fixed`, top 16 right 16, z-index above content, `GlowButton` "Get started" → `/signup`;
  shown only when the hero sentinel (an element at the hero's bottom with `id="hero-end"`) is not intersecting
  (IntersectionObserver; if unavailable, e.g. jsdom, render nothing); fade via opacity transition (none for
  reduced motion). Ensure no element causes horizontal overflow at 375 px (`overflow-x: clip` on the page root is
  allowed).
- [ ] **Step 4:** `npx vitest run`, `npm run build`, `npm run e2e` (both e2e files) pass. Final visual check at
  1440 px and 375 px.
- [ ] **Step 5: Commit** `feat(landing): final call to action, footer, floating CTA and e2e`.
