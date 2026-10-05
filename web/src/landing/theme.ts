import { createTheme } from '@mui/material'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/inter'
import { fonts, tokens } from './tokens'

/** Always-light theme for the marketing page. */
export const landingTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: tokens.primary },
    text: { primary: tokens.ink, secondary: tokens.muted },
    background: { default: '#ffffff' }
  },
  shape: { borderRadius: tokens.radius.button },
  typography: {
    fontFamily: fonts.sans,
    h2: { fontWeight: 500, letterSpacing: '-1.5px', lineHeight: 1.08, fontSize: 'clamp(36px, 5vw, 56px)' },
    body1: { fontSize: 18, lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600 }
  }
})
