# Toonwide landing page: design

Date: 2026-10-05
Status: approved in chat (hero mockup + section outline)

## 1. Goal

Replace the `/` redirect with a polished marketing landing page in the visual style of cluely.com (reference
screenshots provided by the user), using Toonwide's own name, copy, colours and artwork. Nothing is copied from
Cluely: no logo, text, images or illustrations. All artwork is CSS/SVG.

Copy rule: Toonwide is marketed for real-time help, privacy and staying hidden from screen share. Never use
"undetectable", "cheat" or proctoring-evasion language.

## 2. Constraints

- React + MUI components; layout with the Bootstrap grid (`container`, `row`, `col-*`, grid-only CSS). Existing rule.
- The landing page is always light (it does not follow OS dark mode); the rest of the site keeps its current theme.
- Fonts self-hosted via npm: `@fontsource/instrument-serif` (400, 400 italic) for display headings,
  `@fontsource-variable/inter` for everything else. No Google Fonts CDN.
- No images or external assets. Responsive down to 360 px wide, no horizontal scroll.
- Accessible: one `h1`; section headings are `h2`; buttons/links have names; FAQ uses MUI Accordion; decorative
  artwork is `aria-hidden`; colour contrast AA for text.
- `prefers-reduced-motion`: no animations when set (the waveform and float effects are static).

## 3. Design tokens (`web/src/landing/tokens.ts`)

| Token | Value |
|---|---|
| ink | `#0f1115` (headings), gradient end `#5b6178` |
| body | `#5b6070` muted text, `#8a90a2` faint |
| primary | `#1f63e6`, light `#3f8cff`, glow `rgba(31,99,230,.45)` |
| sky gradient (hero) | `#3d8bf2 0%, #5aa7f5 38%, #9fcaf6 62%, #f6d3b4 86%, #f4b48d 100%` |
| dusk gradient (product frame) | `160deg, #f7b27c, #e48a76 45%, #9b7fd4` |
| soft panel | `linear-gradient(180deg, #c9d1e8, #e6e9f4)` |
| blue panel | `linear-gradient(180deg, #6d9bff, #4f86f7)` |
| glass (dark overlay) | `rgba(28,30,38,.86)`, border `rgba(255,255,255,.14)` |
| footer bg | `linear-gradient(180deg, #ffffff, #e3e6f1)` |
| radii | panel 32 px, card 20 px, button 12 px, chip 999 px |
| type | display serif 72/80 px desktop, 44 px mobile; section h2 sans 56 px (500, letter-spacing −1.5 px, ink→slate gradient text), 36 px mobile; body 18 px / 1.6 |

## 4. Page structure (top to bottom)

1. **NavBar** (over the hero, white text): logo (circle mark + "Toonwide"), anchor links "How it works" (`#how`),
   "Features" (`#features`), "FAQ" (`#faq`); right side "Log in" (`/login`) and a white "Get started" button
   (`/signup`). If `GET /api/auth/me` returns 200, the right side shows a single "Dashboard" button (`/dashboard`)
   instead. Collapses to logo + button on mobile (anchor links hidden below `md`).
2. **Hero** (sky gradient, soft abstract hills drawn with layered radial gradients/SVG at the bottom):
   - h1 (serif, white): "Real-time answers, right on your call"
   - thin white divider line
   - subtitle: "Toonwide listens to your call, reads your screen when you ask, and shows the answer the moment you need it."
   - primary GlowButton "Get started free" → `/signup`
   - caption: "60 free minutes · Windows"
   - **ProductShot**: dusk-gradient frame → dark window with traffic-light dots → two gradient "call tiles" → glass
     overlay panel with: header "AI · 12:41 left" + blue pill "What should I say?"; answer text
     "“I'd start with the trade-off: caching cuts latency, but we need a clear invalidation rule…”"; action row
     "Answer now · Screenshot · Copy" (MUI icons). Above the window a small dark control pill: logo mark, "Hide",
     stop square.
3. **How it helps** (`#how`), h2 "How Toonwide helps during a call", two cards (`col-lg-6`):
   - Blue card: title "Toonwide **listens** to the conversation" (word "listens" in a frosted pill with a mic
     icon); text "It follows the call in real time, so it has the context when you need help."; big "00:10" timer
     with a red dot + "Listening"; a static waveform (SVG bars); a faded glass input "Ask about your call…".
   - Light card: title "Ask with **one shortcut**"; text "Press Ctrl + Alt + Space and Toonwide answers the
     latest question on the spot."; dark glass panel with "Answer" blue pill, label "Latest question", answer text
     "Toonwide hears the question, finds the context and writes a short answer you can say out loud.", key caps
     `Ctrl` `Alt` `Space`.
4. **Answers from your screen** (centered h2 "Answers from your screen", subtitle "Press Ctrl + Alt + S on a
   question, a task or code. Toonwide reads it and answers directly."), wide soft panel containing a white window:
   left column "Two Sum, find indices that add up to a target" problem card; right column a dark code block
   (TypeScript `twoSum` with a Map, ~8 lines) and a "Ctrl + Alt + S" badge.
5. **Features** (`#features`), h2 "Built for real calls", subtitle "Private by default, shareable when you want.",
   three cards (`col-lg-4`), each a soft panel with a small illustration then a caption:
   - "**Hidden from screen share.** Private mode keeps Toonwide out of shared screens and recordings." Illustration:
     split frame "Visible to you" (green outline) | "Hidden from others" (blurred).
   - "**Rooms for your team.** Share a QR code and teammates can follow answers and send questions from their phone."
     Illustration: QR-like grid card + two chat bubbles.
   - "**Your context, your answers.** Add your resume or notes and answers sound like you." Illustration: chips
     "Resume", "Role", "Notes" flowing into an answer card.
   - Below: small caps label "WORKS ALONGSIDE" and plain text items "Zoom · Microsoft Teams · Google Meet · Webex ·
     Slack" (text only, no third-party logos).
6. **Stats**: left a soft panel with a white "transcript" card (Them/You lines with times); right three rows
   separated by dividers:
   - "60 min" | "Free to start" | "Every new account gets 60 free minutes, valid for 7 days."
   - "0 bots" | "Nothing joins your meeting" | "Toonwide runs on your PC. No bot, no extra guest on the list."
   - "1 shortcut" | "Answers from your screen" | "Ctrl + Alt + S turns whatever is on screen into an answer."
7. **FAQ** (`#faq`), h2 "Frequently asked questions", MUI Accordion (no outer border, thin dividers, chevron):
   - What is Toonwide? → "A Windows app that listens to your calls and gives you real-time answers, notes from your screen, and a shareable room for your team."
   - Is Toonwide free? → "Yes, to start. Every new account gets 60 free minutes, valid for 7 days. Larger minute packs are coming soon."
   - How do sessions work? → "Log in on the website and click Start session. The app opens and works for up to 60 minutes, and only the minutes you use are counted."
   - Does Toonwide join my meeting? → "No. It runs on your PC and listens to your audio. Nothing is added to the meeting."
   - What happens to my data? → "Your chat history is saved to your account for 90 days so you can review it, and you can turn saving off or delete it at any time."
   - Which platforms are supported? → "Windows today. It works alongside Zoom, Microsoft Teams, Google Meet, Webex and other call apps."
8. **Final CTA**: on the footer gradient, h2-sized line "AI that helps during the call, not after." and a
   second line in muted blue "Try Toonwide on your next call."; dark glossy button "Get started free" → `/signup`;
   decorative floating 3D key caps "Ctrl" and "S" (CSS, aria-hidden).
9. **Footer**: logo; columns "Product" (How it works `#how`, Features `#features`, FAQ `#faq`) and "Account"
   (Log in `/login`, Sign up `/signup`); bottom row "© 2026 Toonwide. All rights reserved." (year from
   `new Date().getFullYear()`).
10. **Floating CTA**: after the hero scrolls out of view (IntersectionObserver), a fixed top-right GlowButton
    "Get started" (`/signup`) fades in; hidden when the hero is visible.

## 5. Components (`web/src/landing/`)

| File | Responsibility |
|---|---|
| `tokens.ts` | colours, gradients, radii, font stacks (section 3) |
| `theme.ts` | `landingTheme`: MUI light theme using the tokens and fonts |
| `GlowButton.tsx` | primary (blue glow) and `dark` (glossy black) variants; renders a router `Link` when given `to` |
| `SectionHeading.tsx` | h2 with ink→slate gradient text, optional subtitle, `align` |
| `SoftPanel.tsx` | rounded 32 px gradient panel (`variant: 'soft' | 'blue'`) |
| `Logo.tsx` | circle mark + "Toonwide" wordmark (`color` prop) |
| `KeyCap.tsx` | keyboard key cap (flat and 3D float variants) |
| `NavBar.tsx`, `Hero.tsx`, `ProductShot.tsx`, `HowItHelps.tsx`, `ScreenAnswers.tsx`, `Features.tsx`, `Stats.tsx`, `Faq.tsx`, `FinalCta.tsx`, `Footer.tsx`, `FloatingCta.tsx` | one section each |
| `LandingPage.tsx` | composes the sections inside `ThemeProvider theme={landingTheme}` |

`App.tsx`: route `/` renders `LandingPage` (no redirect). Backend already serves `/`.

## 6. Testing

- Vitest component tests (`web/src/landing/*.test.tsx`): the page renders one h1 with the hero text; "Get started
  free" links to `/signup`; nav shows "Log in" + "Get started" when `/api/auth/me` is 401 and "Dashboard" when 200;
  FAQ expands an answer on click; section anchors `how`, `features`, `faq` exist; no "undetectable" text anywhere.
- Playwright: add `web/e2e/landing.spec.ts`: `/` shows the h1, clicking "Get started free" reaches the sign-up
  page; at 375 px width the page has no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`).
- Existing tests keep passing.
