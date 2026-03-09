import { Page, Locator } from '@playwright/test'

export class EditPage {
  readonly page: Page
  readonly previewPlayer: Locator
  readonly timelineHeader: Locator
  readonly videoTrack: Locator
  readonly subtitleTrack: Locator
  readonly audioTrack: Locator
  readonly tabAI: Locator
  readonly tabSubtitles: Locator
  readonly tabCuts: Locator
  readonly tabStyles: Locator
  readonly undoButton: Locator
  readonly redoButton: Locator
  readonly saveDraftButton: Locator
  readonly exportButton: Locator
  readonly aiSuggestionSilence: Locator
  readonly aiSuggestionTempo: Locator
  readonly aiSuggestionHighlight: Locator

  constructor(page: Page) {
    this.page = page
    this.previewPlayer = page.getByTestId('main-preview-player')
    this.timelineHeader = page.getByTestId('main-timeline-header')
    this.videoTrack = page.getByTestId('main-timeline-video-track')
    this.subtitleTrack = page.getByTestId('main-timeline-subtitle-track')
    this.audioTrack = page.getByTestId('main-timeline-audio-track')
    this.tabAI = page.getByTestId('main-tab-ai')
    this.tabSubtitles = page.getByTestId('main-tab-subtitles')
    this.tabCuts = page.getByTestId('main-tab-cuts')
    this.tabStyles = page.getByTestId('main-tab-styles')
    this.undoButton = page.getByTestId('main-undo-button')
    this.redoButton = page.getByTestId('main-redo-button')
    this.saveDraftButton = page.getByTestId('main-save-draft-button')
    this.exportButton = page.getByTestId('main-export-button')
    this.aiSuggestionSilence = page.getByTestId('ai-suggestion-silence-cut')
    this.aiSuggestionTempo = page.getByTestId('ai-suggestion-tempo-optimize')
    this.aiSuggestionHighlight = page.getByTestId('ai-suggestion-highlight-detect')
  }

  async goto(projectId: string) {
    await this.page.goto(`/edit/${projectId}`)
  }

  async clickTab(tabName: string) {
    await this.page.getByTestId(`main-tab-${tabName}`).click()
  }

  async undo() {
    await this.undoButton.click()
  }

  async redo() {
    await this.redoButton.click()
  }

  async saveDraft() {
    await this.saveDraftButton.click()
  }

  async openExportModal() {
    await this.exportButton.click()
  }

  async applyAISuggestion(suggestionId: string) {
    await this.page.getByTestId(`ai-suggestion-${suggestionId}`).getByRole('button', { name: /適用|apply/i }).click()
  }
}
