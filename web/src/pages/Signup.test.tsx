import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Signup } from './Signup'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

test('shows an error and does not call the server when passwords differ', () => {
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  render(<MemoryRouter><Signup /></MemoryRouter>)
  fill('Email', 'a@example.com')
  fill('Password', 'a good long passphrase')
  fill('Confirm password', 'a different passphrase')
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
  expect(screen.getByRole('alert').textContent).toBe('Passwords do not match')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('shows "check your email" after a successful sign-up', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) =>
    new Response(JSON.stringify(url.endsWith('/csrf') ? { csrfToken: 't' } : { ok: true }), { status: url.endsWith('/csrf') ? 200 : 201 })
  ))
  render(<MemoryRouter><Signup /></MemoryRouter>)
  fill('Email', 'a@example.com')
  fill('Password', 'a good long passphrase')
  fill('Confirm password', 'a good long passphrase')
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
  expect(await screen.findByText('Check your email')).toBeTruthy()
})
