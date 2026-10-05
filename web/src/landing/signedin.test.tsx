import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'

class FakeIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderPage(meStatus: number) {
  const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => new Response('{}', { status: meStatus }))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  render(<MemoryRouter><LandingPage /></MemoryRouter>)
  return fetchMock
}

test('signed in: the floating button goes to the dashboard, and the session is checked once', async () => {
  const fetchMock = renderPage(200)
  const floating = screen.getByTestId('floating-cta')
  await waitFor(() => expect(within(floating).getByText('Dashboard').closest('a')?.getAttribute('href')).toBe('/dashboard'))
  expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Dashboard' })).toBeTruthy()
  expect(fetchMock.mock.calls.filter(([url]) => String(url) === '/api/auth/me')).toHaveLength(1)
})

// the floating button is visibility:hidden until the hero scrolls away, so it has no accessible name yet: find it by text
test('signed out: the floating button offers sign-up', async () => {
  const fetchMock = renderPage(401)
  await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  const floating = screen.getByTestId('floating-cta')
  expect(within(floating).getByText('Get started').closest('a')?.getAttribute('href')).toBe('/signup')
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
