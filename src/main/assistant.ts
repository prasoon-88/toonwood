import type { Classifier, Decision, ScoredPreset } from '../shared/types'
import { getPresets, getSecret, getSettings } from './store'
import { classify } from './backend'
import { jevClassify } from './jev'
import { localMatch, looksLikeQuestion } from './localMatcher'

/** Max presets Jev accepts (choice limit minus a "none" option). */
const MAX_REMOTE_PRESETS = 254

/**
 * Decide how to respond to a line the other person said.
 * `context` is the recent transcript ending with that line; `force` = user pressed "Answer".
 */
export async function decide(line: string, context: string, force: boolean): Promise<Decision> {
  const settings = getSettings()
  const presets = getPresets()?.items ?? []
  const usePresets = settings.mode !== 'ai' && presets.length > 0
  let isQuestion = looksLikeQuestion(line)
  let ranked: ScoredPreset[] = []
  let via: Classifier = 'local'
  let warning: string | undefined

  // Jev judges "is this a complete question?" from the whole recent transcript in every mode, and ranks
  // presets when they are in use. It runs with the user's own TypeSafe key if they saved one in Settings,
  // otherwise through the backend. If neither works, fall back to offline matching.
  try {
    const remote = usePresets ? presets.slice(0, MAX_REMOTE_PRESETS) : []
    const texts = remote.map((p) => [p.question, ...(p.variants ?? [])].join(' | '))
    const ownKey = getSecret('typesafe')
    const result = ownKey ? await jevClassify(ownKey, context, texts) : await classify(context, texts)
    isQuestion = result.isQuestion >= 0.5
    ranked = remote.map((preset, i) => ({ preset, score: result.probabilities[i] ?? 0 })).sort((a, b) => b.score - a.score)
    via = 'jev'
  } catch (err) {
    const message = (err as Error).message
    warning = /not configured/i.test(message)
      ? 'Used offline matching. Add a TypeSafe key in Settings → Presets for smarter matching.'
      : `Smart matching unavailable, used offline matching (${message})`
  }
  if (usePresets && via === 'local') ranked = localMatch(line, presets)

  if (!isQuestion && !force) return { kind: 'skip' }

  const [best, ...rest] = ranked
  const alternatives = rest.slice(0, 3)
  if (settings.mode !== 'ai' && best && best.score >= settings.confidenceThreshold) {
    return { kind: 'preset', best, alternatives, via, warning }
  }
  if (settings.mode === 'preset') return { kind: 'nomatch', alternatives: ranked.slice(0, 3), via, warning }
  const references = ranked.filter((r) => r.score >= 0.15).slice(0, 3).map((r) => r.preset)
  return { kind: 'ai', references, warning }
}
