import { createTheme } from '@mui/material'
import '@fontsource/instrument-serif/400.css'
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
  // match the Bootstrap grid the sections are laid out with
  breakpoints: { values: { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 } },
  shape: { borderRadius: tokens.radius.button },
  typography: {
    fontFamily: fonts.sans,
    h2: { fontWeight: 500, letterSpacing: '-1.5px', lineHeight: 1.08, fontSize: 'clamp(36px, 5vw, 56px)' },
    body1: { fontSize: 18, lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600 }
  }
})
