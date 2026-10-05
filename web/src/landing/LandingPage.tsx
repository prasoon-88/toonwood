import { Box, CssBaseline, ThemeProvider } from '@mui/material'
import { landingTheme } from './theme'
import { tokens } from './tokens'
import { Hero } from './Hero'
import { HowItHelps } from './HowItHelps'
import { ScreenAnswers } from './ScreenAnswers'
import { Features } from './Features'
import { Stats } from './Stats'
import { Faq } from './Faq'
import { FinalCta } from './FinalCta'
import { Footer } from './Footer'
import { FloatingCta } from './FloatingCta'

export function LandingPage() {
  return (
    <ThemeProvider theme={landingTheme}>
      <CssBaseline />
      <Box data-page="landing" sx={{ overflowX: 'clip', background: '#fff' }}>
        <main>
          <Hero />
          <HowItHelps />
          <ScreenAnswers />
          <Features />
          <Stats />
          <Faq />
        </main>
        {/* the closing call to action and the footer share one gradient */}
        <Box sx={{ background: tokens.footer }}>
          <FinalCta />
          <Footer />
        </Box>
        <FloatingCta />
      </Box>
    </ThemeProvider>
  )
}
