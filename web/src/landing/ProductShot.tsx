import { Box } from '@mui/material'
import AutoAwesome from '@mui/icons-material/AutoAwesome'
import CropFree from '@mui/icons-material/CropFree'
import ContentCopy from '@mui/icons-material/ContentCopy'
import { fonts, tokens } from './tokens'

const tiles = [
  { name: 'Alex', bg: 'linear-gradient(135deg,#2b3a55,#4b5f86)', skin: '#e9c3a6', hair: '#2a1d1a', shirt: '#1f2a40' },
  { name: 'You', bg: 'linear-gradient(135deg,#4a3b5c,#7a6597)', skin: '#c99677', hair: '#3a2a22', shirt: '#2e2440' }
]

/** Simple head-and-shoulders silhouette for a call tile. */
function Person({ skin, hair, shirt }: { skin: string; hair: string; shirt: string }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" focusable="false">
      <path d="M30 200c4-44 34-68 70-68s66 24 70 68z" fill={shirt} />
      <rect x="88" y="112" width="24" height="26" rx="10" fill={skin} />
      <ellipse cx="100" cy="86" rx="32" ry="38" fill={skin} />
      <path d="M67 84c-2-30 16-46 35-46 22 0 36 16 33 44-6-14-18-22-34-22-14 0-26 9-34 24z" fill={hair} />
    </svg>
  )
}

function Dot({ color }: { color: string }) {
  return <Box component="span" sx={{ width: 11, height: 11, borderRadius: '50%', background: color, display: 'block' }} />
}

const action = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  px: { xs: 1, md: 1.5 },
  py: 0.75,
  borderRadius: '8px',
  fontSize: { xs: 11.5, md: 13 },
  fontWeight: 500,
  color: 'rgba(255,255,255,.78)',
  whiteSpace: 'nowrap',
  '& svg': { fontSize: { xs: 14, md: 16 } }
} as const

/** Decorative screenshot of Toonwide answering on a video call. */
export function ProductShot() {
  return (
    <Box
      data-testid="product-shot"
      aria-hidden="true"
      sx={{
        position: 'relative',
        zIndex: 2,
        maxWidth: 1120,
        mx: 'auto',
        background: tokens.dusk,
        borderRadius: '24px 24px 0 0',
        px: { xs: 1.5, sm: 4, md: 7 },
        pt: { xs: 2, md: 3 },
        boxShadow: '0 -10px 60px rgba(31,40,80,.18), inset 0 1px 0 rgba(255,255,255,.45)',
        userSelect: 'none',
        fontFamily: fonts.sans
      }}
    >
      {/* Toonwide control pill */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 1.5, md: 2.5 } }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.25,
            pl: 1.25,
            pr: 1,
            py: 0.75,
            borderRadius: `${tokens.radius.chip}px`,
            background: 'rgba(20,22,28,.88)',
            border: `1px solid ${tokens.glassBorder}`,
            boxShadow: '0 8px 24px rgba(20,22,28,.28)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500
          }}
        >
          <svg width="18" height="18" viewBox="0 0 26 26" focusable="false">
            <circle cx="13" cy="13" r="11.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <circle cx="13" cy="13" r="5.5" fill="currentColor" />
          </svg>
          <Box component="span" sx={{ width: '1px', height: 14, background: 'rgba(255,255,255,.18)' }} />
          <Box component="span" sx={{ color: 'rgba(255,255,255,.85)' }}>Hide</Box>
          <Box
            component="span"
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.1)',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <Box component="span" sx={{ width: 9, height: 9, borderRadius: '2px', background: '#ff5f57' }} />
          </Box>
        </Box>
      </Box>

      {/* App window */}
      <Box
        sx={{
          background: '#14161c',
          borderRadius: '14px 14px 0 0',
          boxShadow: '0 30px 80px rgba(20,22,28,.45), 0 0 0 1px rgba(255,255,255,.06)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ height: 38, display: 'flex', alignItems: 'center', gap: 1, px: 2, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <Dot color="#ff5f57" />
          <Dot color="#febc2e" />
          <Dot color="#28c840" />
          <Box sx={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.4)', mr: '45px' }}>
            Weekly sync · 24:18
          </Box>
        </Box>

        <Box sx={{ position: 'relative', p: { xs: 1, md: 1.5 }, pb: 0 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: { xs: 1, md: 1.5 },
              height: { xs: 360, sm: 400, md: 470 }
            }}
          >
            {tiles.map((t) => (
              <Box
                key={t.name}
                sx={{
                  position: 'relative',
                  background: t.bg,
                  borderRadius: { xs: '10px 10px 0 0', md: '12px 12px 0 0' },
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 35%, rgba(255,255,255,.14), transparent 60%)' }} />
                <Box sx={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', width: { xs: '92%', md: '62%' }, height: '72%', opacity: 0.95 }}>
                  <Person skin={t.skin} hair={t.hair} shirt={t.shirt} />
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    left: { xs: 8, md: 14 },
                    top: { xs: 8, md: 14 },
                    px: 1,
                    py: 0.4,
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,.35)',
                    color: 'rgba(255,255,255,.9)',
                    fontSize: { xs: 10.5, md: 12 },
                    fontWeight: 500
                  }}
                >
                  {t.name}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Toonwide glass answer panel */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: { xs: 52, md: 64 },
              transform: 'translateX(-50%)',
              width: { xs: 'calc(100% - 20px)', sm: 460, md: 540 },
              background: tokens.glass,
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: `1px solid ${tokens.glassBorder}`,
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08)',
              color: '#fff',
              p: { xs: 1.75, md: 2.5 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: { xs: 1.5, md: 2 } }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: { xs: 11.5, md: 13 }, color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>
                <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', background: '#28c840', boxShadow: '0 0 8px #28c840' }} />
                AI · 12:41 left
              </Box>
              <Box
                sx={{
                  px: { xs: 1.25, md: 1.5 },
                  py: 0.5,
                  borderRadius: `${tokens.radius.chip}px`,
                  background: `linear-gradient(180deg, ${tokens.primaryLight}, ${tokens.primary})`,
                  boxShadow: `0 4px 14px ${tokens.glow}`,
                  fontSize: { xs: 11.5, md: 13 },
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                What should I say?
              </Box>
            </Box>
            <Box sx={{ fontSize: { xs: 14, md: 17 }, lineHeight: 1.55, color: 'rgba(255,255,255,.94)', mb: { xs: 1.5, md: 2.25 } }}>
              “I'd start with the trade-off: caching cuts latency, but we need a clear invalidation rule…”
            </Box>
            <Box sx={{ display: 'flex', gap: { xs: 0.25, md: 0.75 }, pt: { xs: 1.25, md: 1.5 }, borderTop: '1px solid rgba(255,255,255,.08)', mx: { xs: -0.5, md: -1 } }}>
              <Box sx={{ ...action, color: '#fff', background: 'rgba(255,255,255,.08)' }}>
                <AutoAwesome sx={{ color: tokens.primaryLight }} /> Answer now
              </Box>
              <Box sx={action}>
                <CropFree /> Screenshot
              </Box>
              <Box sx={action}>
                <ContentCopy /> Copy
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
