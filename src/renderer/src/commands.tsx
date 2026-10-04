import { createContext, useContext, useEffect, useRef } from 'react'
import { formatShortcut, type ShortcutAction, type ShortcutMap } from '../../shared/shortcuts'

// Routes shortcut actions from the main process to the page that should handle them.
export type CommandTarget = 'live' | 'room'
type Handler = (action: ShortcutAction) => void

const handlers: Record<CommandTarget, Set<Handler>> = { live: new Set(), room: new Set() }

export function emitCommand(target: CommandTarget, action: ShortcutAction): void {
  handlers[target].forEach((h) => h(action))
}

/** Subscribe a page to commands; the latest `handler` is always used, so it can close over fresh state. */
export function useCommands(target: CommandTarget, handler: Handler): void {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    const h: Handler = (a) => ref.current(a)
    handlers[target].add(h)
    return () => {
      handlers[target].delete(h)
    }
  }, [target])
}

export const ShortcutsContext = createContext<ShortcutMap | null>(null)

/** Prints the current key combo for an action, e.g. on a button. */
export function Kbd({ action }: { action: ShortcutAction }) {
  const shortcuts = useContext(ShortcutsContext)
  const text = formatShortcut(shortcuts?.[action])
  return text ? <kbd>{text}</kbd> : null
}
