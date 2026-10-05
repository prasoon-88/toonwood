export const tokens = {
  ink: '#0f1115',
  inkEnd: '#5b6178',
  muted: '#5b6070',
  faint: '#8a90a2',
  primary: '#1f63e6',
  primaryLight: '#3f8cff',
  glow: 'rgba(31,99,230,.45)',
  sky: 'linear-gradient(180deg, #2f7deb 0%, #4b9af1 38%, #9fcaf6 62%, #f6d3b4 86%, #f4b48d 100%)',
  dusk: 'linear-gradient(160deg, #f7b27c, #e48a76 45%, #9b7fd4)',
  soft: 'linear-gradient(180deg, #c9d1e8, #e6e9f4)',
  // deepened at the top (spec: #6d9bff → #4f86f7) so white body text on the blue card meets AA
  blue: 'linear-gradient(180deg, #2a62e2 0%, #3a74ee 55%, #5b8ff8 100%)',
  glass: 'rgba(28,30,38,.86)',
  glassBorder: 'rgba(255,255,255,.14)',
  footer: 'linear-gradient(180deg, #ffffff, #e3e6f1)',
  radius: { panel: 32, card: 20, button: 12, chip: 999 }
} as const

export const fonts = {
  display: "'Instrument Serif', Georgia, serif",
  sans: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
} as const
