import { Page, Locator } from '@playwright/test'

export class SubtitleEditModal {
  readonly page: Page
  readonly backdrop: Locator
  readonly closeButton: Locator
  readonly prevButton: Locator
  readonly nextButton: Locator
  readonly preview: Locator
  readonly playButton: Locator
  readonly textarea: Locator
  readonly startTimeInput: Locator
  readonly endTimeInput: Locator
  readonly styleSelect: Locator
  readonly cancelButton: Locator
  readonly saveButton: Locator
  readonly positionTop: Locator
  readonly positionMiddle: Locator
  readonly positionBottom: Locator

  constructor(page: Page) {
    this.page = page
    this.backdrop = page.getByTestId('modal-backdrop')
    this.closeButton = page.getByTestId('close-modal')
    this.prevButton = page.getByTestId('prev-subtitle')
    this.nextButton = page.getByTestId('next-subtitle')
    this.preview = page.getByTestId('subtitle-edit-preview').or(page.locator('.aspect-video'))
    this.playButton = page.getByTestId('subtitle-edit-play-button').or(page.getByRole('button', { name: /この字幕を再生/i }))
    this.textarea = page.getByTestId('subtitle-text-input')
    this.startTimeInput = page.getByTestId('start-time-input')
    this.endTimeInput = page.getByTestId('end-time-input')
    this.styleSelect = page.getByTestId('style-select')
    this.cancelButton = page.getByTestId('cancel-button')
    this.saveButton = page.getByTestId('save-subtitle')
    this.positionTop = page.getByTestId('position-top')
    this.positionMiddle = page.getByTestId('position-middle')
    this.positionBottom = page.getByTestId('position-bottom')
  }

  async editText(newText: string) {
    await this.textarea.fill(newText)
  }

  async setStartTime(time: string) {
    await this.startTimeInput.fill(time)
  }

  async setEndTime(time: string) {
    await this.endTimeInput.fill(time)
  }

  async selectPosition(position: 'top' | 'middle' | 'bottom') {
    await this.page.getByTestId(`position-${position}`).click()
  }

  async selectStyle(style: string) {
    await this.styleSelect.selectOption(style)
  }

  async save() {
    await this.saveButton.click()
  }

  async cancel() {
    await this.cancelButton.click()
  }

  async close() {
    await this.closeButton.click()
  }

  async goToPrev() {
    await this.prevButton.click()
  }

  async goToNext() {
    await this.nextButton.click()
  }
}

export class ExportSettingsModal {
  readonly page: Page
  readonly backdrop: Locator
  readonly closeButton: Locator
  readonly quality720p: Locator
  readonly quality1080p: Locator
  readonly quality4k: Locator
  readonly formatMp4: Locator
  readonly formatWebm: Locator
  readonly formatMov: Locator
  readonly includeSubtitles: Locator
  readonly subtitleBurnIn: Locator
  readonly subtitleSrt: Locator
  readonly subtitleBoth: Locator
  readonly includeThumbnail: Locator
  readonly watermark: Locator
  readonly cancelButton: Locator
  readonly exportButton: Locator

  constructor(page: Page) {
    this.page = page
    this.backdrop = page.getByTestId('modal-backdrop')
    this.closeButton = page.getByTestId('close-modal')
    this.quality720p = page.getByTestId('quality-720p')
    this.quality1080p = page.getByTestId('quality-1080p')
    this.quality4k = page.getByTestId('quality-4k')
    this.formatMp4 = page.getByTestId('format-mp4')
    this.formatWebm = page.getByTestId('format-webm')
    this.formatMov = page.getByTestId('format-mov')
    this.includeSubtitles = page.getByTestId('include-subtitles')
    this.subtitleBurnIn = page.getByTestId('subtitle-burn-in')
    this.subtitleSrt = page.getByTestId('subtitle-srt')
    this.subtitleBoth = page.getByTestId('subtitle-both')
    this.includeThumbnail = page.getByTestId('include-thumbnail')
    this.watermark = page.getByTestId('include-watermark')
    this.cancelButton = page.getByTestId('cancel-button')
    this.exportButton = page.getByTestId('export-button')
  }

  async selectQuality(quality: '720p' | '1080p' | '4k') {
    await this.page.getByTestId(`quality-${quality}`).click()
  }

  async selectFormat(format: 'mp4' | 'webm' | 'mov') {
    await this.page.getByTestId(`format-${format}`).click()
  }

  async toggleSubtitles(enabled: boolean) {
    const isChecked = await this.includeSubtitles.isChecked()
    if (isChecked !== enabled) {
      await this.includeSubtitles.click()
    }
  }

  async selectSubtitleFormat(format: 'burn-in' | 'srt' | 'both') {
    await this.page.getByTestId(`subtitle-${format}`).click()
  }

  async toggleThumbnail(enabled: boolean) {
    const isChecked = await this.includeThumbnail.isChecked()
    if (isChecked !== enabled) {
      await this.includeThumbnail.click()
    }
  }

  async toggleWatermark(enabled: boolean) {
    const isChecked = await this.watermark.isChecked()
    if (isChecked !== enabled) {
      await this.watermark.click()
    }
  }

  async startExport() {
    await this.exportButton.click()
  }

  async cancel() {
    await this.cancelButton.click()
  }

  async close() {
    await this.closeButton.click()
  }
}
