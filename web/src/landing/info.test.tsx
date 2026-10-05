import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
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

test('features section has its anchor and three features', () => {
  renderPage()
  expect(screen.getByRole('heading', { level: 2, name: 'Built for real calls' }).closest('#features')).toBeTruthy()
  expect(screen.getByText('Hidden from screen share.')).toBeTruthy()
  expect(screen.getByText('Rooms for your team.')).toBeTruthy()
  expect(screen.getByText('Your context, your answers.')).toBeTruthy()
})

test('stats show only true numbers', () => {
  renderPage()
  for (const value of ['60 min', '0 bots', '1 shortcut']) expect(screen.getByText(value)).toBeTruthy()
})

test('FAQ answers expand on click', () => {
  renderPage()
  expect(screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' }).closest('#faq')).toBeTruthy()
  const question = screen.getByRole('button', { name: 'Is Toonwide free?' })
  expect(question.getAttribute('aria-expanded')).toBe('false')
  fireEvent.click(question)
  expect(question.getAttribute('aria-expanded')).toBe('true')
  expect(screen.getByText(/Every new account gets 60 free minutes, valid for 7 days\. Larger minute packs/)).toBeTruthy()
})

test('stats have their own h2 so the stat titles do not nest under the features heading', () => {
  renderPage()
  const h2 = screen.getByRole('heading', { level: 2, name: 'Toonwide in numbers' })
  const section = h2.closest('section')!
  expect(section.getAttribute('aria-labelledby')).toBe(h2.id)
  expect(within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
    'Free to start',
    'Nothing joins your meeting',
    'Answers from your screen'
  ])
})
