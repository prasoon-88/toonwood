import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'
import AutoAwesome from '@mui/icons-material/AutoAwesome'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { SectionHeading } from './SectionHeading'
import { SoftPanel } from './SoftPanel'
import { tokens } from './tokens'

const card = {
  background: '#fff',
  borderRadius: '16px',
  boxShadow: '0 18px 40px rgba(31,40,80,.12), 0 0 0 1px rgba(15,17,21,.04)'
} as const

const chip = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  px: 1.25,
  py: 0.4,
  borderRadius: `${tokens.radius.chip}px`,
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  '& svg': { fontSize: 14 }
} as const

/** Chips in the narrow split frame may wrap on small phones instead of clipping. */
const splitChip = { mb: 1.5, fontSize: { xs: 11, sm: 12 }, whiteSpace: { xs: 'normal', sm: 'nowrap' }, borderRadius: '10px' } as const

function Line({ w, dark = false }: { w: string; dark?: boolean }) {
  return <Box sx={{ height: 6, width: w, borderRadius: 3, background: dark ? 'rgba(255,255,255,.28)' : '#e4e7ef' }} />
}

/** Small dark Toonwide answer panel used inside the illustrations. */
function MiniPanel() {
  return (
    <Box sx={{ background: tokens.glass, borderRadius: '10px', p: 1.5, display: 'grid', gap: 1, border: `1px solid ${tokens.glassBorder}` }}>
      <Box sx={{ width: 40, height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${tokens.primaryLight}, ${tokens.primary})` }} />
      <Line w="100%" dark />
      <Line w="86%" dark />
      <Line w="58%" dark />
    </Box>
  )
}

function PrivacyArt() {
  return (
    <Box sx={{ ...card, width: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 }, minWidth: 0, borderRight: '1px solid #eef0f4' }}>
          <Box sx={{ ...chip, ...splitChip, background: '#e3f6ea', color: '#17803d' }}>
            <Visibility /> Visible to you
          </Box>
          <Box sx={{ borderRadius: '12px', p: 0.75, outline: '2px solid #34c46a', outlineOffset: 0, boxShadow: '0 0 0 5px rgba(52,196,106,.15)' }}>
            <MiniPanel />
          </Box>
        </Box>
        <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 }, minWidth: 0, background: '#f6f7fb' }}>
          <Box sx={{ ...chip, ...splitChip, background: '#eceef4', color: tokens.muted }}>
            <VisibilityOff /> Hidden from others
          </Box>
          <Box sx={{ borderRadius: '12px', p: 0.75, outline: '2px dashed #c4c9d6' }}>
            <Box sx={{ filter: 'blur(5px)', opacity: 0.45 }}>
              <MiniPanel />
            </Box>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, px: 2, py: 1.25, borderTop: '1px solid #eef0f4' }}>
        <Line w="30%" />
        <Line w="18%" />
      </Box>
    </Box>
  )
}

/** Deterministic QR-like grid with three finder squares. */
function QrGrid() {
  const n = 21
  const cells: ReactNode[] = []
  const finder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (finder(r, c)) continue
      const on = ((r * 7 + c * 13 + r * c) % 5) < 2
      if (on) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" rx=".2" />)
    }
  }
  const square = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width="6" height="6" rx="1.4" fill="none" stroke="currentColor" />
      <rect x={x + 2} y={y + 2} width="3" height="3" rx=".6" />
    </g>
  )
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width="100%" height="100%" fill="currentColor" focusable="false">
      {cells}
      {square(0, 0)}
      {square(n - 7, 0)}
      {square(0, n - 7)}
    </svg>
  )
}

function Bubble({ children, me = false }: { children: ReactNode; me?: boolean }) {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        maxWidth: '100%',
        borderRadius: me ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: me ? tokens.primaryGradient : '#fff',
        color: me ? '#fff' : tokens.ink,
        fontSize: { xs: 12, md: 13 },
        fontWeight: 500,
        lineHeight: 1.35,
        boxShadow: me ? `0 10px 24px ${tokens.glow}` : '0 10px 24px rgba(31,40,80,.12)',
        alignSelf: me ? 'flex-end' : 'flex-start'
      }}
    >
      {children}
    </Box>
  )
}

function RoomArt() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '44% 1fr', gap: { xs: 1.5, md: 2 }, alignItems: 'center', width: '100%' }}>
      <Box sx={{ ...card, p: { xs: 1.25, md: 1.75 }, textAlign: 'center' }}>
        <Box sx={{ color: tokens.ink, aspectRatio: '1', width: '100%' }}>
          <QrGrid />
        </Box>
        <Box sx={{ mt: 1, fontSize: 11, fontWeight: 600, color: tokens.muted, letterSpacing: '.3px' }}>Join room</Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Bubble>Can you ask about the timeline?</Bubble>
        <Bubble me>Sent to the room</Bubble>
      </Box>
    </Box>
  )
}

function ContextArt() {
  const chips = ['Resume', 'Role', 'Notes']
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', width: '100%', columnGap: 0 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.75, md: 2.25 } }}>
        {chips.map((c) => (
          <Box key={c} sx={{ ...chip, fontSize: 13, px: 1.5, py: 0.75, background: '#fff', color: tokens.ink, boxShadow: '0 8px 20px rgba(31,40,80,.10)' }}>
            {c}
          </Box>
        ))}
      </Box>
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Box component="svg" viewBox="0 0 40 120" preserveAspectRatio="none" focusable="false" sx={{ width: { xs: 24, md: 34 }, height: 120, flexShrink: 0, color: tokens.primaryLight }}>
          <path d="M0 20 C 22 20 18 60 40 60" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <path d="M0 60 L 40 60" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <path d="M0 100 C 22 100 18 60 40 60" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        </Box>
        <Box sx={{ ...card, flex: 1, minWidth: 0, p: { xs: 1.25, md: 1.75 } }}>
          <Box sx={{ ...chip, color: '#fff', background: tokens.primaryGradient, mb: 1.25 }}>
            <AutoAwesome /> Answer
          </Box>
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            <Line w="100%" />
            <Line w="88%" />
            <Line w="64%" />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

const features = [
  {
    lead: 'Hidden from screen share.',
    text: 'Private mode keeps Toonwide out of shared screens and recordings.',
    art: <PrivacyArt />
  },
  {
    lead: 'Rooms for your team.',
    text: 'Share a QR code and teammates can follow answers and send questions from their phone.',
    art: <RoomArt />
  },
  {
    lead: 'Your context, your answers.',
    text: 'Add your resume or notes and answers sound like you.',
    art: <ContextArt />
  }
]

const partners = ['Zoom', 'Microsoft Teams', 'Google Meet', 'Webex', 'Slack']

export function Features() {
  return (
    <Box component="section" id="features" aria-labelledby="features-title" sx={{ scrollMarginTop: '24px' }}>
      <Box className="container" sx={{ py: { xs: 10, md: 16 }, pt: { xs: 0, md: 0 } }}>
        <SectionHeading titleId="features-title" title="Built for real calls" subtitle="Private by default, shareable when you want." />
        <div className="row g-4 gy-5">
          {features.map((f) => (
            <div key={f.lead} className="col-md-6 col-lg-4">
              <SoftPanel
                sx={{
                  aspectRatio: '1 / 1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: { xs: 3, md: 3.5 }
                }}
              >
                <Box aria-hidden="true" sx={{ width: '100%', maxWidth: 360, userSelect: 'none', display: 'flex', justifyContent: 'center' }}>
                  {f.art}
                </Box>
              </SoftPanel>
              <Typography sx={{ mt: 3, fontSize: 20, lineHeight: 1.5, color: 'text.secondary', pr: { lg: 2 } }}>
                <Box component="strong" sx={{ color: tokens.ink, fontWeight: 600 }}>
                  {f.lead}
                </Box>{' '}
                {f.text}
              </Typography>
            </div>
          ))}
        </div>

        <Box sx={{ mt: { xs: 10, md: 14 }, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 13, letterSpacing: '3px', fontWeight: 600, color: tokens.muted, textTransform: 'uppercase' }}>
            Works alongside
          </Typography>
          <Box
            component="ul"
            sx={{
              listStyle: 'none',
              p: 0,
              m: 0,
              mt: 3,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              columnGap: { xs: 4, md: 8 },
              rowGap: 2
            }}
          >
            {partners.map((p) => (
              <Box component="li" key={p} sx={{ fontSize: { xs: 18, md: 22 }, fontWeight: 600, letterSpacing: '-0.3px', color: tokens.muted }}>
                {p}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
