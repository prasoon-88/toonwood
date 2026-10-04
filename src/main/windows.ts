import { app, BrowserWindow, desktopCapturer, screen, shell, type Rectangle } from 'electron'
import { join } from 'node:path'
import icon from '../../resources/icon.png?asset'
import type { Settings, UiState } from '../shared/types'
import { getSettings, saveSettings } from './store'

const NORMAL_SIZE = { width: 440, height: 720 }
const COMPACT_SIZE = { width: 380, height: 300 }
const MIN_SIZE = { width: 320, height: 220 }
const BUBBLE_SIZE = 56
export const RESIZE_STEP = 60
export const MOVE_STEP = 40

let win: BrowserWindow | null = null
let bubble: BrowserWindow | null = null
let ui: UiState = { compact: false, clickThrough: false }
let boundsBeforeCompact: Rectangle | null = null
let bubbleDragOrigin: { x: number; y: number } | null = null

const preload = (): string => join(__dirname, '../preload/index.js')

function loadPage(w: BrowserWindow, page: 'index' | 'bubble'): void {
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) w.loadURL(`${devUrl}/${page}.html`)
  else w.loadFile(join(__dirname, `../renderer/${page}.html`))
}

export function send(channel: string, payload?: unknown): void {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
}

export function toast(text: string): void {
  send('ui:toast', text)
}

export function getUiState(): UiState {
  return ui
}

function setUi(patch: Partial<UiState>): void {
  ui = { ...ui, ...patch }
  send('ui:state', ui)
}

export function applyWindowSettings(s: Settings): void {
  // Excludes windows from screen share/recording (SetWindowDisplayAffinity WDA_EXCLUDEFROMCAPTURE).
  for (const w of [win, bubble]) if (w && !w.isDestroyed()) w.setContentProtection(s.privateMode)
  if (win) {
    // Private mode also keeps the window off the taskbar; it is reachable from the tray / bubble instead.
    win.setSkipTaskbar(s.privateMode)
    win.setOpacity(Math.min(1, Math.max(0.3, s.opacity)))
  }
  syncBubble()
}

export function createMainWindow(): void {
  win = new BrowserWindow({
    ...NORMAL_SIZE,
    minWidth: MIN_SIZE.width,
    minHeight: MIN_SIZE.height,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    title: 'Call Copilot',
    icon,
    backgroundColor: '#14161a',
    webPreferences: { preload: preload(), sandbox: false, contextIsolation: true }
  })
  win.setAlwaysOnTop(true, 'floating')
  applyWindowSettings(getSettings())
  loadPage(win, 'index')

  // Links inside answers/messages open in the system browser; the app window itself never navigates away.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e) => e.preventDefault())

  for (const event of ['show', 'hide', 'minimize', 'restore'] as const) win.on(event as 'show', syncBubble)
  win.on('closed', () => {
    win = null
    app.quit()
  })
}

export function isWindowShown(): boolean {
  return Boolean(win && win.isVisible() && !win.isMinimized())
}

export function showWindow(focus = true): void {
  if (!win) return createMainWindow()
  if (win.isMinimized()) win.restore()
  if (focus) win.show()
  else win.showInactive()
}

export function toggleWindow(): void {
  if (isWindowShown()) win!.hide()
  else showWindow()
}

export function resizeBy(step: number): void {
  if (!win) return
  const b = win.getBounds()
  const area = screen.getDisplayMatching(b).workArea
  const width = Math.min(area.width, Math.max(MIN_SIZE.width, b.width + step))
  const height = Math.min(area.height, Math.max(MIN_SIZE.height, b.height + Math.round(step * 1.5)))
  win.setBounds({ ...b, width, height })
  toast(`Window ${width} × ${height}`)
}

/** Nudge the window; it may cross onto another monitor but never leaves the screens entirely. */
export function moveBy(dx: number, dy: number): void {
  if (!win) return
  const b = win.getBounds()
  const area = screen.getDisplayNearestPoint({ x: b.x + b.width / 2 + dx, y: b.y + b.height / 2 + dy }).workArea
  const x = Math.min(Math.max(b.x + dx, area.x - b.width + 80), area.x + area.width - 80)
  const y = Math.min(Math.max(b.y + dy, area.y), area.y + area.height - 40)
  win.setPosition(Math.round(x), Math.round(y))
}

const SHOT_MAX_WIDTH = 1920
/** Time for the compositor to repaint without our windows before the screen is grabbed. */
const SHOT_HIDE_MS = 150

/**
 * Screenshot of the display under the mouse as a JPEG data: URL. Our own windows are made fully
 * transparent for the shot (so they aren't in it), then the main window is shown so the answer is visible.
 */
export async function captureScreen(): Promise<string> {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const ours = [win, bubble].filter((w): w is BrowserWindow => Boolean(w && !w.isDestroyed() && w.isVisible()))
  ours.forEach((w) => w.setOpacity(0))
  try {
    if (ours.length) await new Promise((r) => setTimeout(r, SHOT_HIDE_MS))
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.round(display.size.width * display.scaleFactor),
        height: Math.round(display.size.height * display.scaleFactor)
      }
    })
    const source = sources.find((s) => s.display_id === String(display.id)) ?? sources[0]
    if (!source || source.thumbnail.isEmpty()) throw new Error('Could not capture the screen')
    let image = source.thumbnail
    if (image.getSize().width > SHOT_MAX_WIDTH) image = image.resize({ width: SHOT_MAX_WIDTH, quality: 'best' })
    return `data:image/jpeg;base64,${image.toJPEG(85).toString('base64')}`
  } finally {
    for (const w of ours) if (!w.isDestroyed()) w.setOpacity(w === win ? Math.min(1, Math.max(0.3, getSettings().opacity)) : 1)
    if (!isWindowShown()) showWindow(false)
  }
}

export function toggleCompact(): void {
  if (!win) return
  const compact = !ui.compact
  if (compact) {
    boundsBeforeCompact = win.getBounds()
    win.setBounds({ x: boundsBeforeCompact.x, y: boundsBeforeCompact.y, ...COMPACT_SIZE })
  } else {
    win.setBounds(boundsBeforeCompact ?? { ...win.getBounds(), ...NORMAL_SIZE })
  }
  setUi({ compact })
}

export function toggleClickThrough(): void {
  if (!win) return
  const clickThrough = !ui.clickThrough
  // forward: true keeps hover working so the window still feels alive, but clicks go to the app behind it.
  win.setIgnoreMouseEvents(clickThrough, { forward: true })
  setUi({ clickThrough })
  toast(clickThrough ? 'Click-through ON: clicks pass through the window' : 'Click-through OFF')
}

// ---- Floating logo bubble: visible while the main window is hidden or minimized; click to reopen. ----

function defaultBubblePosition(): { x: number; y: number } {
  const area = screen.getPrimaryDisplay().workArea
  return { x: area.x + area.width - BUBBLE_SIZE - 24, y: area.y + area.height - BUBBLE_SIZE - 24 }
}

function clampToScreen(pos: { x: number; y: number }): { x: number; y: number } {
  const area = screen.getDisplayNearestPoint(pos).workArea
  return {
    x: Math.min(Math.max(pos.x, area.x), area.x + area.width - BUBBLE_SIZE),
    y: Math.min(Math.max(pos.y, area.y), area.y + area.height - BUBBLE_SIZE)
  }
}

function createBubble(): BrowserWindow {
  const b = new BrowserWindow({
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    frame: false,
    transparent: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    show: false,
    webPreferences: { preload: preload(), sandbox: false, contextIsolation: true }
  })
  b.setAlwaysOnTop(true, 'screen-saver')
  b.setContentProtection(getSettings().privateMode)
  const pos = clampToScreen(getSettings().bubblePosition ?? defaultBubblePosition())
  b.setPosition(pos.x, pos.y)
  loadPage(b, 'bubble')
  b.on('closed', () => (bubble = null))
  return b
}

export function syncBubble(): void {
  if (!isWindowShown() && getSettings().showBubble) {
    bubble ??= createBubble()
    bubble.showInactive()
  } else {
    bubble?.hide()
  }
}

export function bubbleDragStart(): void {
  if (!bubble) return
  const [x, y] = bubble.getPosition()
  bubbleDragOrigin = { x, y }
}

export function bubbleDrag(dx: number, dy: number): void {
  if (!bubble || !bubbleDragOrigin) return
  bubble.setPosition(Math.round(bubbleDragOrigin.x + dx), Math.round(bubbleDragOrigin.y + dy))
}

export function bubbleDragEnd(): void {
  if (!bubble) return
  const [x, y] = bubble.getPosition()
  saveSettings({ bubblePosition: { x, y } })
  bubbleDragOrigin = null
}
