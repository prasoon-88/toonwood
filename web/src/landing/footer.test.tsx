import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('final CTA, footer links and copyright', () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  render(<MemoryRouter><LandingPage /></MemoryRouter>)
  expect(screen.getByText('AI that helps during the call, not after.')).toBeTruthy()
  const footer = screen.getByRole('contentinfo')
  expect(within(footer).getByRole('link', { name: 'Sign up' }).getAttribute('href')).toBe('/signup')
  expect(within(footer).getByRole('link', { name: 'FAQ' }).getAttribute('href')).toBe('#faq')
  expect(within(footer).getByText(`© ${new Date().getFullYear()} Toonwide. All rights reserved.`)).toBeTruthy()
})

test('the page never uses evasion language', () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
  render(<MemoryRouter><LandingPage /></MemoryRouter>)
  expect(document.body.textContent).not.toMatch(/undetectable|cheat/i)
})
