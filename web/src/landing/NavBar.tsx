import { Box } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { GlowButton } from './GlowButton'
import { Logo } from './Logo'
import { useSignedIn } from './useSignedIn'

const anchors = [
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' }
]

const linkSx = {
  color: '#fff',
  textDecoration: 'none',
  fontSize: 15,
  whiteSpace: 'nowrap',
  fontWeight: 500,
  borderRadius: '8px',
  px: 1.5,
  py: 1,
  transition: 'color .15s ease, background-color .15s ease',
  '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,.12)' },
  '&:focus-visible': { outline: '2px solid #fff', outlineOffset: 2 },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
} as const

/** Top bar over the hero. Swaps Log in / Get started for Dashboard when a session exists. */
export function NavBar() {
  const loggedIn = useSignedIn()

  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
    >
      <Box
        className="container"
        sx={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
      >
        <Box sx={{ flex: 1, display: 'flex' }}>
          <Box
            component={RouterLink}
            to="/"
            aria-label="Toonwide home"
            sx={{ textDecoration: 'none', display: 'inline-flex', borderRadius: '8px', '&:focus-visible': { outline: '2px solid #fff', outlineOffset: 4 } }}
          >
            <Logo color="#fff" />
          </Box>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
          {anchors.map((a) => (
            <Box key={a.href} component="a" href={a.href} sx={linkSx}>
              {a.label}
            </Box>
          ))}
        </Box>

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
          {loggedIn ? (
            <GlowButton to="/dashboard" variant="light">
              Dashboard
            </GlowButton>
          ) : (
            <>
              <Box component={RouterLink} to="/login" sx={{ ...linkSx, display: { xs: 'none', sm: 'inline-block' } }}>
                Log in
              </Box>
              <GlowButton to="/signup" variant="light">
                Get started
              </GlowButton>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
