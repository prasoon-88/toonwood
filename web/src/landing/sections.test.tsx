import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderPage() {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  return render(<MemoryRouter><LandingPage /></MemoryRouter>)
}

test('how-it-helps section has its anchor, heading and two cards', () => {
  renderPage()
  const h2 = screen.getByRole('heading', { level: 2, name: 'How Toonwide helps during a call' })
  expect(h2.closest('#how')).toBeTruthy()
  expect(screen.getByText('00:10')).toBeTruthy()
  expect(screen.getAllByText('Space').length).toBeGreaterThan(0)
})

test('screen answers section explains Ctrl + Alt + S', () => {
  renderPage()
  expect(screen.getByRole('heading', { level: 2, name: 'Answers from your screen' })).toBeTruthy()
  expect(screen.getByText(/Two Sum/)).toBeTruthy()
})
