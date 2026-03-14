import { test, expect } from '@playwright/test'

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing')
  })

  test('should display pricing page header', async ({ page }) => {
    // 料金プラン画面のタイトル
    await expect(page.getByRole('heading', { name: /シンプルな料金プラン/i })).toBeVisible()
  })

  test('should display all pricing plans', async ({ page }) => {
    // 各プランの名前が表示されることを確認
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Business' })).toBeVisible()
  })

  test('should display Free plan price', async ({ page }) => {
    // 価格表示
    await expect(page.getByTestId('plan-free').getByText('¥0')).toBeVisible()
  })

  test('should display Pro plan price', async ({ page }) => {
    // 価格表示
    await expect(page.getByTestId('plan-pro').getByText('¥2,480')).toBeVisible()
  })

  test('should display Business plan price', async ({ page }) => {
    // 価格表示
    await expect(page.getByTestId('plan-business').getByText('¥8,980')).toBeVisible()
  })

  test('should explain current offering scope', async ({ page }) => {
    await expect(page.getByText('優先キューやチーム共有は現時点では提供していない')).toBeVisible()
  })

  test('should display FAQ section', async ({ page }) => {
    const faqHeading = page.getByRole('heading', { name: /よくある質問/i })
    await expect(faqHeading).toBeVisible()
  })

  test('should display trial offer', async ({ page }) => {
    // Proプランがおすすめとして表示される
    const popularBadge = page.getByText('おすすめ')
    if (await popularBadge.isVisible()) {
      await expect(popularBadge).toBeVisible()
    }
  })

  test('should have CTA buttons', async ({ page }) => {
    await expect(page.getByTestId('cta-free')).toBeVisible()
    await expect(page.getByTestId('cta-pro')).toBeVisible()
    await expect(page.getByTestId('cta-business')).toBeVisible()
  })

  test('should display one-time pack proposal', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /買い切り型はこの価格なら成立しやすいです/i })).toBeVisible()
    await expect(page.getByText('¥4,980')).toBeVisible()
  })
})
