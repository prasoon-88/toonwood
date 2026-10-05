import { Box } from '@mui/material'
import { fonts, tokens } from './tokens'

export function Logo({ color = tokens.ink }: { color?: string }) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color }}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" focusable="false">
        <circle cx="13" cy="13" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="13" cy="13" r="5.5" fill="currentColor" />
      </svg>
      <Box component="span" sx={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px' }}>
        Toonwide
      </Box>
    </Box>
  )
}
