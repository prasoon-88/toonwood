import { Box } from '@mui/material'
import { SectionHeading } from './SectionHeading'
import { SoftPanel } from './SoftPanel'
import { fonts, tokens } from './tokens'
import { Dot } from './Dot'

const code = `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>()
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i]
    if (seen.has(need)) return [seen.get(need)!, i]
    seen.set(nums[i], i)
  }
  return []
}`

const palette = {
  keyword: '#c792ea',
  type: '#ffcb6b',
  number: '#f78c6c',
  fn: '#82aaff',
  plain: '#e6ebf5',
  punct: '#8f9bb3'
}

const KEYWORDS = new Set(['function', 'const', 'let', 'for', 'if', 'return', 'new'])
const TYPES = new Set(['number', 'Map'])

/** Tiny highlighter for the sample above (keywords, types, numbers, calls). */
function highlight(line: string) {
  const parts = line.match(/\s+|[A-Za-z_]\w*|\d+|[^\sA-Za-z_\d]+/g) ?? []
  return parts.map((p, i) => {
    let color: string = palette.plain
    if (KEYWORDS.has(p)) color = palette.keyword
    else if (TYPES.has(p)) color = palette.type
    else if (/^\d+$/.test(p)) color = palette.number
    else if (/^[A-Za-z_]/.test(p) && parts[i + 1]?.startsWith('(')) color = palette.fn
    else if (!/^[\sA-Za-z_]/.test(p)) color = palette.punct
    return (
      <span key={i} style={{ color }}>
        {p}
      </span>
    )
  })
}

function ProblemCard() {
  return (
    <Box sx={{ position: 'relative', height: '100%', p: { xs: 0.75, md: 1 } }}>
      {/* dashed capture frame: what Ctrl + Alt + S reads */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          border: `1.5px dashed ${tokens.primaryLight}`,
          borderRadius: '18px',
          background: 'rgba(63,140,255,.04)',
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            width: 10,
            height: 10,
            borderRadius: '3px',
            background: '#fff',
            border: `2px solid ${tokens.primary}`
          },
          '&::before': { top: -6, left: -6 },
          '&::after': { bottom: -6, right: -6 }
        }}
      />
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          borderRadius: '14px',
          background: '#f6f7fb',
          border: `1px solid ${tokens.divider}`,
          p: { xs: 2.5, md: 3 }
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Box component="span" sx={{ px: 1.25, py: 0.25, borderRadius: `${tokens.radius.chip}px`, background: '#e9eefc', color: tokens.primary, fontSize: 12, fontWeight: 600 }}>
            On screen
          </Box>
        </Box>
        <Box sx={{ fontSize: { xs: 19, md: 21 }, fontWeight: 600, lineHeight: 1.3, color: tokens.ink, letterSpacing: '-0.3px' }}>
          Two Sum, find indices that add up to a target
        </Box>
        <Box sx={{ mt: 2.5, display: 'grid', gap: 1 }}>
          {[100, 92, 64].map((w) => (
            <Box key={w} sx={{ height: 8, width: `${w}%`, borderRadius: 4, background: '#e2e5ee' }} />
          ))}
        </Box>
        <Box sx={{ mt: 3, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', color: tokens.muted, textTransform: 'uppercase' }}>
          Example
        </Box>
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: '10px',
            background: '#fff',
            border: `1px solid ${tokens.divider}`,
            fontFamily: fonts.mono,
            fontSize: 13,
            lineHeight: 1.6,
            color: tokens.ink,
            overflowWrap: 'anywhere'
          }}
        >
          nums = [2, 7, 11, 15], target = 9 → [0, 1]
        </Box>
      </Box>
    </Box>
  )
}

function CodeBlock() {
  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Box
        sx={{
          height: '100%',
          borderRadius: '16px',
          background: 'linear-gradient(180deg, #1a1d26, #12141a)',
          boxShadow: '0 20px 40px rgba(20,22,28,.22), inset 0 1px 0 rgba(255,255,255,.06)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, height: 40, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <Box component="span" sx={{ px: 1.25, py: 0.4, borderRadius: '6px', background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.75)', fontSize: 12, fontFamily: fonts.mono }}>
            solution.ts
          </Box>
        </Box>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: { xs: 2, md: 3 },
            fontFamily: fonts.mono,
            fontSize: { xs: 12, md: 14 },
            lineHeight: 1.75,
            overflowX: 'auto',
            counterReset: 'line'
          }}
        >
          {code.split('\n').map((line, i) => (
            <Box key={i} component="span" sx={{ display: 'block', whiteSpace: 'pre' }}>
              <Box component="span" sx={{ display: 'inline-block', width: '2.2em', color: 'rgba(255,255,255,.22)', userSelect: 'none' }}>
                {i + 1}
              </Box>
              {highlight(line)}
            </Box>
          ))}
        </Box>
      </Box>

      {/* floating shortcut badge */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: -16, md: -20 },
          right: { xs: 12, md: 24 },
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          px: 1.75,
          py: 1,
          borderRadius: '14px',
          background: tokens.primaryGradient,
          color: '#fff',
          fontSize: { xs: 13, md: 14 },
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: `0 12px 30px ${tokens.glow}, inset 0 1px 0 rgba(255,255,255,.35)`,
          transform: 'rotate(2deg)'
        }}
      >
        <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 3px rgba(255,255,255,.3)' }} />
        Ctrl + Alt + S
      </Box>
    </Box>
  )
}

export function ScreenAnswers() {
  return (
    <Box component="section" aria-labelledby="screen-title">
      <Box className="container" sx={{ py: { xs: 10, md: 16 }, pt: { xs: 0, md: 0 } }}>
        <SectionHeading
          titleId="screen-title"
          title="Answers from your screen"
          subtitle="Press Ctrl + Alt + S on a question, a task or code. Toonwide reads it and answers directly."
        />
        <SoftPanel sx={{ p: { xs: 1.5, sm: 3, md: 7 } }}>
          <Box
            aria-hidden="true"
            sx={{
              background: '#fff',
              borderRadius: { xs: '18px', md: '22px' },
              boxShadow: '0 30px 60px rgba(31,40,80,.14), 0 0 0 1px rgba(15,17,21,.04)',
              overflow: 'hidden',
              userSelect: 'none'
            }}
          >
            <Box sx={{ height: 40, display: 'flex', alignItems: 'center', gap: 1, px: 2, borderBottom: '1px solid #eef0f4' }}>
              <Dot color="#ff5f57" size={10} />
              <Dot color="#febc2e" size={10} />
              <Dot color="#28c840" size={10} />
            </Box>
            <Box sx={{ p: { xs: 2, md: 3.5 }, pt: { xs: 3, md: 4.5 } }}>
              <div className="row g-4 g-md-4">
                <div className="col-md-5">
                  <ProblemCard />
                </div>
                <div className="col-md-7">
                  <CodeBlock />
                </div>
              </div>
            </Box>
          </Box>
        </SoftPanel>
      </Box>
    </Box>
  )
}
