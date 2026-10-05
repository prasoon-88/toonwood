import { Box, Typography, keyframes } from '@mui/material'
import { GlowButton } from './GlowButton'
import { KeyCap } from './KeyCap'

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
`

const floating = {
  position: 'absolute',
  // only where the headline column leaves room beside it (container ≥ 1140 px)
  display: { xs: 'none', xl: 'block' },
  animation: `${float} 6s ease-in-out infinite`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
} as const

/** Closing call to action; sits on the footer gradient together with the footer. */
export function FinalCta() {
  return (
    <Box component="section" aria-labelledby="final-cta-title" sx={{ position: 'relative' }}>
      <Box className="container" sx={{ position: 'relative', py: { xs: 10, md: 16 } }}>
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: { md: 560, lg: 640 } }}>
          <Typography
            id="final-cta-title"
            component="h2"
            sx={{ fontSize: { xs: 32, md: 40 }, fontWeight: 500, letterSpacing: '-1px', lineHeight: 1.15, color: 'text.primary' }}
          >
            AI that helps during the call, not after.
          </Typography>
          <Typography sx={{ fontSize: { xs: 32, md: 40 }, fontWeight: 500, letterSpacing: '-1px', lineHeight: 1.15, color: '#6b7fae', mt: 0.5 }}>
            Try Toonwide on your next call.
          </Typography>
          <Box sx={{ mt: { xs: 4, md: 5 } }}>
            <GlowButton to="/signup" variant="dark" size="lg">
              Get started free
            </GlowButton>
          </Box>
        </Box>

        <Box aria-hidden="true" sx={{ ...floating, right: '24%', top: 100 }}>
          <KeyCap variant="float">Ctrl</KeyCap>
        </Box>
        <Box
          aria-hidden="true"
          sx={{ ...floating, right: 40, top: 210, animationDelay: '-3s', '& > span': { transform: 'rotate(10deg)' } }}
        >
          <KeyCap variant="float">S</KeyCap>
        </Box>
      </Box>
    </Box>
  )
}
