import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'
import { tokens } from './tokens'

type Props = { variant?: 'soft' | 'blue'; sx?: SxProps<Theme>; children: ReactNode }

export function SoftPanel({ variant = 'soft', sx, children }: Props) {
  return (
    <Box
      sx={[
        {
          background: variant === 'blue' ? tokens.blue : tokens.soft,
          borderRadius: `${tokens.radius.panel}px`,
          p: { xs: 3, md: 5 },
          overflow: 'hidden',
          position: 'relative',
          boxShadow:
            variant === 'blue'
              ? 'inset 0 1px 0 rgba(255,255,255,.35), 0 20px 50px rgba(79,134,247,.25)'
              : 'inset 0 1px 0 rgba(255,255,255,.7), 0 20px 50px rgba(15,17,21,.06)'
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : [])
      ]}
    >
      {children}
    </Box>
  )
}
