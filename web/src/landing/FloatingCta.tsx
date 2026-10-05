import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { GlowButton } from './GlowButton'
import { useSignedIn } from './useSignedIn'

/**
 * Fixed call to action that fades in once the hero has scrolled out of view (the `#hero-end`
 * sentinel at the bottom of the hero is above the viewport). Top-right from `md`; bottom-centre on
 * phones so it never covers a section heading. Follows the nav: "Dashboard" when signed in.
 * Renders nothing where IntersectionObserver is unavailable (e.g. jsdom).
 */
export function FloatingCta() {
  const supported = typeof window !== 'undefined' && 'IntersectionObserver' in window
  const [visible, setVisible] = useState(false)
  const signedIn = useSignedIn()

  useEffect(() => {
    if (!supported) return
    const sentinel = document.getElementById('hero-end')
    if (!sentinel) return
    // The root box is stretched far below the viewport, so the sentinel only stops intersecting once it is
    // above the top edge. This also works for jumps (anchor links, reloads mid-page) that skip the viewport.
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: '0px 0px 100000px 0px'
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [supported])

  if (!supported) return null

  return (
    <Box
      data-testid="floating-cta"
      sx={{
        position: 'fixed',
        zIndex: 1100,
        // phones: a centred bar at the bottom; the wrapper spans the width but only the button takes clicks
        left: { xs: 0, md: 'auto' },
        right: 16,
        bottom: { xs: 16, md: 'auto' },
        top: { xs: 'auto', md: 16 },
        display: 'flex',
        justifyContent: { xs: 'center', md: 'flex-end' },
        pl: { xs: 2, md: 0 },
        pointerEvents: 'none',
        '& > *': { pointerEvents: 'auto' },
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
        transform: visible ? 'translateY(0)' : { xs: 'translateY(8px)', md: 'translateY(-8px)' },
        transition: 'opacity .25s ease, transform .25s ease, visibility .25s',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', transform: 'none' }
      }}
    >
      {signedIn ? <GlowButton to="/dashboard">Dashboard</GlowButton> : <GlowButton to="/signup">Get started</GlowButton>}
    </Box>
  )
}
