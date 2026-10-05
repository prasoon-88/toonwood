import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderPage(meStatus: number) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ user: { email: 'a@b.c' } }), { status: meStatus })))
  return render(<MemoryRouter><LandingPage /></MemoryRouter>)
}

test('hero has the single h1 and the sign-up call to action', async () => {
  renderPage(401)
  const h1s = screen.getAllByRole('heading', { level: 1 })
  expect(h1s).toHaveLength(1)
  expect(h1s[0].textContent).toBe('Real-time answers, right on your call')
  // The final CTA (Task 5) repeats this button, so take the first one (the hero's).
  expect(screen.getAllByRole('link', { name: 'Get started free' })[0].getAttribute('href')).toBe('/signup')
  expect(screen.getByText('60 free minutes · Windows')).toBeTruthy()
})

test('logged-out nav shows Log in and Get started', async () => {
  renderPage(401)
  const nav = screen.getByRole('navigation')
  expect((await within(nav).findByRole('link', { name: 'Log in' })).getAttribute('href')).toBe('/login')
  expect(within(nav).getByRole('link', { name: 'Get started' }).getAttribute('href')).toBe('/signup')
})

test('logged-in nav shows Dashboard instead', async () => {
  renderPage(200)
  const nav = screen.getByRole('navigation')
  expect((await within(nav).findByRole('link', { name: 'Dashboard' })).getAttribute('href')).toBe('/dashboard')
  expect(within(nav).queryByRole('link', { name: 'Log in' })).toBeNull()
})

test('the product shot is decorative and shows the answer panel', () => {
  renderPage(401)
  expect(screen.getByText('What should I say?')).toBeTruthy()
  expect(document.querySelector('[data-testid="product-shot"]')?.getAttribute('aria-hidden')).toBe('true')
})
