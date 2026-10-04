import { app, BrowserWindow, clipboard, desktopCapturer, dialog, globalShortcut, ipcMain, Menu, nativeImage, session, Tray } from 'electron'
import { readFileSync } from 'node:fs'
import icon from '../../resources/icon.png?asset'
import { LLM_PROVIDERS, PresetFileSchema, type AnswerRequest, type RoomPost, type SecretName, type Settings, type SttAuth } from '../shared/types'
import { formatShortcut, type ShortcutAction } from '../shared/shortcuts'
import { getPresets, getSecret, getSettings, migrateLegacyData, savePresets, saveSettings, secretStatus, setSecret } from './store'
import { decide } from './assistant'
import { getSttToken } from './backend'
import { jevTest } from './jev'
import { API_URL, APP_KEY } from './config'
import { streamAnswer, testLlm } from './llm'
import { getRoomState, onRoomState, sendRoomMessage, startRoom, stopRoom } from './room'
import { pauseShortcuts, registerShortcuts, runAction, shortcutStatus } from './shortcuts'
import {
  applyWindowSettings,
  bubbleDrag,
  bubbleDragEnd,
  bubbleDragStart,
  captureScreen,
  createMainWindow,
  getUiState,
  send,
  showWindow,
  toggleWindow
} from './windows'

async function testDeepgramKey(): Promise<void> {
  const key = getSecret('deepgram')
  if (!key) throw new Error('No Deepgram key saved')
  const res = await fetch('https://api.deepgram.com/v1/projects', {
    headers: { Authorization: `Token ${key}` },
    signal: AbortSignal.timeout(8000)
  })
  if (res.status === 401 || res.status === 403) throw new Error('Deepgram rejected this key')
  if (!res.ok) throw new Error(`Deepgram error (${res.status})`)
}

let tray: Tray | null = null
const activeAnswers = new Map<number, AbortController>()
let nextAnswerId = 1

function registerIpc(): void {
  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:save', (_e, patch: Partial<Settings>) => {
    const next = saveSettings(patch)
    applyWindowSettings(next)
    if (patch.shortcuts) {
      registerShortcuts(next.shortcuts)
      updateTrayMenu()
    }
    return next
  })

  ipcMain.handle('secrets:status', () => secretStatus())
  ipcMain.handle('secrets:set', (_e, name: SecretName, value: string) => {
    setSecret(name, value)
    return secretStatus()
  })
  ipcMain.handle('secrets:test', async (_e, target: 'ai' | 'deepgram' | 'typesafe' = 'ai') => {
    try {
      if (target === 'deepgram') await testDeepgramKey()
      else if (target === 'typesafe') await jevTest(getSecret('typesafe') ?? '')
      else await testLlm(getSettings())
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
  // Transcription uses the user's own Deepgram key when they saved one in Settings;
  // otherwise the product backend hands out a short-lived token.
  ipcMain.handle('stt:auth', async (): Promise<{ ok: boolean; auth?: SttAuth; error?: string }> => {
    const ownKey = getSecret('deepgram')
    if (ownKey) return { ok: true, auth: { scheme: 'token', value: ownKey } }
    try {
      return { ok: true, auth: { scheme: 'bearer', value: (await getSttToken()).token } }
    } catch (err) {
      const message = (err as Error).message
      return {
        ok: false,
        error: /not configured/i.test(message)
          ? 'Transcription service is not set up. Add your own Deepgram API key in Settings → Listening.'
          : message
      }
    }
  })

  ipcMain.handle('presets:get', () => getPresets())
  ipcMain.handle('presets:clear', () => savePresets(null))
  ipcMain.handle('presets:import', async (e) => {
    const parent = BrowserWindow.fromWebContents(e.sender)
    const options = {
      title: 'Import Q&A presets',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile' as const]
    }
    const pick = parent ? await dialog.showOpenDialog(parent, options) : await dialog.showOpenDialog(options)
    if (pick.canceled || !pick.filePaths[0]) return { ok: false }
    try {
      const parsed = PresetFileSchema.safeParse(JSON.parse(readFileSync(pick.filePaths[0], 'utf8')))
      if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n') }
      savePresets(parsed.data)
      return { ok: true, presets: parsed.data }
    } catch (err) {
      return { ok: false, error: `Invalid JSON: ${(err as Error).message}` }
    }
  })

  ipcMain.handle('assist:decide', (_e, line: string, context: string, force: boolean) => decide(line, context, force))

  ipcMain.handle('assist:answer', (e, req: AnswerRequest) => {
    const id = nextAnswerId++
    const controller = new AbortController()
    activeAnswers.set(id, controller)
    streamAnswer(getSettings(), req, (text) => e.sender.send('assist:delta', { id, text }), controller.signal)
      .then(() => e.sender.send('assist:done', { id }))
      .catch((err: Error) => e.sender.send('assist:done', { id, error: controller.signal.aborted ? undefined : err.message }))
      .finally(() => activeAnswers.delete(id))
    return id
  })
  ipcMain.handle('assist:cancel', (_e, id: number) => activeAnswers.get(id)?.abort())

  ipcMain.handle('meta:providers', () => LLM_PROVIDERS)

  onRoomState((state) => send('room:state', state))
  ipcMain.handle('room:state', () => getRoomState())
  ipcMain.handle('room:start', () => startRoom(API_URL, APP_KEY))
  ipcMain.handle('room:stop', (_e, close: boolean) => stopRoom(close))
  ipcMain.handle('room:send', (_e, post: RoomPost | string) => sendRoomMessage(post))

  ipcMain.handle('screen:capture', async () => {
    try {
      return { ok: true, image: await captureScreen() }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
  ipcMain.handle('clipboard:write', (_e, text: string) => clipboard.writeText(text))
  ipcMain.handle('clipboard:write-image', (_e, dataUrl: string) => clipboard.writeImage(nativeImage.createFromDataURL(dataUrl)))
  ipcMain.handle('ui:get', () => getUiState())
  ipcMain.handle('action:run', (_e, action: ShortcutAction) => runAction(action))
  ipcMain.handle('shortcuts:status', () => shortcutStatus())
  ipcMain.handle('shortcuts:pause', () => pauseShortcuts())
  ipcMain.handle('shortcuts:resume', () => registerShortcuts())

  ipcMain.on('bubble:click', () => showWindow())
  ipcMain.on('bubble:drag-start', () => bubbleDragStart())
  ipcMain.on('bubble:drag', (_e, dx: number, dy: number) => bubbleDrag(dx, dy))
  ipcMain.on('bubble:drag-end', () => bubbleDragEnd())
}

function updateTrayMenu(): void {
  if (!tray) return
  const keys = getSettings().shortcuts
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: `Show / hide\t${formatShortcut(keys.toggleWindow)}`, click: toggleWindow },
      { label: `Compact mode\t${formatShortcut(keys.toggleCompact)}`, click: () => runAction('toggleCompact') },
      { label: `Click-through\t${formatShortcut(keys.toggleClickThrough)}`, click: () => runAction('toggleClickThrough') },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])
  )
}

function createTray(): void {
  tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 16, height: 16 }))
  tray.setToolTip('Call Copilot')
  tray.on('click', toggleWindow)
  updateTrayMenu()
}

app.whenReady().then(() => {
  // getDisplayMedia() in the renderer -> capture system audio (loopback) without a picker.
  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    const [screen] = await desktopCapturer.getSources({ types: ['screen'] })
    callback({ video: screen, audio: 'loopback' })
  })

  migrateLegacyData()
  registerIpc()
  createMainWindow()
  createTray()
  registerShortcuts()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => app.quit())
