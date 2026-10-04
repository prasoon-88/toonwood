import { z } from 'zod'
import type { ShortcutMap } from './shortcuts'

export type Mode = 'preset' | 'ai' | 'hybrid'
/** Which matcher ranked the presets: the backend (Jev) or the offline fallback. */
export type Classifier = 'jev' | 'local'
export type LlmProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'groq' | 'openrouter' | 'ollama'
/**
 * Keys a user can enter: their AI provider key, plus optional own Deepgram (transcription) and
 * TypeSafe (preset matching) keys. Without those, the Call Copilot backend provides the service.
 */
export type SecretName = Exclude<LlmProvider, 'ollama'> | 'deepgram' | 'typesafe'

/** How the renderer authenticates the transcription WebSocket. */
export interface SttAuth {
  /** 'token' = the user's own Deepgram key; 'bearer' = short-lived token from the Call Copilot backend. */
  scheme: 'token' | 'bearer'
  value: string
}

export const LLM_PROVIDERS: { id: LlmProvider; label: string; defaultModel: string }[] = [
  { id: 'openai', label: 'OpenAI', defaultModel: 'gpt-5-mini' },
  { id: 'anthropic', label: 'Anthropic (Claude)', defaultModel: 'claude-haiku-4-5' },
  { id: 'google', label: 'Google Gemini', defaultModel: 'gemini-2.5-flash' },
  { id: 'deepseek', label: 'DeepSeek', defaultModel: 'deepseek-v4-flash' },
  { id: 'groq', label: 'Groq', defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'openrouter', label: 'OpenRouter', defaultModel: 'openai/gpt-5-mini' },
  { id: 'ollama', label: 'Ollama (local, no key)', defaultModel: 'llama3.1' }
]

export interface Settings {
  mode: Mode
  /** Minimum preset match confidence (0-1) before a preset answer is shown. */
  confidenceThreshold: number
  /** Record the user's microphone too (gives the AI your side of the conversation). Off = call audio only. */
  captureMic: boolean
  /** Whose speech can trigger an answer. 'both' also covers the other person's voice leaking into the mic. */
  listenTo: 'them' | 'both'
  llmProvider: LlmProvider
  llmModel: string
  ollamaUrl: string
  resume: string
  jobDescription: string
  systemPrompt: string
  /** Answer guest messages in the room automatically when they look like questions. */
  roomAutoAnswer: boolean
  /** Post the Live transcript (both sides of the call) to the open room. */
  roomShareTranscript: boolean
  /** Post Live answers (and the screenshots they are about) to the open room. */
  roomShareAnswers: boolean
  /** Hide the window from screen share / screen capture. */
  privateMode: boolean
  opacity: number
  /** Text size of answers, transcript and room messages (1 = 100%). */
  fontScale: number
  /** Keep the transcript / chat / streaming answer scrolled to the newest text. */
  autoScroll: boolean
  /** Show a floating logo bubble while the window is hidden or minimized. */
  showBubble: boolean
  bubblePosition: { x: number; y: number } | null
  shortcuts: ShortcutMap
}

export const FONT_SCALE = { min: 0.8, max: 1.8, step: 0.1 }

/** Transient window state that isn't saved. */
export interface UiState {
  compact: boolean
  clickThrough: boolean
}

export const PresetSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  variants: z.array(z.string()).optional(),
  answer: z.string().min(1),
  tags: z.array(z.string()).optional()
})

export const PresetFileSchema = z.object({
  name: z.string().default('My presets'),
  items: z.array(PresetSchema).min(1)
})

export type Preset = z.infer<typeof PresetSchema>
export type PresetFile = z.infer<typeof PresetFileSchema>

export interface ScoredPreset {
  preset: Preset
  score: number
}

/** What the assistant decided to do with a line the other person said. */
export type Decision =
  | { kind: 'skip' }
  | { kind: 'preset'; best: ScoredPreset; alternatives: ScoredPreset[]; via: Classifier; warning?: string }
  | { kind: 'nomatch'; alternatives: ScoredPreset[]; via: Classifier; warning?: string }
  | { kind: 'ai'; references: Preset[]; warning?: string }

export interface AnswerRequest {
  question: string
  transcript: string
  references: Preset[]
  /** Screenshot of the user's screen as a JPEG data: URL; the AI answers what it shows. */
  image?: string
}

export interface AnswerDelta {
  id: number
  text: string
}

export interface RoomMessage {
  id: number
  name: string
  text: string
  at: number
  host: boolean
  /** Picture posted by the host (JPEG data: URL), e.g. a screenshot from the Live tab. */
  image?: string
}

/** A message the host posts to the room; `name` defaults to "Host". */
export interface RoomPost {
  text: string
  name?: string
  image?: string
}

export interface RoomState {
  status: 'idle' | 'connecting' | 'open' | 'reconnecting' | 'error'
  roomId?: string
  joinUrl?: string
  /** QR code of joinUrl as a data: URL. */
  qr?: string
  guests: string[]
  messages: RoomMessage[]
  error?: string
}

export interface AnswerDone {
  id: number
  error?: string
}
