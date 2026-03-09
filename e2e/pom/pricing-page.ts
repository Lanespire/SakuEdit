import { Page, Locator } from '@playwright/test'

export class PricingPage {
  readonly page: Page
  readonly planFree: Locator
  readonly planPro: Locator
  readonly planEnterprise: Locator
  readonly startFreeButton: Locator
  readonly startProButton: Locator
  readonly billingToggleMonthly: Locator
  readonly billingToggleYearly: Locator

  constructor(page: Page) {
    this.page = page
    this.planFree = page.getByTestId('plan-free')
    this.planPro = page.getByTestId('plan-pro')
    this.planEnterprise = page.getByTestId('plan-enterprise')
    this.startFreeButton = page.getByTestId('cta-free')
    this.startProButton = page.getByTestId('cta-pro')
    this.billingToggleMonthly = page.getByTestId('billing-monthly')
    this.billingToggleYearly = page.getByTestId('billing-yearly')
  }

  async goto() {
    await this.page.goto('/pricing')
  }

  async selectPlan(planId: string) {
    await this.page.getByTestId(`plan-${planId}`).click()
  }

  async clickCta(planId: string) {
    await this.page.getByTestId(`cta-${planId}`).click()
  }
}
