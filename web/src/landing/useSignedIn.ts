import { createContext, useContext, useEffect, useState } from 'react'

/** Whether a session exists, as checked once per page by `useSessionCheck` and shared via context. */
export const SignedInContext = createContext(false)

/** Asks the backend once whether the visitor is signed in. Call it at the page root. */
export function useSessionCheck() {
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/auth/me', { credentials: 'same-origin', signal: controller.signal })
      .then((res) => setSignedIn(res.status === 200))
      .catch(() => {})
    return () => controller.abort()
  }, [])
  return signedIn
}

/** The page's signed-in state (NavBar, FloatingCta). */
export function useSignedIn() {
  return useContext(SignedInContext)
}
