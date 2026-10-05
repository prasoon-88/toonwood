import { CssBaseline, ThemeProvider } from '@mui/material'
import { landingTheme } from './theme'
import { Hero } from './Hero'
import { HowItHelps } from './HowItHelps'
import { ScreenAnswers } from './ScreenAnswers'

export function LandingPage() {
  return (
    <ThemeProvider theme={landingTheme}>
      <CssBaseline />
      <div data-page="landing">
        <main>
          <Hero />
          <HowItHelps />
          <ScreenAnswers />
        </main>
      </div>
    </ThemeProvider>
  )
}
