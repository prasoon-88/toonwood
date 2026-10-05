import { Box, Typography } from '@mui/material'
import AutoAwesome from '@mui/icons-material/AutoAwesome'
import { SoftPanel } from './SoftPanel'
import { tokens } from './tokens'

const stats = [
  { value: '60 min', title: 'Free to start', text: 'Every new account gets 60 free minutes, valid for 7 days.' },
  { value: '0 bots', title: 'Nothing joins your meeting', text: 'Toonwide runs on your PC. No bot, no extra guest on the list.' },
  { value: '1 shortcut', title: 'Answers from your screen', text: 'Ctrl + Alt + S turns whatever is on screen into an answer.' }
]

const transcript = [
  { who: 'Them', time: '00:41', text: 'How would you roll this out to the rest of the team?' },
  { who: 'You', time: '00:58', text: 'I’d start with a small pilot and measure the results.' },
  { who: 'Them', time: '01:12', text: 'And what would you watch most closely?' }
]

function Transcript() {
  return (
    <SoftPanel sx={{ height: '100%', display: 'flex', alignItems: 'center', p: { xs: 2, md: 4 } }}>
      <Box
        aria-hidden="true"
        sx={{
          width: '100%',
          background: '#fff',
          borderRadius: `${tokens.radius.card}px`,
          boxShadow: '0 24px 50px rgba(31,40,80,.14), 0 0 0 1px rgba(15,17,21,.04)',
          p: { xs: 2.5, md: 3 },
          userSelect: 'none'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ fontSize: 14, fontWeight: 600, color: tokens.ink }}>Transcript</Box>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 12, fontWeight: 600, color: tokens.muted }}>
            <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', background: '#ff4d4f' }} />
            Live
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gap: 2 }}>
          {transcript.map((line) => (
            <Box key={line.time} sx={{ display: 'grid', gridTemplateColumns: '52px 1fr', columnGap: 1.5 }}>
              <Box>
                <Box sx={{ fontSize: 13, fontWeight: 600, color: line.who === 'You' ? tokens.primary : tokens.ink }}>{line.who}</Box>
                <Box sx={{ fontSize: 12, color: tokens.muted, fontVariantNumeric: 'tabular-nums' }}>{line.time}</Box>
              </Box>
              <Box sx={{ fontSize: 15, lineHeight: 1.5, color: tokens.ink }}>{line.text}</Box>
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            mt: 3,
            p: 1.75,
            borderRadius: '14px',
            background: tokens.glass,
            color: '#fff',
            display: 'flex',
            gap: 1.25,
            alignItems: 'flex-start'
          }}
        >
          <AutoAwesome sx={{ fontSize: 18, color: tokens.primaryLight, mt: '2px' }} />
          <Box sx={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,.92)' }}>
            Mention adoption and time saved, then offer a two-week check-in.
          </Box>
        </Box>
      </Box>
    </SoftPanel>
  )
}

export function Stats() {
  return (
    <Box component="section" aria-label="Toonwide in numbers">
      <Box className="container" sx={{ py: { xs: 10, md: 16 }, pt: { xs: 0, md: 0 } }}>
        <div className="row g-4 gx-lg-5 align-items-stretch">
          <div className="col-lg-5">
            <Transcript />
          </div>
          <div className="col-lg-7">
            <Box component="dl" sx={{ m: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {stats.map((s, i) => (
                <Box
                  key={s.value}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '300px 1fr', lg: '1fr' },
                    columnGap: 4,
                    rowGap: 1.5,
                    alignItems: 'baseline',
                    py: { xs: 3.5, md: 4.5 },
                    borderTop: i === 0 ? 'none' : '1px solid #e6e8ee'
                  }}
                >
                  <Box
                    component="dt"
                    sx={{ fontSize: { xs: 52, md: 64 }, fontWeight: 400, lineHeight: 1, letterSpacing: '-2px', color: tokens.ink, whiteSpace: 'nowrap' }}
                  >
                    {s.value}
                  </Box>
                  <Box component="dd" sx={{ m: 0 }}>
                    <Typography component="h3" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: '-0.6px', lineHeight: 1.2, color: tokens.ink }}>
                      {s.title}
                    </Typography>
                    <Typography sx={{ mt: 1, fontSize: 18, color: 'text.secondary' }}>{s.text}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </div>
        </div>
      </Box>
    </Box>
  )
}
