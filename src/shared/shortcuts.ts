// Global shortcuts: they work even while another app (Zoom, Teams…) is focused.
// Defaults use Ctrl+Alt so they don't clash with common Ctrl+Shift browser/IDE shortcuts.

export const SHORTCUT_ACTIONS = [
  { id: 'toggleWindow', label: 'Show / hide window', default: 'CommandOrControl+Alt+H' },
  { id: 'answerNow', label: 'Answer now', default: 'CommandOrControl+Alt+Space' },
  { id: 'screenshotAnswer', label: 'Screenshot + answer', default: 'CommandOrControl+Alt+S' },
  { id: 'toggleListening', label: 'Start / stop listening', default: 'CommandOrControl+Alt+L' },
  { id: 'newChat', label: 'New chat (clear)', default: 'CommandOrControl+Alt+N' },
  { id: 'copyAnswer', label: 'Copy answer', default: 'CommandOrControl+Alt+C' },
  { id: 'scrollUp', label: 'Scroll answer up', default: 'CommandOrControl+Alt+PageUp' },
  { id: 'scrollDown', label: 'Scroll answer down', default: 'CommandOrControl+Alt+PageDown' },
  { id: 'toggleAutoScroll', label: 'Auto-scroll on / off', default: 'CommandOrControl+Alt+A' },
  { id: 'grow', label: 'Bigger window', default: 'CommandOrControl+Alt+=' },
  { id: 'shrink', label: 'Smaller window', default: 'CommandOrControl+Alt+-' },
  { id: 'moveLeft', label: 'Move window left', default: 'CommandOrControl+Alt+Left' },
  { id: 'moveRight', label: 'Move window right', default: 'CommandOrControl+Alt+Right' },
  { id: 'moveUp', label: 'Move window up', default: 'CommandOrControl+Alt+Up' },
  { id: 'moveDown', label: 'Move window down', default: 'CommandOrControl+Alt+Down' },
  { id: 'fontUp', label: 'Bigger chat text', default: 'CommandOrControl+Alt+.' },
  { id: 'fontDown', label: 'Smaller chat text', default: 'CommandOrControl+Alt+,' },
  { id: 'opacityDown', label: 'More transparent', default: 'CommandOrControl+Alt+[' },
  { id: 'opacityUp', label: 'More solid', default: 'CommandOrControl+Alt+]' },
  { id: 'toggleCompact', label: 'Compact mode (answer only)', default: 'CommandOrControl+Alt+M' },
  { id: 'toggleClickThrough', label: 'Click-through mode', default: 'CommandOrControl+Alt+T' },
  { id: 'togglePrivate', label: 'Private mode on / off', default: 'CommandOrControl+Alt+P' }
] as const

export type ShortcutAction = (typeof SHORTCUT_ACTIONS)[number]['id']
export type ShortcutMap = Record<ShortcutAction, string>

export const DEFAULT_SHORTCUTS = Object.fromEntries(SHORTCUT_ACTIONS.map((a) => [a.id, a.default])) as ShortcutMap

/** Electron accelerator -> what we print on buttons, e.g. "Ctrl+Alt+Space". */
export function formatShortcut(accelerator: string | undefined): string {
  if (!accelerator) return ''
  return accelerator
    .replace('CommandOrControl', 'Ctrl')
    .replace('PageUp', 'PgUp')
    .replace('PageDown', 'PgDn')
}

const CODE_TO_KEY: Record<string, string> = {
  Space: 'Space',
  Equal: '=',
  Minus: '-',
  BracketLeft: '[',
  BracketRight: ']',
  Comma: ',',
  Period: '.',
  Slash: '/',
  Semicolon: ';',
  Quote: "'",
  Backquote: '`',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Home: 'Home',
  End: 'End',
  Insert: 'Insert',
  Delete: 'Delete',
  Enter: 'Enter',
  Tab: 'Tab'
}

/** Build an Electron accelerator from a keydown; null if it isn't a usable shortcut. */
export function acceleratorFromEvent(e: {
  code: string
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  metaKey: boolean
}): string | null {
  let key: string | undefined
  if (/^Key[A-Z]$/.test(e.code)) key = e.code.slice(3)
  else if (/^Digit[0-9]$/.test(e.code)) key = e.code.slice(5)
  else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(e.code)) key = e.code
  else key = CODE_TO_KEY[e.code]
  if (!key) return null
  // Require Ctrl or Alt (or Win) so a global shortcut never swallows normal typing; F-keys may stand alone.
  if (!e.ctrlKey && !e.altKey && !e.metaKey && !key.startsWith('F')) return null
  const parts: string[] = []
  if (e.ctrlKey) parts.push('CommandOrControl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Super')
  parts.push(key)
  return parts.join('+')
}
