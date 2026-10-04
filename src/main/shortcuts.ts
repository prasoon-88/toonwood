import { globalShortcut } from 'electron'
import { SHORTCUT_ACTIONS, type ShortcutAction, type ShortcutMap } from '../shared/shortcuts'
import { FONT_SCALE, type Settings } from '../shared/types'
import { getSettings, saveSettings } from './store'
import {
  applyWindowSettings,
  isWindowShown,
  MOVE_STEP,
  moveBy,
  resizeBy,
  RESIZE_STEP,
  send,
  showWindow,
  toast,
  toggleClickThrough,
  toggleCompact,
  toggleWindow
} from './windows'

function toggleSetting(key: 'autoScroll' | 'privateMode', label: string): void {
  const next = saveSettings({ [key]: !getSettings()[key] } as Partial<Settings>)
  applyWindowSettings(next)
  send('settings:changed', next)
  toast(`${label} ${next[key] ? 'ON' : 'OFF'}`)
}

const OPACITY_STEP = 0.1
const MIN_OPACITY = 0.3

function adjustOpacity(delta: number): void {
  const current = getSettings().opacity
  const opacity = Math.round(Math.min(1, Math.max(MIN_OPACITY, current + delta)) * 100) / 100
  const next = saveSettings({ opacity })
  applyWindowSettings(next)
  send('settings:changed', next)
  toast(`Opacity ${Math.round(opacity * 100)}%`)
}

function adjustFontScale(direction: 1 | -1): void {
  const { min, max, step } = FONT_SCALE
  const fontScale = Math.round(Math.min(max, Math.max(min, getSettings().fontScale + direction * step)) * 10) / 10
  const next = saveSettings({ fontScale })
  send('settings:changed', next)
  toast(`Text size ${Math.round(fontScale * 100)}%`)
}

/** Actions the renderer performs (they need page state): forwarded as a 'shortcut' event. */
function inPage(action: ShortcutAction, reveal = false): () => void {
  return () => {
    if (reveal && !isWindowShown()) showWindow(false)
    send('shortcut', action)
  }
}

const HANDLERS: Record<ShortcutAction, () => void> = {
  toggleWindow,
  answerNow: inPage('answerNow', true),
  screenshotAnswer: inPage('screenshotAnswer'),
  toggleListening: inPage('toggleListening'),
  newChat: inPage('newChat'),
  copyAnswer: inPage('copyAnswer'),
  scrollUp: inPage('scrollUp'),
  scrollDown: inPage('scrollDown'),
  toggleAutoScroll: () => toggleSetting('autoScroll', 'Auto-scroll'),
  grow: () => resizeBy(RESIZE_STEP),
  shrink: () => resizeBy(-RESIZE_STEP),
  moveLeft: () => moveBy(-MOVE_STEP, 0),
  moveRight: () => moveBy(MOVE_STEP, 0),
  moveUp: () => moveBy(0, -MOVE_STEP),
  moveDown: () => moveBy(0, MOVE_STEP),
  fontUp: () => adjustFontScale(1),
  fontDown: () => adjustFontScale(-1),
  opacityDown: () => adjustOpacity(-OPACITY_STEP),
  opacityUp: () => adjustOpacity(OPACITY_STEP),
  toggleCompact,
  toggleClickThrough,
  togglePrivate: () => toggleSetting('privateMode', 'Private mode')
}

/** Run an action from a button in the UI (same code path as the keyboard shortcut). */
export function runAction(action: ShortcutAction): void {
  HANDLERS[action]?.()
}

let status: Partial<Record<ShortcutAction, boolean>> = {}

/** Registers all shortcuts; returns which ones failed (e.g. taken by another app). */
export function registerShortcuts(map: ShortcutMap = getSettings().shortcuts): Partial<Record<ShortcutAction, boolean>> {
  globalShortcut.unregisterAll()
  status = {}
  for (const { id } of SHORTCUT_ACTIONS) {
    const accelerator = map[id]
    if (!accelerator) continue
    try {
      status[id] = globalShortcut.register(accelerator, HANDLERS[id])
    } catch {
      status[id] = false
    }
  }
  return status
}

export function shortcutStatus(): Partial<Record<ShortcutAction, boolean>> {
  return status
}

/** While the user records a new shortcut in Settings, global shortcuts must not fire. */
export function pauseShortcuts(): void {
  globalShortcut.unregisterAll()
}
