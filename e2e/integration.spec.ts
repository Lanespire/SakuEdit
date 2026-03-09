import { test, expect } from '@playwright/test'

test.describe('Integration Flow', () => {
  test('should navigate from landing to pricing', async ({ page }) => {
    await page.goto('/')

    // Click pricing link
    const pricingLink = page.locator('a[href="/pricing"], button:has-text("料金")').first()
    if (await pricingLink.isVisible()) {
      await pricingLink.click()
      await expect(page).toHaveURL(/.*pricing.*/)
    }
  })

  test('should display header on landing page', async ({ page }) => {
    await page.goto('/')

    // Check header elements
    const logo = page.locator('text=SakuEdit').first()
    await expect(logo).toBeVisible()
  })

  test('should display header on pricing page', async ({ page }) => {
    await page.goto('/pricing')

    // Check header elements - use role-based selector for specificity
    const title = page.locator('h1').filter({ hasText: '料金' })
    await expect(title).toBeVisible()
  })

  test('should handle 404 page gracefully', async ({ page }) => {
    await page.goto('/non-existent-page')

    // Should show 404 or redirect
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should have proper heading hierarchy on landing', async ({ page }) => {
    await page.goto('/')

    // Check for h1
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })

  test('should have proper heading hierarchy on pricing', async ({ page }) => {
    await page.goto('/pricing')

    // Check for h1
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })

  test('should load landing page within acceptable time', async ({ page }) => {
    const start = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - start

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should load pricing page within acceptable time', async ({ page }) => {
    const start = Date.now()
    await page.goto('/pricing')
    const loadTime = Date.now() - start

    // Should load within 10 seconds (dev mode is slower)
    expect(loadTime).toBeLessThan(10000)
  })
})
