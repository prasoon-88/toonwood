import { useEffect, useState } from 'react'
import { FONT_SCALE, LLM_PROVIDERS, type LlmProvider, type SecretName, type Settings } from '../../../shared/types'
import {
  acceleratorFromEvent,
  DEFAULT_SHORTCUTS,
  formatShortcut,
  SHORTCUT_ACTIONS,
  type ShortcutAction,
  type ShortcutMap
} from '../../../shared/shortcuts'
import { Kbd } from '../commands'

interface Props {
  settings: Settings
  update: (patch: Partial<Settings>) => Promise<void>
  /** Called after the user saves or removes an AI key. */
  onKeysChanged?: () => void
}

function KeyField({
  name,
  label,
  saved,
  onSaved,
  test = 'ai'
}: {
  name: SecretName
  label: string
  saved: boolean
  onSaved: (status: Record<SecretName, boolean>) => void
  test?: 'ai' | 'deepgram' | 'typesafe'
}) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState('')

  async function save() {
    onSaved(await window.api.setSecret(name, value))
    setValue('')
    setResult(value ? 'Saved' : 'Removed')
  }

  async function runTest() {
    setResult('Testing…')
    const r = await window.api.testKey(test)
    setResult(r.ok ? '✓ Works' : `✗ ${r.error}`)
  }

  return (
    <label className="field">
      <span>
        {label} {saved && <span className="ok">● saved</span>}
      </span>
      <div className="row">
        <input
          type="password"
          placeholder={saved ? '•••••••• (enter to replace)' : 'Paste API key'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button onClick={save} disabled={!value && !saved}>
          {value || !saved ? 'Save' : 'Remove'}
        </button>
        <button onClick={runTest} disabled={!saved}>
          Test
        </button>
      </div>
      {result && <span className="small muted">{result}</span>}
    </label>
  )
}

export function SettingsPage({ settings, update, onKeysChanged }: Props) {
  const [status, setStatus] = useState<Record<SecretName, boolean> | null>(null)

  useEffect(() => {
    window.api.secretStatus().then(setStatus)
  }, [])

  function keysSaved(next: Record<SecretName, boolean>) {
    setStatus(next)
    onKeysChanged?.()
  }

  if (!status) return null
  const provider = settings.llmProvider
  const providerLabel = LLM_PROVIDERS.find((p) => p.id === provider)!.label

  return (
    <div className="page settings">
      <h3>AI</h3>
      <p className="small muted">
        Answers are written by the AI provider you choose, using your own API key. The key is encrypted on this PC and
        only ever sent to that provider.
      </p>
      <label className="field">
        <span>Provider</span>
        <select
          value={provider}
          onChange={(e) => {
            const id = e.target.value as LlmProvider
            update({ llmProvider: id, llmModel: LLM_PROVIDERS.find((p) => p.id === id)!.defaultModel })
          }}
        >
          {LLM_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      {provider === 'ollama' ? (
        <label className="field">
          <span>Ollama URL</span>
          <input defaultValue={settings.ollamaUrl} onBlur={(e) => update({ ollamaUrl: e.target.value.trim() })} />
        </label>
      ) : (
        <KeyField key={provider} name={provider} label={`${providerLabel} API key`} saved={status[provider]} onSaved={keysSaved} />
      )}
      <label className="field">
        <span>Model</span>
        <input defaultValue={settings.llmModel} key={provider} onBlur={(e) => update({ llmModel: e.target.value.trim() })} />
      </label>

      <h3>Listening</h3>
      <KeyField name="deepgram" label="Deepgram API key (optional)" saved={status.deepgram} onSaved={keysSaved} test="deepgram" />
      <p className="small muted hint">
        Live transcription uses your own Deepgram key if you add one here. Leave it empty to use the Call Copilot
        service.
      </p>
      <label className="check">
        <input type="checkbox" checked={settings.captureMic} onChange={(e) => update({ captureMic: e.target.checked })} />
        Use my microphone (off = only the call audio is captured, never your voice)
      </label>
      {settings.captureMic && (
        <label className="field">
          <span>Detect questions from</span>
          <select value={settings.listenTo} onChange={(e) => update({ listenTo: e.target.value as Settings['listenTo'] })}>
            <option value="both">Both sides (use if you are on speakers, not headphones)</option>
            <option value="them">Only the other person (call audio)</option>
          </select>
        </label>
      )}

      <h3>Presets</h3>
      <KeyField name="typesafe" label="TypeSafe API key (optional)" saved={status.typesafe} onSaved={keysSaved} test="typesafe" />
      <p className="small muted hint">
        Used by Jev to tell real questions apart and match them to your presets, even when worded differently. Leave
        it empty to use the Call Copilot service (or offline matching).
      </p>
      <label className="field">
        <span>Minimum confidence to use a preset: {Math.round(settings.confidenceThreshold * 100)}%</span>
        <input
          type="range"
          min={0.3}
          max={0.95}
          step={0.05}
          value={settings.confidenceThreshold}
          onChange={(e) => update({ confidenceThreshold: Number(e.target.value) })}
        />
      </label>

      <h3>Context for AI</h3>
      <label className="field">
        <span>Your resume / background</span>
        <textarea rows={5} defaultValue={settings.resume} onBlur={(e) => update({ resume: e.target.value })} />
      </label>
      <label className="field">
        <span>Role, company or meeting context</span>
        <textarea rows={4} defaultValue={settings.jobDescription} onBlur={(e) => update({ jobDescription: e.target.value })} />
      </label>
      <label className="field">
        <span>Custom instructions (optional, replaces the default)</span>
        <textarea rows={3} defaultValue={settings.systemPrompt} onBlur={(e) => update({ systemPrompt: e.target.value })} />
      </label>

      <h3>Window</h3>
      <label className="check">
        <input type="checkbox" checked={settings.privateMode} onChange={(e) => update({ privateMode: e.target.checked })} />
        Private mode: hide this window from screen share and recordings
      </label>
      <label className="field">
        <span>
          Opacity: {Math.round(settings.opacity * 100)}% <Kbd action="opacityDown" /> <Kbd action="opacityUp" />
        </span>
        <input
          type="range"
          min={0.3}
          max={1}
          step={0.05}
          value={settings.opacity}
          onChange={(e) => update({ opacity: Number(e.target.value) })}
        />
      </label>
      <label className="field">
        <span>
          Chat text size: {Math.round(settings.fontScale * 100)}% <Kbd action="fontDown" /> <Kbd action="fontUp" />
        </span>
        <input
          type="range"
          min={FONT_SCALE.min}
          max={FONT_SCALE.max}
          step={FONT_SCALE.step}
          value={settings.fontScale}
          onChange={(e) => update({ fontScale: Number(e.target.value) })}
        />
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.showBubble} onChange={(e) => update({ showBubble: e.target.checked })} />
        Show a floating logo when the window is hidden (click it to reopen)
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.autoScroll} onChange={(e) => update({ autoScroll: e.target.checked })} />
        Auto-scroll to the newest text
      </label>

      <h3>Shortcuts</h3>
      <ShortcutEditor shortcuts={settings.shortcuts} update={update} />
    </div>
  )
}

function ShortcutEditor({ shortcuts, update }: { shortcuts: ShortcutMap; update: Props['update'] }) {
  const [recording, setRecording] = useState<ShortcutAction | null>(null)
  const [status, setStatus] = useState<Partial<Record<ShortcutAction, boolean>>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    window.api.shortcutStatus().then(setStatus)
  }, [shortcuts])

  // While recording, global shortcuts are paused and the next key combo becomes the new shortcut.
  useEffect(() => {
    if (!recording) return
    window.api.pauseShortcuts()
    let saved = false
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') return setRecording(null)
      const accelerator = acceleratorFromEvent(e)
      if (!accelerator) return
      const owner = SHORTCUT_ACTIONS.find((a) => a.id !== recording && shortcuts[a.id] === accelerator)
      if (owner) {
        setError(`${formatShortcut(accelerator)} is already used for "${owner.label}".`)
        return
      }
      saved = true
      setError('')
      update({ shortcuts: { ...shortcuts, [recording]: accelerator } })
      setRecording(null)
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      // Saving re-registers everything in the main process; otherwise turn the old ones back on.
      if (!saved) window.api.resumeShortcuts().then(setStatus)
    }
  }, [recording])

  return (
    <div className="shortcuts">
      <p className="small muted">
        These work everywhere, even while another app is focused. Click a shortcut, then press the new keys (Ctrl or Alt
        required). Press Esc to cancel.
      </p>
      {SHORTCUT_ACTIONS.map((a) => (
        <div key={a.id} className="shortcut-row">
          <span>{a.label}</span>
          <button className={`kbd-btn ${recording === a.id ? 'recording' : ''}`} onClick={() => setRecording(a.id)}>
            {recording === a.id ? 'Press keys…' : formatShortcut(shortcuts[a.id]) || 'Not set'}
          </button>
          {status[a.id] === false && recording !== a.id && (
            <span className="warn-text small" title="Another app is already using this combination">
              in use
            </span>
          )}
          {shortcuts[a.id] !== a.default && (
            <button className="link-btn" onClick={() => update({ shortcuts: { ...shortcuts, [a.id]: a.default } })}>
              Reset
            </button>
          )}
        </div>
      ))}
      {error && <div className="error">{error}</div>}
      <button className="tool" onClick={() => update({ shortcuts: DEFAULT_SHORTCUTS })}>
        Reset all shortcuts
      </button>
    </div>
  )
}
