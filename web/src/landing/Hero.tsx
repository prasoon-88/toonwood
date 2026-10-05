import { Box, Typography } from '@mui/material'
import { GlowButton } from './GlowButton'
import { NavBar } from './NavBar'
import { ProductShot } from './ProductShot'
import { fonts, tokens } from './tokens'

/** Soft abstract hills at the bottom of the sky. */
function Hills() {
  return (
    <Box aria-hidden="true" sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: { xs: 260, md: 420 }, pointerEvents: 'none', zIndex: 1 }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(60% 70% at 18% 100%, rgba(255,240,228,.85), transparent 70%), radial-gradient(55% 65% at 85% 100%, rgba(255,226,206,.8), transparent 70%)'
        }}
      />
      <svg viewBox="0 0 1440 420" width="100%" height="100%" preserveAspectRatio="none" focusable="false" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="hill-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
            <stop offset="1" stopColor="#f6c9a6" stopOpacity=".7" />
          </linearGradient>
          <linearGradient id="hill-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff4ea" stopOpacity=".75" />
            <stop offset="1" stopColor="#f4b48d" stopOpacity=".85" />
          </linearGradient>
          <linearGradient id="hill-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
            <stop offset="1" stopColor="#fbe1cf" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d="M0 210 C 240 120 420 150 620 200 S 1040 120 1240 150 S 1400 190 1440 180 L1440 420 L0 420 Z" fill="url(#hill-back)" />
        <path d="M0 290 C 180 230 360 240 540 290 S 900 330 1100 260 S 1360 220 1440 250 L1440 420 L0 420 Z" fill="url(#hill-mid)" />
        <path d="M0 360 C 260 320 480 330 720 360 S 1180 330 1440 345 L1440 420 L0 420 Z" fill="url(#hill-front)" />
      </svg>
    </Box>
  )
}

export function Hero() {
  return (
    <Box
      component="section"
      aria-labelledby="hero-title"
      sx={{ position: 'relative', background: tokens.sky, color: '#fff', overflow: 'hidden', pb: 0 }}
    >
      <NavBar />

      {/* soft deeper-blue scrim behind the text block keeps white copy AA-readable */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          top: { xs: 60, md: 80 },
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: 900, md: 1900 },
          height: { xs: 580, md: 680 },
          background: 'radial-gradient(closest-side, rgba(20,70,170,.55), rgba(20,70,170,.55) 60%, rgba(20,70,170,.3) 82%, rgba(20,70,170,0))',
          pointerEvents: 'none'
        }}
      />
      <Hills />

      <Box className="container" sx={{ position: 'relative', zIndex: 2, pt: { xs: 15, md: 18 }, textAlign: 'center' }}>
        <Typography
          id="hero-title"
          component="h1"
          sx={{
            fontFamily: fonts.display,
            fontWeight: 400,
            fontSize: { xs: 44, md: 80 },
            lineHeight: 1.0,
            letterSpacing: '-1px',
            maxWidth: { xs: 360, md: 820 },
            mx: 'auto',
            textWrap: 'balance',
            textShadow: '0 2px 24px rgba(20,60,140,.25)'
          }}
        >
          Real-time answers, right on your call
        </Typography>
        <Box sx={{ width: 240, maxWidth: '60%', height: '1px', background: 'rgba(255,255,255,.45)', mx: 'auto', my: { xs: 3, md: 4 } }} />
        <Typography
          sx={{
            fontSize: { xs: 17, md: 19 },
            lineHeight: 1.6,
            maxWidth: 560,
            mx: 'auto',
            color: '#fff',
            textShadow: '0 1px 12px rgba(20,60,140,.35)'
          }}
        >
          Toonwide listens to your call, reads your screen when you ask, and shows the answer the moment you need it.
        </Typography>
        <Box sx={{ mt: { xs: 4, md: 5 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.75 }}>
          <GlowButton to="/signup" size="lg">
            Get started free
          </GlowButton>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#fff', textShadow: '0 1px 8px rgba(20,60,140,.3)' }}>
            60 free minutes · Windows
          </Typography>
        </Box>
      </Box>

      <Box className="container" sx={{ position: 'relative', zIndex: 2, mt: { xs: 7, md: 8 } }}>
        <ProductShot />
      </Box>
    </Box>
  )
}
