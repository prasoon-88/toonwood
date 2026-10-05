import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { GlowButton } from './GlowButton'
import { SectionHeading } from './SectionHeading'
import { Logo } from './Logo'
import { App } from '../App'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('GlowButton with `to` is a link', () => {
  render(<MemoryRouter><GlowButton to="/signup">Get started free</GlowButton></MemoryRouter>)
  expect(screen.getByRole('link', { name: 'Get started free' }).getAttribute('href')).toBe('/signup')
})

test('SectionHeading renders an h2 with an id and subtitle', () => {
  render(<SectionHeading id="faq" title="Frequently asked questions" subtitle="Answers" />)
  const h2 = screen.getByRole('heading', { level: 2, name: 'Frequently asked questions' })
  expect(h2.closest('[id="faq"]')).toBeTruthy()
  expect(screen.getByText('Answers')).toBeTruthy()
})

test('Logo shows the Toonwide name', () => {
  render(<Logo />)
  expect(screen.getByText('Toonwide')).toBeTruthy()
})

test('/ renders the landing page instead of redirecting', () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  window.history.pushState({}, '', '/')
  render(<App />)
  expect(window.location.pathname).toBe('/')
  expect(document.querySelector('[data-page="landing"]')).toBeTruthy()
})
