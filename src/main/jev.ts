// Direct TypeSafe Jev client, used when the user saved their own TypeSafe key in Settings.
// Mirrors the backend's /api/classify (room-server/api.js) and returns the same shape.
// Docs: https://docs.typesafe.ai/primitives/choice

const JEV_URL = 'https://api.typesafe.ai/v1/systemone'
const NONE_KEY = 'none_of_these'

interface JevResponse {
  answers: {
    is_question: { noul: number }
    preset?: { choice: string; confidence: number; probabilities: Record<string, number> }
  }
}

/** Is the last part of `state` a question, and how well does it match each preset text (same order)? */
export async function jevClassify(
  apiKey: string,
  state: string,
  presets: string[]
): Promise<{ isQuestion: number; probabilities: number[] }> {
  const criteria: Record<string, string> = {}
  presets.forEach((text, i) => (criteria[`p${i}`] = text))
  criteria[NONE_KEY] = 'None of the above, or not a question'

  const questions: Record<string, object> = {
    is_question: {
      type: 'noul',
      instructions:
        'The LAST lines contain a complete question or request for information that the user should answer now (not a greeting, not cut off mid-sentence)'
    }
  }
  if (presets.length) {
    questions.preset = {
      type: 'choice',
      instructions: 'Which prepared question has the same meaning as the LAST lines (meaning, not exact words)?',
      criteria
    }
  }

  const res = await fetch(JEV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'jev-latest', state, questions }),
    signal: AbortSignal.timeout(8000)
  })
  if (res.status === 401 || res.status === 403) throw new Error('TypeSafe rejected this key')
  if (!res.ok) throw new Error(`TypeSafe error (${res.status})`)
  const data = (await res.json()) as JevResponse
  const probabilities = presets.map((_, i) => data.answers.preset?.probabilities[`p${i}`] ?? 0)
  return { isQuestion: data.answers.is_question.noul, probabilities }
}

export async function jevTest(apiKey: string): Promise<void> {
  await jevClassify(apiKey, 'Them: Tell me about yourself.', ['Tell me about yourself'])
}
