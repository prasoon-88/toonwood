import { generateText, streamText, type LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import { createDeepSeek } from '@ai-sdk/deepseek'
import type { AnswerRequest, Settings } from '../shared/types'
import { getSecret } from './store'

function requireKey(name: Parameters<typeof getSecret>[0]): string {
  const key = getSecret(name)
  if (!key) throw new Error(`No API key saved for ${name}. Add it in Settings.`)
  return key
}

function getModel(s: Settings): LanguageModel {
  switch (s.llmProvider) {
    case 'openai':
      return createOpenAI({ apiKey: requireKey('openai') })(s.llmModel)
    case 'anthropic':
      return createAnthropic({ apiKey: requireKey('anthropic') })(s.llmModel)
    case 'google':
      return createGoogleGenerativeAI({ apiKey: requireKey('google') })(s.llmModel)
    case 'deepseek':
      return createDeepSeek({ apiKey: requireKey('deepseek') })(s.llmModel)
    case 'groq':
      return createGroq({ apiKey: requireKey('groq') })(s.llmModel)
    case 'openrouter':
      return createOpenAI({ apiKey: requireKey('openrouter'), baseURL: 'https://openrouter.ai/api/v1' }).chat(s.llmModel)
    case 'ollama':
      return createOpenAI({ apiKey: 'ollama', baseURL: `${s.ollamaUrl.replace(/\/$/, '')}/v1` }).chat(s.llmModel)
  }
}

const DEFAULT_SYSTEM = `You help the user respond during a live conversation.
You are NOT a participant in the conversation and nobody is talking to you. You only see a live speech-to-text transcript.
Write what the user should say to answer the most recent question, in first person, as the user would say it.
The transcript is noisy: speaker labels can be wrong and sentences can be split across lines, so read the last few lines together to work out the real question.
Never ask for clarification and never comment on the transcript. Answer the most likely intended question.
Be concise and easy to say out loud: a short opening sentence, then 2-5 tight bullet points.
Use the user's background when relevant. Never invent facts about the user; if something is unknown, keep it general.`

/** Screenshot answers: the screen is the question, and the reply is the answer only. */
const SCREENSHOT_SYSTEM = `You answer what is shown in a screenshot of the user's screen.
First read EVERYTHING in the image carefully: all text, code, options, numbers, diagrams, tables and any constraints or examples.
Work out the question or task it shows, solve it carefully and check your result before you reply. Accuracy matters more than speed.

Reply with the answer ONLY:
- No greeting, no preamble, no restating the question, no explanation, no notes, no follow-up offers.
- Multiple choice: the correct option exactly as shown (e.g. "B) 42"). Several correct options: list each on its own line.
- Coding problem: only the complete, correct, runnable solution in one fenced code block, in the language shown (or the most fitting one). Handle edge cases and meet any stated limits.
- Math / numeric / fill in the blank: only the final answer, with units if needed.
- Short or open question: the answer itself, as briefly as it can be while still complete.
- Several questions: answer each in order, numbered as in the image.
If the screenshot shows no question, reply with the one most useful direct response to what is on screen, still with no extra text.
Never say you cannot see the image and never ask for clarification: give the most likely correct answer.`

function buildSystem(s: Settings, req: AnswerRequest): string {
  const parts = [req.image ? SCREENSHOT_SYSTEM : s.systemPrompt.trim() || DEFAULT_SYSTEM]
  if (s.resume.trim()) parts.push(`## User background / resume\n${s.resume.trim()}`)
  if (s.jobDescription.trim()) parts.push(`## Role / context\n${s.jobDescription.trim()}`)
  if (req.references.length) {
    parts.push(
      `## The user's prepared answers to similar questions (stay consistent with these)\n` +
        req.references.map((p) => `Q: ${p.question}\nA: ${p.answer}`).join('\n\n')
    )
  }
  return parts.join('\n\n')
}

export async function streamAnswer(
  s: Settings,
  req: AnswerRequest,
  onDelta: (text: string) => void,
  signal: AbortSignal
): Promise<void> {
  let failure: unknown
  const prompt = `Recent transcript:\n${req.transcript || '(none)'}\n\nMost recent speech (likely the question): ${req.question || '(none)'}`
  const screenshotPrompt =
    'Answer the question in this screenshot. Answer only, no extra text.' +
    (req.transcript ? `\n\nCall transcript (extra context only, the screenshot comes first):\n${req.transcript}` : '')
  const result = streamText({
    model: getModel(s),
    system: buildSystem(s, req),
    messages: [
      {
        role: 'user',
        content: req.image
          ? [
              { type: 'image', image: req.image.replace(/^data:[^,]+,/, ''), mediaType: 'image/jpeg' },
              { type: 'text', text: screenshotPrompt }
            ]
          : prompt
      }
    ],
    abortSignal: signal,
    onError: ({ error }) => {
      failure = error
    }
  })
  for await (const text of result.textStream) onDelta(text)
  if (failure) throw failure
}

export async function testLlm(s: Settings): Promise<void> {
  await generateText({ model: getModel(s), prompt: 'Reply with OK', maxOutputTokens: 16 })
}
