import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Verify } from './Verify'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('does not verify until the button is clicked', async () => {
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
    new Response(JSON.stringify(url.endsWith('/csrf') ? { csrfToken: 't' } : { ok: true }), { status: 200 })
  )
  vi.stubGlobal('fetch', fetchMock)
  render(<MemoryRouter initialEntries={['/verify?token=abc']}><Verify /></MemoryRouter>)

  expect(screen.getByText('Confirm your email')).toBeTruthy()
  expect(screen.getByText('Click the button to verify your email address.')).toBeTruthy()
  expect(fetchMock).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Confirm my email' }))
  expect(await screen.findByText('Email verified')).toBeTruthy()

  const post = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/verify'))
  expect(post).toBeTruthy()
  expect(JSON.parse(String(post![1]!.body))).toEqual({ token: 'abc' })
})
