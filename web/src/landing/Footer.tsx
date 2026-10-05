import { Box, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { Logo } from './Logo'
import { tokens } from './tokens'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how' },
      { label: 'Features', href: '#features' },
      { label: 'FAQ', href: '#faq' }
    ]
  },
  {
    title: 'Account',
    links: [
      { label: 'Log in', to: '/login' },
      { label: 'Sign up', to: '/signup' }
    ]
  }
]

const linkSx = {
  color: tokens.muted,
  textDecoration: 'none',
  fontSize: 15,
  borderRadius: '4px',
  transition: 'color .15s ease',
  '&:hover': { color: tokens.ink },
  '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: 3 },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
} as const

export function Footer() {
  return (
    <Box component="footer" sx={{ pb: 5 }}>
      <Box className="container">
        <div className="row g-4">
          <div className="col-md-6">
            <Box
              component={RouterLink}
              to="/"
              aria-label="Toonwide home"
              sx={{ display: 'inline-flex', textDecoration: 'none', borderRadius: '8px', '&:focus-visible': { outline: `2px solid ${tokens.primary}`, outlineOffset: 4 } }}
            >
              <Logo />
            </Box>
          </div>
          {columns.map((col) => (
            <div key={col.title} className="col-6 col-md-3">
              <Typography id={`footer-${col.title.toLowerCase()}`} sx={{ fontSize: 13, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: tokens.muted, mb: 2 }}>
                {col.title}
              </Typography>
              <Box component="ul" aria-labelledby={`footer-${col.title.toLowerCase()}`} sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1.5 }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {'to' in l ? (
                      <Box component={RouterLink} to={l.to} sx={linkSx}>
                        {l.label}
                      </Box>
                    ) : (
                      <Box component="a" href={l.href} sx={linkSx}>
                        {l.label}
                      </Box>
                    )}
                  </li>
                ))}
              </Box>
            </div>
          ))}
        </div>
        <Box sx={{ mt: { xs: 6, md: 8 }, pt: 3, borderTop: '1px solid rgba(15,17,21,.08)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            {`© ${new Date().getFullYear()} Toonwide. All rights reserved.`}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
