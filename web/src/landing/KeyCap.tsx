import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { fonts } from './tokens'

export function KeyCap({ children, variant = 'flat' }: { children: ReactNode; variant?: 'flat' | 'float' }) {
  if (variant === 'float') {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: { xs: 88, md: 120 },
          height: { xs: 88, md: 120 },
          borderRadius: '28px',
          background: 'linear-gradient(145deg, #ffffff, #eef1f8)',
          boxShadow:
            '0 30px 60px rgba(31,40,80,.22), 0 10px 20px rgba(31,40,80,.12), inset 0 -6px 0 #d5daea, inset 0 2px 0 #fff',
          transform: 'rotate(-8deg)',
          fontFamily: fonts.sans,
          fontWeight: 600,
          fontSize: { xs: 22, md: 28 },
          color: '#0f1115'
        }}
      >
        {children}
      </Box>
    )
  }
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        minWidth: 40,
        px: 1.75,
        background: '#fff',
        border: '1px solid #dfe2ea',
        borderRadius: '10px',
        boxShadow: '0 2px 0 #cfd3de',
        fontFamily: fonts.sans,
        fontSize: 14,
        fontWeight: 600,
        color: '#0f1115'
      }}
    >
      {children}
    </Box>
  )
}
