import { API_URL, APP_KEY } from './config'
import { getDeviceId } from './store'

/** POST to the Call Copilot backend; throws with the server's error message on failure. */
export async function apiPost<T>(path: string, body: unknown, timeoutMs = 8000): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Key': APP_KEY, 'X-Device-Id': getDeviceId() },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    })
  } catch {
    throw new Error('Cannot reach the Call Copilot service. Check your internet connection.')
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(data.error ?? `Service error (${res.status})`)
  return data
}

/** Short-lived token the renderer uses to open the transcription WebSocket. */
export function getSttToken(): Promise<{ token: string; expiresIn: number }> {
  return apiPost('/stt/token', {})
}

/** Is the last part of `state` a question, and how well does it match each preset (same order as `presets`)? */
export function classify(state: string, presets: string[]): Promise<{ isQuestion: number; probabilities: number[] }> {
  return apiPost('/classify', { state, presets })
}
