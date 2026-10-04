import { expect, test } from '@playwright/test'
import { readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const outbox = fileURLToPath(new URL('./.outbox.jsonl', import.meta.url))

test.beforeAll(() => rm(outbox, { force: true }))

async function lastLinkTo(email: string): Promise<string> {
  const mails = (await readFile(outbox, 'utf8')).trim().split('\n').map((l) => JSON.parse(l))
  const mail = mails.filter((m) => m.to === email).at(-1)
  const url = mail?.text.match(/https?:\/\/\S+\?token=[\w-]+/)?.[0]
  if (!url) throw new Error(`No link mailed to ${email}`)
  return url
}

test('sign up, verify, log in and see 60 free minutes', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`
  const password = 'a good long passphrase'

  await page.goto('/signup')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()

  await page.goto(await lastLinkTo(email))
  await page.getByRole('button', { name: 'Confirm my email' }).click()
  await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible()

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.locator('.minutes .big')).toHaveText('60')
  await expect(page.getByRole('cell', { name: 'Free' })).toBeVisible()

  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible()
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible()
})
