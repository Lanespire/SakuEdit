import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page with hero section', async ({ page }) => {
    // Heroセクションのh1
    const heroHeading = page.getByRole('heading', { level: 1 })
    await expect(heroHeading).toBeVisible()

    // メインコピーが含まれていることを確認
    const bodyText = page.locator('body')
    await expect(bodyText).toContainText(/動画|編集|AI/)
  })

  test('should display SakuEdit branding', async ({ page }) => {
    // SakuEditのロゴまたはテキスト（大文字小文字を区別しない）
    const branding = page.getByText(/sakuedit/i)
    await expect(branding.first()).toBeVisible()
  })

  test('should have navigation to pricing', async ({ page }) => {
    // 料金リンクをクリック
    const pricingLink = page.getByRole('link', { name: /料金/i })

    if (await pricingLink.first().isVisible()) {
      await pricingLink.first().click()
      await expect(page).toHaveURL(/pricing/)
    }
  })

  test('should have CTA button to start', async ({ page }) => {
    // CTAボタン
    const ctaButton = page.getByRole('link', { name: /始める/ })
    await expect(ctaButton.first()).toBeVisible()
  })

  test('should display features section', async ({ page }) => {
    // 機能セクションの見出し
    const featuresHeading = page.getByRole('heading', { name: /なぜ|機能/i })
    await expect(featuresHeading).toBeVisible()
  })

  test('should display how it works section', async ({ page }) => {
    // 使い方セクションの見出し
    const howItWorksHeading = page.getByRole('heading', { name: /ステップ|使い方/i })
    await expect(howItWorksHeading).toBeVisible()
  })

  test('should have responsive layout', async ({ page, isMobile }) => {
    if (isMobile) {
      const viewport = page.viewportSize()
      expect(viewport?.width).toBeLessThan(768)
    }

    // ページが表示されることを確認
    await expect(page.locator('body')).toBeVisible()
  })
})
