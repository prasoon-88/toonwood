import { expect, test } from '@playwright/test'

test('landing page leads to sign-up', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Real-time answers, right on your call' })).toBeVisible()
  await page.getByRole('link', { name: 'Get started free' }).first().click()
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
})

for (const width of [360, 375]) {
  test(`nothing sticks out past the edge of a ${width} px phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible() // the route is lazy-loaded
    // The page root clips horizontal overflow (`overflow-x: clip`), so scrollWidth alone would hide a
    // too-wide element. Check every visible element's box instead, clamped by any clipping ancestor
    // below the page root (the hero deliberately clips its oversized glow and hills).
    const { checked, offenders } = await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>('[data-page="landing"]')!
      const limit = window.innerWidth + 1
      const out: string[] = []
      let n = 0
      for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
        const style = getComputedStyle(el)
        if (style.visibility === 'hidden' || style.display === 'none') continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        let right = r.right
        for (let p = el.parentElement; p && p !== root; p = p.parentElement) {
          if (getComputedStyle(p).overflowX !== 'visible') right = Math.min(right, p.getBoundingClientRect().right)
        }
        n++
        if (right > limit) out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(right)}`)
      }
      return { checked: n, offenders: out }
    })
    expect(checked).toBeGreaterThan(200)
    expect(offenders).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  })
}

test('FAQ answers open without animation when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const question = page.getByRole('button', { name: 'Is Toonwide free?' })
  await question.click()
  await expect(question).toHaveAttribute('aria-expanded', 'true')
  const duration = await question.evaluate(
    (b) => (b.closest('.MuiAccordion-root')?.querySelector('.MuiCollapse-root') as HTMLElement | null)?.style.transitionDuration
  )
  expect(duration).toBe('0ms')
})
