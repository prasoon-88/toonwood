import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { SecretName, Settings, UiState } from '../../shared/types'
import type { ShortcutAction } from '../../shared/shortcuts'
import { emitCommand, Kbd, ShortcutsContext, type CommandTarget } from './commands'
import { Live } from './pages/Live'
import { Presets } from './pages/Presets'
import { Room } from './pages/Room'
import { SettingsPage } from './pages/Settings'

type Tab = 'live' | 'room' | 'presets' | 'settings'

/** Actions handled by the active page; they bring that page to the front. */
const PAGE_ACTIONS: ShortcutAction[] = ['answerNow', 'newChat', 'copyAnswer', 'scrollUp', 'scrollDown']

const ARROW_MOVES: Record<string, ShortcutAction> = {
  ArrowLeft: 'moveLeft',
  ArrowRight: 'moveRight',
  ArrowUp: 'moveUp',
  ArrowDown: 'moveDown'
}

export function App() {
  const [tab, setTab] = useState<Tab>('live')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [ui, setUi] = useState<UiState>({ compact: false, clickThrough: false })
  const [toast, setToast] = useState<string | null>(null)
  const [savedKeys, setSavedKeys] = useState<Partial<Record<SecretName, boolean>> | null>(null)
  const tabRef = useRef(tab)
  tabRef.current = tab
  /** The page that handled the last page action; Presets/Settings send actions here. */
  const targetRef = useRef<CommandTarget>('live')
  if (tab === 'live' || tab === 'room') targetRef.current = tab

  useEffect(() => {
    window.api.getSettings().then(setSettings)
    window.api.getUiState().then(setUi)
    window.api.secretStatus().then(setSavedKeys)
    let toastTimer: number | undefined
    const offs = [
      window.api.onSettingsChanged(setSettings),
      window.api.onUiState(setUi),
      window.api.onToast((text) => {
        setToast(text)
        window.clearTimeout(toastTimer)
        toastTimer = window.setTimeout(() => setToast(null), 1800)
      }),
      window.api.onShortcut((action) => {
        if (action === 'toggleListening') return emitCommand('live', action)
        if (action === 'screenshotAnswer') {
          setTab('live')
          return emitCommand('live', action)
        }
        const target = targetRef.current
        if (PAGE_ACTIONS.includes(action) && tabRef.current !== target) setTab(target)
        emitCommand(target, action)
      })
    ]
    return () => offs.forEach((off) => off())
  }, [])

  // While this window is focused, plain Ctrl+Arrow also moves it (unless you're typing in a field,
  // where Ctrl+Arrow should keep jumping between words). Ctrl+Alt+Arrow works from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return
      const action = ARROW_MOVES[e.key]
      const target = e.target as HTMLElement | null
      if (!action || target?.closest('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      window.api.runAction(action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const update = async (patch: Partial<Settings>) => setSettings(await window.api.saveSettings(patch))
  const run = (action: ShortcutAction) => window.api.runAction(action)

  if (!settings) return null
  // Compact mode only shows Live or Room.
  const shown: Tab = ui.compact && (tab === 'presets' || tab === 'settings') ? targetRef.current : tab
  // First run (or a new provider): the one thing the user must set up is their AI key.
  const provider = settings.llmProvider
  const needsAiKey = savedKeys !== null && provider !== 'ollama' && settings.mode !== 'preset' && !savedKeys[provider]
  return (
    <ShortcutsContext.Provider value={settings.shortcuts}>
      <div
        className={`app ${ui.compact ? 'compact' : ''}`}
        style={{ '--chat-scale': settings.fontScale } as CSSProperties}
      >
        {ui.clickThrough && (
          <div className="banner">
            Click-through is on. Clicks go to the app behind. <Kbd action="toggleClickThrough" />
          </div>
        )}
        {needsAiKey && !ui.compact && shown !== 'settings' && (
          <div className="setup-banner">
            <span>Add your AI API key to start getting answers.</span>
            <button className="primary" onClick={() => setTab('settings')}>
              Add key
            </button>
          </div>
        )}

        {ui.compact ? (
          <div className="compact-bar">
            <span className="muted small">{shown === 'room' ? 'Room' : 'Live'}</span>
            <button className="tool" onClick={() => run('toggleCompact')}>
              Exit compact <Kbd action="toggleCompact" />
            </button>
          </div>
        ) : (
          <>
            <nav className="tabs">
              {(['live', 'room', 'presets', 'settings'] as Tab[]).map((t) => (
                <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
              <select
                className="mode"
                value={settings.mode}
                onChange={(e) => update({ mode: e.target.value as Settings['mode'] })}
                title="Answer mode"
              >
                <option value="hybrid">Hybrid</option>
                <option value="preset">Preset only</option>
                <option value="ai">AI only</option>
              </select>
            </nav>
            <div className="toolbar">
              <button className="tool" onClick={() => run('newChat')}>
                New chat <Kbd action="newChat" />
              </button>
              <button className={`tool ${settings.autoScroll ? 'on' : ''}`} onClick={() => run('toggleAutoScroll')}>
                Auto-scroll {settings.autoScroll ? 'on' : 'off'} <Kbd action="toggleAutoScroll" />
              </button>
              <button className="tool" onClick={() => run('toggleCompact')}>
                Compact <Kbd action="toggleCompact" />
              </button>
              <button className="tool" onClick={() => run('shrink')} title="Smaller window">
                − <Kbd action="shrink" />
              </button>
              <button className="tool" onClick={() => run('grow')} title="Bigger window">
                + <Kbd action="grow" />
              </button>
              <button className="tool" onClick={() => run('fontDown')} title="Smaller chat text">
                A− <Kbd action="fontDown" />
              </button>
              <button className="tool" onClick={() => run('fontUp')} title="Bigger chat text">
                A+ {Math.round(settings.fontScale * 100)}% <Kbd action="fontUp" />
              </button>
              <button className="tool" onClick={() => run('opacityDown')} title="More transparent">
                ◐ {Math.round(settings.opacity * 100)}% <Kbd action="opacityDown" />
              </button>
              <button className="tool" onClick={() => run('opacityUp')} title="More solid">
                ● <Kbd action="opacityUp" />
              </button>
              <button className="tool" onClick={() => run('toggleWindow')} title="Hide to the floating logo">
                Hide <Kbd action="toggleWindow" />
              </button>
            </div>
          </>
        )}

        {/* Live and Room stay mounted so sessions keep running (and auto-answering) on other tabs. */}
        <div className="view" hidden={shown !== 'live'}>
          <Live settings={settings} />
        </div>
        <div className="view" hidden={shown !== 'room'}>
          <Room settings={settings} update={update} />
        </div>
        {shown === 'presets' && <Presets />}
        {shown === 'settings' && (
          <SettingsPage
            settings={settings}
            update={update}
            onKeysChanged={() => window.api.secretStatus().then(setSavedKeys)}
          />
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </ShortcutsContext.Provider>
  )
}
