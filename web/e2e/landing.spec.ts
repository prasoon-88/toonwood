import { expect, test } from '@playwright/test'

test('landing page leads to sign-up', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Real-time answers, right on your call' })).toBeVisible()
  await page.getByRole('link', { name: 'Get started free' }).first().click()
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
})

test('no horizontal scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
