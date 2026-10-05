import type { ReactNode } from 'react'
import { Box, Typography, keyframes } from '@mui/material'
import GraphicEq from '@mui/icons-material/GraphicEq'
import ArrowUpward from '@mui/icons-material/ArrowUpward'
import AutoAwesome from '@mui/icons-material/AutoAwesome'
import { KeyCap } from './KeyCap'
import { SectionHeading } from './SectionHeading'
import { SoftPanel } from './SoftPanel'
import { fonts, tokens } from './tokens'

const cardTitle = {
  fontSize: { xs: 28, md: 32 },
  fontWeight: 500,
  lineHeight: 1.2,
  letterSpacing: '-0.6px'
} as const

const pulse = keyframes`
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(.55); }
`

/** 40 rounded bars, tallest in the middle and tapering to dots at both ends. */
const BAR_COUNT = 40
const BAR_W = 6
const BAR_GAP = 6
const WAVE_H = 96
const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
  const envelope = Math.sin((Math.PI * (i + 0.5)) / BAR_COUNT) ** 1.6
  const jitter = 0.55 + 0.45 * Math.abs(Math.sin(i * 12.9898) * 1.7 % 1)
  return Math.max(BAR_W, Math.round(envelope * jitter * WAVE_H))
})

function Waveform() {
  const width = BAR_COUNT * BAR_W + (BAR_COUNT - 1) * BAR_GAP
  return (
    <Box
      component="svg"
      viewBox={`0 0 ${width} ${WAVE_H}`}
      aria-hidden="true"
      focusable="false"
      sx={{
        display: 'block',
        width: '100%',
        maxWidth: 420,
        height: { xs: 72, md: 96 },
        mx: 'auto',
        '& rect': {
          transformBox: 'fill-box',
          transformOrigin: 'center',
          animation: `${pulse} 1.6s ease-in-out infinite`
        },
        '@media (prefers-reduced-motion: reduce)': { '& rect': { animation: 'none' } }
      }}
    >
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * (BAR_W + BAR_GAP)}
          y={(WAVE_H - h) / 2}
          width={BAR_W}
          height={h}
          rx={BAR_W / 2}
          fill="#fff"
          fillOpacity={h <= BAR_W ? 0.55 : 0.92}
          style={{ animationDelay: `${(i % 8) * -0.2}s` }}
        />
      ))}
    </Box>
  )
}

function ListensPill({ children }: { children: ReactNode }) {
  return (
    <Box
      component="strong"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        verticalAlign: 'middle',
        px: 1.75,
        py: 0.25,
        mx: 0.5,
        borderRadius: `${tokens.radius.chip}px`,
        background: 'rgba(255,255,255,.22)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 6px 18px rgba(20,50,140,.18)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        lineHeight: 1.3,
        fontWeight: 600,
        '& svg': { fontSize: '0.85em' }
      }}
    >
      <GraphicEq aria-hidden="true" />
      {children}
    </Box>
  )
}

function ListenCard() {
  return (
    <SoftPanel variant="blue" sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      <Typography component="h3" sx={cardTitle}>
        Toonwide <ListensPill>listens</ListensPill> to the conversation
      </Typography>
      <Typography sx={{ mt: 2, color: '#fff', maxWidth: 440 }}>
        It follows the call in real time, so it has the context when you need help.
      </Typography>

      <Box aria-hidden="true" sx={{ mt: 'auto', pt: { xs: 5, md: 7 }, textAlign: 'center', userSelect: 'none' }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.5,
            borderRadius: `${tokens.radius.chip}px`,
            background: 'rgba(15,30,80,.22)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '.3px'
          }}
        >
          <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f', boxShadow: '0 0 0 3px rgba(255,77,79,.3)' }} />
          Listening
        </Box>
        <Box
          sx={{
            fontFamily: fonts.sans,
            fontSize: { xs: 52, md: 64 },
            fontWeight: 600,
            letterSpacing: '-2px',
            lineHeight: 1.1,
            mt: 1,
            mb: { xs: 2, md: 3 },
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 4px 24px rgba(15,30,80,.25)'
          }}
        >
          00:10
        </Box>
        <Waveform />
        <Box
          sx={{
            mt: { xs: 3, md: 4 },
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pl: 2.25,
            pr: 0.75,
            py: 0.75,
            borderRadius: '16px',
            background: 'rgba(255,255,255,.14)',
            border: '1px solid rgba(255,255,255,.28)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            textAlign: 'left',
            // fades out towards the bottom of the card like a ghosted input
            maskImage: 'linear-gradient(180deg, #000 30%, rgba(0,0,0,.35))',
            WebkitMaskImage: 'linear-gradient(180deg, #000 30%, rgba(0,0,0,.35))'
          }}
        >
          <Box component="span" sx={{ flex: 1, fontSize: 15, color: 'rgba(255,255,255,.8)' }}>
            Ask about your call…
          </Box>
          <Box
            component="span"
            sx={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,.9)', color: tokens.primary, display: 'grid', placeItems: 'center' }}
          >
            <ArrowUpward sx={{ fontSize: 18 }} />
          </Box>
        </Box>
      </Box>
    </SoftPanel>
  )
}

function ShortcutCard() {
  return (
    <SoftPanel sx={{ height: '100%', p: { xs: 1.25, md: 1.5 } }}>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: 'linear-gradient(180deg, #ffffff, #eef0f6)',
          boxShadow: '0 1px 0 rgba(255,255,255,.9) inset, 0 12px 30px rgba(31,40,80,.08)',
          p: { xs: 3, md: 4.5 }
        }}
      >
        <Typography component="h3" sx={{ ...cardTitle, color: tokens.ink }}>
          Ask with{' '}
          <Box component="strong" sx={{ color: tokens.primary, fontWeight: 600 }}>
            one shortcut
          </Box>
        </Typography>
        <Typography sx={{ mt: 2, color: 'text.secondary', maxWidth: 440 }}>
          Press Ctrl + Alt + Space and Toonwide answers the latest question on the spot.
        </Typography>

        <Box aria-hidden="true" sx={{ mt: 'auto', pt: { xs: 4, md: 5 }, userSelect: 'none' }}>
          {/* a soft "call window" behind the glass panel */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: '18px',
              background:
                'radial-gradient(60% 80% at 20% 20%, rgba(255,255,255,.55), transparent 60%), linear-gradient(135deg, #b9cdfb 0%, #d6d2f4 50%, #f6d6c4 100%)',
              px: { xs: 1.5, md: 2.5 },
              pt: { xs: 5, md: 6 },
              pb: { xs: 1.5, md: 2.5 },
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.6)'
            }}
          >
            <Box sx={{ position: 'absolute', top: 14, left: 16, display: 'flex', gap: 0.75 }}>
              {[0, 1, 2].map((i) => (
                <Box key={i} component="span" sx={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,.75)' }} />
              ))}
            </Box>
            <Box sx={{ position: 'absolute', top: 12, right: 16, px: 1.25, py: 0.25, borderRadius: `${tokens.radius.chip}px`, background: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 600, color: tokens.muted }}>
              On a call
            </Box>
            <Box
              sx={{
                position: 'relative',
                background: tokens.glass,
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: `1px solid ${tokens.glassBorder}`,
                borderRadius: `${tokens.radius.card}px`,
                boxShadow: '0 24px 50px rgba(20,22,28,.28), inset 0 1px 0 rgba(255,255,255,.08)',
                color: '#fff',
                p: { xs: 2.25, md: 3 }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
                <Box sx={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.6)' }}>Latest question</Box>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.6,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: `${tokens.radius.chip}px`,
                    background: `linear-gradient(180deg, ${tokens.primaryLight}, ${tokens.primary})`,
                    boxShadow: `0 4px 14px ${tokens.glow}`,
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  <AutoAwesome sx={{ fontSize: 14 }} />
                  Answer
                </Box>
              </Box>
              <Box sx={{ fontSize: { xs: 15, md: 17 }, lineHeight: 1.55, color: 'rgba(255,255,255,.94)' }}>
                Toonwide hears the question, finds the context and writes a short answer you can say out loud.
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: { xs: 3, md: 4 } }}>
            <KeyCap>Ctrl</KeyCap>
            <Box component="span" sx={{ color: tokens.faint, fontWeight: 600 }}>+</Box>
            <KeyCap>Alt</KeyCap>
            <Box component="span" sx={{ color: tokens.faint, fontWeight: 600 }}>+</Box>
            <KeyCap>Space</KeyCap>
          </Box>
        </Box>
      </Box>
    </SoftPanel>
  )
}

export function HowItHelps() {
  return (
    <Box component="section" id="how" aria-labelledby="how-title" sx={{ scrollMarginTop: '24px' }}>
      <Box className="container" sx={{ py: { xs: 10, md: 16 } }}>
        <SectionHeading titleId="how-title" title="How Toonwide helps during a call" />
        <div className="row g-4">
          <div className="col-lg-6">
            <ListenCard />
          </div>
          <div className="col-lg-6">
            <ShortcutCard />
          </div>
        </div>
      </Box>
    </Box>
  )
}
