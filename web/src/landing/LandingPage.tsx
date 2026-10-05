import { CssBaseline, ThemeProvider } from '@mui/material'
import { landingTheme } from './theme'
import { Hero } from './Hero'

export function LandingPage() {
  return (
    <ThemeProvider theme={landingTheme}>
      <CssBaseline />
      <div data-page="landing">
        <main>
          <Hero />
        </main>
      </div>
    </ThemeProvider>
  )
}
