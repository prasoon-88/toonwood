import type { Preset, ScoredPreset } from '../shared/types'

// Offline, zero-cost fallback when no Jev key is configured: word-overlap (Dice) similarity.

const STOPWORDS = new Set(
  'a an the and or but if of to in on at for with about from by as is are was were be been do does did can could would will should you your me my i we our us it this that what how why when where who which tell'.split(
    ' '
  )
)

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
  )
}

function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let shared = 0
  for (const w of a) if (b.has(w)) shared++
  return (2 * shared) / (a.size + b.size)
}

export function localMatch(question: string, presets: Preset[]): ScoredPreset[] {
  const q = tokens(question)
  return presets
    .map((preset) => ({
      preset,
      score: Math.max(...[preset.question, ...(preset.variants ?? [])].map((t) => dice(q, tokens(t))))
    }))
    .sort((a, b) => b.score - a.score)
}

const QUESTION_START =
  /^(what|why|how|when|where|who|which|can|could|would|will|do|does|did|is|are|have|has|should|tell me|walk me|explain|describe|give me|talk about)\b/i

const QUESTION_ANYWHERE =
  /\b(what is|what are|what's|how do|how does|how would|why do|why does|difference between|tell (me|us) about|walk (me|us) through|can you|could you|explain|know about|describe)\b/i

// Speech that stops on one of these words was cut off mid-sentence ("What is the").
const DANGLING_END = /\b(the|a|an|is|are|of|to|about|what|how|why|and|or|with|for|in|on|your|my)[.?!,]*$/i

export function looksLikeQuestion(text: string): boolean {
  const s = text.trim()
  if (s.split(/\s+/).length < 3 || DANGLING_END.test(s)) return false
  const last = s.split(/(?<=[.!?])\s+/).pop() ?? s
  return s.endsWith('?') || QUESTION_START.test(last) || QUESTION_ANYWHERE.test(s)
}
