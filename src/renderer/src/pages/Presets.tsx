import { useEffect, useState } from 'react'
import type { PresetFile } from '../../../shared/types'

const SAMPLE = `{
  "name": "Frontend interview prep",
  "items": [
    {
      "id": "intro",
      "question": "Tell me about yourself",
      "variants": ["Introduce yourself", "Walk me through your background"],
      "answer": "I'm a frontend engineer with 4 years of experience..."
    }
  ]
}`

export function Presets() {
  const [presets, setPresets] = useState<PresetFile | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    window.api.getPresets().then(setPresets)
  }, [])

  async function importFile() {
    const result = await window.api.importPresets()
    if (result.presets) {
      setPresets(result.presets)
      setMessage(`Imported ${result.presets.items.length} presets.`)
    } else if (result.error) {
      setMessage(result.error)
    }
  }

  async function clear() {
    await window.api.clearPresets()
    setPresets(null)
    setMessage('Presets cleared.')
  }

  return (
    <div className="page">
      <div className="row">
        <button className="primary" onClick={importFile}>
          Import JSON
        </button>
        {presets && <button onClick={clear}>Clear</button>}
      </div>
      {message && <pre className="message">{message}</pre>}

      {presets ? (
        <>
          <h3>
            {presets.name} <span className="muted">({presets.items.length})</span>
          </h3>
          {presets.items.length > 254 && (
            <div className="error">Jev matches up to 254 presets; the rest are only used by local matching.</div>
          )}
          {presets.items.map((p) => (
            <details key={p.id} className="preset">
              <summary>{p.question}</summary>
              {!!p.variants?.length && <div className="muted small">Also: {p.variants.join(' · ')}</div>}
              <div className="answer">{p.answer}</div>
            </details>
          ))}
        </>
      ) : (
        <>
          <p className="muted">No presets yet. Import a JSON file in this format:</p>
          <pre className="code">{SAMPLE}</pre>
        </>
      )}
    </div>
  )
}
