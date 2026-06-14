import { expect, test } from '@playwright/test'

/**
 * End-to-end smoke test: the app boots and renders the header.
 * Connection itself requires a running executor, which CI may or may
 * not provide — the test only asserts the static shell renders.
 */

test('app shell renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
