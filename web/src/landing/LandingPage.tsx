import { CssBaseline, ThemeProvider } from '@mui/material'
import { landingTheme } from './theme'

export function LandingPage() {
  return (
    <ThemeProvider theme={landingTheme}>
      <CssBaseline />
      <div data-page="landing">
        <main />
      </div>
    </ThemeProvider>
  )
}
