import type { ReactNode } from 'react'
import { Button } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { tokens } from './tokens'

type Props = {
  to?: string
  href?: string
  variant?: 'primary' | 'dark' | 'light'
  size?: 'md' | 'lg'
  children: ReactNode
}

const styles = {
  primary: {
    color: '#fff',
    background: tokens.primaryGradient,
    boxShadow: `0 10px 30px ${tokens.glow}, inset 0 1px 0 rgba(255,255,255,.35)`,
    hoverShadow: `0 14px 38px ${tokens.glow}, inset 0 1px 0 rgba(255,255,255,.45)`
  },
  dark: {
    color: '#fff',
    background: `linear-gradient(180deg, #2a2d34, ${tokens.ink})`,
    boxShadow: '0 10px 28px rgba(15,17,21,.35), inset 0 1px 0 rgba(255,255,255,.22), inset 0 0 0 1px rgba(255,255,255,.08)',
    hoverShadow: '0 14px 34px rgba(15,17,21,.45), inset 0 1px 0 rgba(255,255,255,.3), inset 0 0 0 1px rgba(255,255,255,.12)'
  },
  light: {
    color: tokens.primary,
    background: '#fff',
    boxShadow: '0 4px 14px rgba(15,17,21,.12)',
    hoverShadow: '0 8px 22px rgba(15,17,21,.18)'
  }
} as const

export function GlowButton({ to, href, variant = 'primary', size = 'md', children }: Props) {
  const s = styles[variant]
  const sx = {
    color: s.color,
    background: s.background,
    boxShadow: s.boxShadow,
    borderRadius: `${tokens.radius.button}px`,
    padding: size === 'lg' ? '14px 28px' : '12px 24px',
    fontSize: size === 'lg' ? 17 : 15,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    transition: 'transform .18s ease, box-shadow .18s ease, filter .18s ease',
    '&:hover': {
      color: s.color,
      background: s.background,
      boxShadow: s.hoverShadow,
      filter: 'brightness(1.04)',
      transform: 'translateY(-1px)',
      '@media (prefers-reduced-motion: reduce)': { transform: 'none' }
    },
    '&:active': { transform: 'translateY(0)' },
    // two-tone ring (white inside, ink outside) stays visible on the sky, on white and on the dark button
    '&:focus-visible, &.Mui-focusVisible': {
      outline: '2px solid #fff',
      outlineOffset: 0,
      boxShadow: `0 0 0 5px ${tokens.ink}, ${s.boxShadow}`
    },
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
  } as const
  if (to) {
    return (
      <Button component={RouterLink} to={to} disableElevation sx={sx}>
        {children}
      </Button>
    )
  }
  return (
    <Button href={href} disableElevation sx={sx}>
      {children}
    </Button>
  )
}
