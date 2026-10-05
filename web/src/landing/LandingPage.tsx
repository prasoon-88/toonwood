import { CssBaseline, ThemeProvider } from '@mui/material'
import { landingTheme } from './theme'
import { Hero } from './Hero'
import { HowItHelps } from './HowItHelps'
import { ScreenAnswers } from './ScreenAnswers'
import { Features } from './Features'
import { Stats } from './Stats'
import { Faq } from './Faq'

export function LandingPage() {
  return (
    <ThemeProvider theme={landingTheme}>
      <CssBaseline />
      <div data-page="landing">
        <main>
          <Hero />
          <HowItHelps />
          <ScreenAnswers />
          <Features />
          <Stats />
          <Faq />
        </main>
      </div>
    </ThemeProvider>
  )
}
