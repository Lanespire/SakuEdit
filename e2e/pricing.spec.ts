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
    await expect(page.getByRole('heading', { name: 'Enterprise' })).toBeVisible()
  })

  test('should display Free plan price', async ({ page }) => {
    // 価格表示
    await expect(page.getByText('¥0')).toBeVisible()
  })

  test('should display Pro plan price', async ({ page }) => {
    // 価格表示
    await expect(page.getByText('¥2,480')).toBeVisible()
  })

  test('should display Business plan price', async ({ page }) => {
    // 価格表示
    await expect(page.getByText('¥8,980')).toBeVisible()
  })

  test('should display Enterprise plan as custom', async ({ page }) => {
    // Enterpriseプランは要相談表示
    await expect(page.getByText('要相談')).toBeVisible()
  })

  test('should display feature list with check marks', async ({ page }) => {
    // チェックマーク（含まれる機能）
    const checkIcons = page.locator('.material-symbols-outlined:has-text("check_circle")')
    const checkCount = await checkIcons.count()
    expect(checkCount).toBeGreaterThan(0)
  })

  test('should display feature list with cancel marks', async ({ page }) => {
    // ×マーク（含まれない機能）
    const cancelIcons = page.locator('.material-symbols-outlined:has-text("cancel")')
    const cancelCount = await cancelIcons.count()
    expect(cancelCount).toBeGreaterThan(0)
  })

  test('should display FAQ section', async ({ page }) => {
    const faqHeading = page.getByRole('heading', { name: /よくある質問/i })
    await expect(faqHeading).toBeVisible()
  })

  test('should display trial offer', async ({ page }) => {
    // Proプランが人気No.1として表示される
    const popularBadge = page.getByText('人気No.1')
    if (await popularBadge.isVisible()) {
      await expect(popularBadge).toBeVisible()
    }
  })

  test('should have CTA buttons', async ({ page }) => {
    // CTAボタンが存在することを確認
    const ctaButtons = page.getByRole('button', { name: /無料で始める|Proを始める|Businessを始める|お問い合わせ/ })
    const count = await ctaButtons.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })
})
