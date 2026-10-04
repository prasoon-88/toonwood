# Call Copilot

Windows desktop assistant for live calls. It transcribes the call and, when someone asks a question, shows an
answer from **your Q&A presets** or **writes one with the AI provider you choose**. A QR **Room** lets people send
questions from their phones.

**Users only ever enter one thing: their own AI API key.** Transcription, preset matching and rooms are provided
by the Call Copilot backend ([`room-server/`](room-server/README.md)), which holds the service keys.

```
Desktop app ──(user's AI key)──────────────► OpenAI / Claude / Gemini / DeepSeek / Groq / OpenRouter / Ollama
     │
     └──(APP_KEY + device id)──► Backend ──► Deepgram (short-lived transcription tokens)
                                    │    └─► TypeSafe Jev (preset matching)
                                    └─ Socket.IO rooms ◄── phones (QR)
```

## Modes

| Mode | What happens when a question is detected |
|---|---|
| **Preset only** | Matches the question against your presets and shows the best answer + alternatives. |
| **AI only** | Streams an answer from your AI provider, using your resume / context. |
| **Hybrid** (default) | Uses a preset if it's a confident match, otherwise asks the AI with the closest presets as reference. |

## Building the product

1. **Backend**: deploy [`room-server/`](room-server/README.md) with `DEEPGRAM_API_KEY`, `TYPESAFE_API_KEY` and an `APP_KEY`.
2. **App config**: copy `.env.example` to `.env.production` and set `MAIN_VITE_API_URL` (your backend) and
   `MAIN_VITE_APP_KEY` (same as the backend's `APP_KEY`). These are baked into the build.
3. Build the installer:

```bash
npm install
npm run dist
```

For local development, run the backend (`cd room-server && npm start`, with a `.env`) and the app (`npm run dev`).
Without a `.env`, the app talks to `http://localhost:3030`.

## Rooms

Start a room on the **Room** tab and share the QR code / link. Guests chat from their phones, and every message
(on the phone and in the app) has a **Copy** button.

While a room is open, the Live session is shared to it as well (toggles on the Room tab):

- **Share transcript**: each finished transcript line, as "Call · Them" / "Call · Host".
- **Share answers**: each finished Live answer (preset or AI) as "Copilot", with the screenshot it is about.

Only what happens while the room is open is shared. Anyone with the room link can read it, so turn these off for
calls you don't want to share.

## For users

1. Install and open Call Copilot.
2. Add an AI API key when prompted (Settings → AI). It's encrypted with Windows DPAPI and only sent to that provider.
3. Optional: import presets (see `examples/presets.sample.json`), add your resume / context.

## Shortcuts

Global shortcuts (work while another app is focused). All of them can be changed in **Settings → Shortcuts**,
and every button shows its current shortcut.

| Shortcut | Action |
|---|---|
| `Ctrl+Alt+H` | Show / hide window (a floating logo appears while hidden; click it to reopen) |
| `Ctrl+Alt+Space` | Answer now |
| `Ctrl+Alt+S` | Screenshot + answer: captures the screen under the mouse (the app window is left out) and asks your AI about it |
| `Ctrl+Alt+L` | Start / stop listening |
| `Ctrl+Alt+N` | New chat (clear) |
| `Ctrl+Alt+C` | Copy answer |
| `Ctrl+Alt+PgUp` / `PgDn` | Scroll answer |
| `Ctrl+Alt+A` | Auto-scroll on / off |
| `Ctrl+Alt+=` / `Ctrl+Alt+-` | Bigger / smaller window |
| `Ctrl+Alt+←↑↓→` | Move the window (40 px steps). Plain `Ctrl+Arrow` also works while the app is focused. |
| `Ctrl+Alt+.` / `Ctrl+Alt+,` | Bigger / smaller chat text (80–180%) |
| `Ctrl+Alt+[` / `Ctrl+Alt+]` | More transparent / more solid (10% steps) |
| `Ctrl+Alt+M` | Compact mode (answer only) |
| `Ctrl+Alt+T` | Click-through mode |
| `Ctrl+Alt+P` | Private mode on / off |

## How it works

- Call audio (system loopback) → channel 1 ("Them"); optional mic → channel 0 ("You"). Streamed as 16 kHz PCM to
  Deepgram using a 60-second token from the backend.
- Finished speech goes to `src/main/assistant.ts`: the backend's `/api/classify` (Jev) decides if it's a complete
  question and ranks presets; if the backend is unreachable, offline matching takes over.
- Private mode uses `setContentProtection` so the window is excluded from screen capture. It does not hide from
  cameras and it is not meant to get around proctoring tools.
