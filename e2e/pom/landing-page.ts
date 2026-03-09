import { Page, Locator } from '@playwright/test'

export class LandingPage {
  readonly page: Page
  readonly uploadArea: Locator
  readonly urlInput: Locator
  readonly referenceUploadArea: Locator
  readonly presetCard: (id: string) => Locator
  readonly optionCheckbox: (name: string) => Locator
  readonly startEditingButton: Locator
  readonly headerLogo: Locator
  readonly loginLink: Locator
  readonly proButton: Locator

  constructor(page: Page) {
    this.page = page
    this.uploadArea = page.getByTestId('landing-upload-area')
    this.urlInput = page.getByTestId('landing-url-input')
    this.referenceUploadArea = page.getByTestId('landing-reference-upload-area')
    this.presetCard = (id: string) => page.getByTestId(`landing-preset-card-${id}`)
    this.optionCheckbox = (name: string) => page.getByTestId(`landing-option-checkbox-${name}`)
    this.startEditingButton = page.getByTestId('landing-start-editing-button')
    this.headerLogo = page.getByTestId('header-logo')
    this.loginLink = page.getByTestId('header-login-link')
    this.proButton = page.getByTestId('header-pro-button')
  }

  async goto() {
    await this.page.goto('/')
  }

  async uploadVideo(filePath: string) {
    const fileInput = this.uploadArea.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
  }

  async enterUrl(url: string) {
    await this.urlInput.fill(url)
  }

  async selectPreset(id: string) {
    await this.presetCard(id).click()
  }

  async toggleOption(name: string, enabled: boolean) {
    const checkbox = this.optionCheckbox(name)
    const isChecked = await checkbox.isChecked()
    if (isChecked !== enabled) {
      await checkbox.click()
    }
  }

  async startEditing() {
    await this.startEditingButton.click()
  }
}
