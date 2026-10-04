import { app, safeStorage } from 'electron'
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PresetFile, SecretName, Settings } from '../shared/types'
import { DEFAULT_SHORTCUTS } from '../shared/shortcuts'

const DEFAULT_SETTINGS: Settings = {
  mode: 'hybrid',
  confidenceThreshold: 0.7,
  captureMic: false,
  listenTo: 'both',
  llmProvider: 'openai',
  llmModel: 'gpt-5-mini',
  ollamaUrl: 'http://localhost:11434',
  resume: '',
  jobDescription: '',
  systemPrompt: '',
  roomAutoAnswer: true,
  roomShareTranscript: true,
  roomShareAnswers: true,
  privateMode: true,
  opacity: 0.95,
  fontScale: 1,
  autoScroll: true,
  showBubble: true,
  bubblePosition: null,
  shortcuts: DEFAULT_SHORTCUTS
}

const SECRET_NAMES: SecretName[] = ['openai', 'anthropic', 'google', 'deepseek', 'groq', 'openrouter', 'deepgram', 'typesafe']
/** Settings from older versions, when users configured the services themselves. */
const LEGACY_SETTINGS = ['classifier', 'roomServerUrl']

function file(name: string): string {
  return join(app.getPath('userData'), name)
}

function readJson<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(file(name), 'utf8')) as T
  } catch {
    return fallback
  }
}

function writeJson(name: string, data: unknown): void {
  writeFileSync(file(name), JSON.stringify(data, null, 2))
}

export function getSettings(): Settings {
  const saved = readJson<Partial<Settings>>('settings.json', {})
  // Merge shortcuts per action so newly added actions get their defaults.
  return { ...DEFAULT_SETTINGS, ...saved, shortcuts: { ...DEFAULT_SHORTCUTS, ...saved.shortcuts } }
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch }
  writeJson('settings.json', next)
  return next
}

/**
 * Drop settings the app no longer uses. Keys saved by older versions stay in secrets.json
 * (a saved Deepgram key is used again as the user's own transcription key).
 */
export function migrateLegacyData(): void {
  const settings = readJson<Record<string, unknown>>('settings.json', {})
  if (LEGACY_SETTINGS.some((k) => k in settings)) {
    LEGACY_SETTINGS.forEach((k) => delete settings[k])
    writeJson('settings.json', settings)
  }
}

/** Random id for this install; the backend rate-limits per device. */
export function getDeviceId(): string {
  const stored = readJson<{ id?: string }>('device.json', {})
  if (stored.id) return stored.id
  const id = randomUUID()
  writeJson('device.json', { id })
  return id
}

// The user's keys are encrypted with Windows DPAPI via safeStorage and stay in the main process
// (except an own Deepgram key, which the renderer needs to open the transcription WebSocket).
export function getSecret(name: SecretName): string | undefined {
  const stored = readJson<Record<string, string>>('secrets.json', {})[name]
  if (!stored) return undefined
  return safeStorage.decryptString(Buffer.from(stored, 'base64'))
}

export function setSecret(name: SecretName, value: string): void {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('OS encryption is not available')
  const all = readJson<Record<string, string>>('secrets.json', {})
  if (value.trim()) all[name] = safeStorage.encryptString(value.trim()).toString('base64')
  else delete all[name]
  writeJson('secrets.json', all)
}

export function secretStatus(): Record<SecretName, boolean> {
  const all = readJson<Record<string, string>>('secrets.json', {})
  return Object.fromEntries(SECRET_NAMES.map((n) => [n, Boolean(all[n])])) as Record<SecretName, boolean>
}

export function getPresets(): PresetFile | null {
  return readJson<PresetFile | null>('presets.json', null)
}

export function savePresets(presets: PresetFile | null): void {
  writeJson('presets.json', presets)
}
