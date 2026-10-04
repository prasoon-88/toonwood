import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  AnswerDelta,
  AnswerDone,
  AnswerRequest,
  Decision,
  LLM_PROVIDERS,
  PresetFile,
  RoomPost,
  RoomState,
  SecretName,
  Settings,
  SttAuth,
  UiState
} from '../shared/types'
import type { ShortcutAction } from '../shared/shortcuts'

function listen<T>(channel: string, cb: (payload: T) => void): () => void {
  const handler = (_e: IpcRendererEvent, payload: T): void => cb(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.off(channel, handler)
}

const api = {
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (patch: Partial<Settings>): Promise<Settings> => ipcRenderer.invoke('settings:save', patch),
  providers: (): Promise<typeof LLM_PROVIDERS> => ipcRenderer.invoke('meta:providers'),

  secretStatus: (): Promise<Record<SecretName, boolean>> => ipcRenderer.invoke('secrets:status'),
  setSecret: (name: SecretName, value: string): Promise<Record<SecretName, boolean>> =>
    ipcRenderer.invoke('secrets:set', name, value),
  /** Checks a saved key with a tiny request: the current AI provider (default), or the own Deepgram / TypeSafe key. */
  testKey: (target: 'ai' | 'deepgram' | 'typesafe' = 'ai'): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('secrets:test', target),
  sttAuth: (): Promise<{ ok: boolean; auth?: SttAuth; error?: string }> => ipcRenderer.invoke('stt:auth'),

  getPresets: (): Promise<PresetFile | null> => ipcRenderer.invoke('presets:get'),
  importPresets: (): Promise<{ ok: boolean; error?: string; presets?: PresetFile }> =>
    ipcRenderer.invoke('presets:import'),
  clearPresets: (): Promise<void> => ipcRenderer.invoke('presets:clear'),

  decide: (line: string, context: string, force: boolean): Promise<Decision> =>
    ipcRenderer.invoke('assist:decide', line, context, force),
  answer: (req: AnswerRequest): Promise<number> => ipcRenderer.invoke('assist:answer', req),
  cancelAnswer: (id: number): Promise<void> => ipcRenderer.invoke('assist:cancel', id),
  /** Screenshot of the screen under the mouse (our window is left out), as a JPEG data: URL. */
  captureScreen: (): Promise<{ ok: boolean; image?: string; error?: string }> => ipcRenderer.invoke('screen:capture'),
  onAnswerDelta: (cb: (d: AnswerDelta) => void) => listen('assist:delta', cb),
  onAnswerDone: (cb: (d: AnswerDone) => void) => listen('assist:done', cb),

  roomState: (): Promise<RoomState> => ipcRenderer.invoke('room:state'),
  startRoom: (): Promise<void> => ipcRenderer.invoke('room:start'),
  stopRoom: (close: boolean): Promise<void> => ipcRenderer.invoke('room:stop', close),
  /** Post as the host; ignored when no room is open. */
  sendRoomMessage: (post: RoomPost | string): Promise<void> => ipcRenderer.invoke('room:send', post),
  onRoomState: (cb: (s: RoomState) => void) => listen('room:state', cb),

  // Shortcuts & window actions. Buttons call runAction so they behave exactly like the shortcut.
  runAction: (action: ShortcutAction): Promise<void> => ipcRenderer.invoke('action:run', action),
  onShortcut: (cb: (action: ShortcutAction) => void) => listen('shortcut', cb),
  shortcutStatus: (): Promise<Partial<Record<ShortcutAction, boolean>>> => ipcRenderer.invoke('shortcuts:status'),
  pauseShortcuts: (): Promise<void> => ipcRenderer.invoke('shortcuts:pause'),
  resumeShortcuts: (): Promise<Partial<Record<ShortcutAction, boolean>>> => ipcRenderer.invoke('shortcuts:resume'),
  getUiState: (): Promise<UiState> => ipcRenderer.invoke('ui:get'),
  onUiState: (cb: (s: UiState) => void) => listen('ui:state', cb),
  onToast: (cb: (text: string) => void) => listen('ui:toast', cb),
  onSettingsChanged: (cb: (s: Settings) => void) => listen('settings:changed', cb),

  // Uses Electron's clipboard so copying works even while another app has focus.
  copyText: (text: string): Promise<void> => ipcRenderer.invoke('clipboard:write', text),
  copyImage: (dataUrl: string): Promise<void> => ipcRenderer.invoke('clipboard:write-image', dataUrl),

  // Floating logo bubble window.
  bubbleClick: (): void => ipcRenderer.send('bubble:click'),
  bubbleDragStart: (): void => ipcRenderer.send('bubble:drag-start'),
  bubbleDrag: (dx: number, dy: number): void => ipcRenderer.send('bubble:drag', dx, dy),
  bubbleDragEnd: (): void => ipcRenderer.send('bubble:drag-end')
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
