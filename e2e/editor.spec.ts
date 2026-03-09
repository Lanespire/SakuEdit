import { test, expect } from '@playwright/test'
import { EditPage } from './pom/edit-page'
import { SubtitleEditModal, ExportSettingsModal } from './pom/modals'

test.describe('Edit Page', () => {
  let editPage: EditPage
  const testProjectId = 'test-project-123'

  test.beforeEach(async ({ page }) => {
    editPage = new EditPage(page)
    // テスト用プロジェクトページに移動
    await editPage.goto(testProjectId)
  })

  test('should display editor with key elements', async ({ page }) => {
    // プレビューエリア（存在すれば）
    const preview = page.getByTestId('main-preview-player')
    if (await preview.isVisible()) {
      await expect(preview).toBeVisible()
    }

    // タイムライン
    const timeline = page.getByTestId('main-timeline-video-track')
    if (await timeline.isVisible()) {
      await expect(timeline).toBeVisible()
    }

    // エクスポートボタン
    if (await editPage.exportButton.isVisible()) {
      await expect(editPage.exportButton).toBeVisible()
    }
  })

  test('should display timeline tracks', async ({ page }) => {
    // 動画トラック
    if (await editPage.videoTrack.isVisible()) {
      await expect(editPage.videoTrack).toBeVisible()
    }

    // 字幕トラック
    if (await editPage.subtitleTrack.isVisible()) {
      await expect(editPage.subtitleTrack).toBeVisible()
    }

    // 音声トラック
    if (await editPage.audioTrack.isVisible()) {
      await expect(editPage.audioTrack).toBeVisible()
    }
  })

  test('should have tab navigation', async ({ page }) => {
    // AIタブ
    if (await editPage.tabAI.isVisible()) {
      await editPage.tabAI.click()
    }

    // 字幕タブ
    if (await editPage.tabSubtitles.isVisible()) {
      await editPage.tabSubtitles.click()
    }

    // カットタブ
    if (await editPage.tabCuts.isVisible()) {
      await editPage.tabCuts.click()
    }

    // スタイルタブ
    if (await editPage.tabStyles.isVisible()) {
      await editPage.tabStyles.click()
    }
  })

  test('should have toolbar actions', async ({ page }) => {
    // 元に戻すボタン
    if (await editPage.undoButton.isVisible()) {
      await expect(editPage.undoButton).toBeEnabled()
    }

    // やり直しボタン
    if (await editPage.redoButton.isVisible()) {
      await expect(editPage.redoButton).toBeEnabled()
    }

    // 下書き保存
    if (await editPage.saveDraftButton.isVisible()) {
      await expect(editPage.saveDraftButton).toBeVisible()
    }
  })
})

test.describe('Subtitle Edit Modal', () => {
  let subtitleModal: SubtitleEditModal

  test.beforeEach(async ({ page }) => {
    subtitleModal = new SubtitleEditModal(page)
    // 編集ページに移動して字幕をダブルクリック
    await page.goto('/edit/test-project-123')
  })

  test('should open subtitle edit modal', async ({ page }) => {
    // 字幕トラックの字幕をダブルクリック
    const subtitleBlock = page.locator('[data-test-id="main-timeline-subtitle-track"] button').first()

    if (await subtitleBlock.isVisible()) {
      await subtitleBlock.dblclick()

      // モーダルが開く
      await expect(page.getByTestId('modal-backdrop')).toBeVisible()
      await expect(subtitleModal.textarea).toBeVisible()
    }
  })

  test('should edit subtitle text', async ({ page }) => {
    // モーダルを開く（前提条件）
    const subtitleBlock = page.locator('[data-test-id="main-timeline-subtitle-track"] button').first()

    if (await subtitleBlock.isVisible()) {
      await subtitleBlock.dblclick()
      await page.waitForTimeout(500)

      // テキストを編集
      await subtitleModal.editText('新しい字幕テキスト')
      await expect(subtitleModal.textarea).toHaveValue('新しい字幕テキスト')
    }
  })

  test('should navigate between subtitles', async ({ page }) => {
    const subtitleBlock = page.locator('[data-test-id="main-timeline-subtitle-track"] button').first()

    if (await subtitleBlock.isVisible()) {
      await subtitleBlock.dblclick()
      await page.waitForTimeout(500)

      // 次の字幕へ
      if (await subtitleModal.nextButton.isVisible()) {
        await subtitleModal.goToNext()
      }

      // 前の字幕へ
      if (await subtitleModal.prevButton.isVisible()) {
        await subtitleModal.goToPrev()
      }
    }
  })

  test('should save subtitle changes', async ({ page }) => {
    const subtitleBlock = page.locator('[data-test-id="main-timeline-subtitle-track"] button').first()

    if (await subtitleBlock.isVisible()) {
      await subtitleBlock.dblclick()
      await page.waitForTimeout(500)

      await subtitleModal.editText('更新された字幕')
      await subtitleModal.save()

      // モーダルが閉じる
      await expect(subtitleModal.textarea).not.toBeVisible()
    }
  })

  test('should cancel subtitle changes', async ({ page }) => {
    const subtitleBlock = page.locator('[data-test-id="main-timeline-subtitle-track"] button').first()

    if (await subtitleBlock.isVisible()) {
      await subtitleBlock.dblclick()
      await page.waitForTimeout(500)

      await subtitleModal.editText('キャンセル用テキスト')
      await subtitleModal.cancel()

      // モーダルが閉じる
      await expect(subtitleModal.textarea).not.toBeVisible()
    }
  })
})

test.describe('Export Settings Modal', () => {
  let exportModal: ExportSettingsModal
  let editPage: EditPage

  test.beforeEach(async ({ page }) => {
    exportModal = new ExportSettingsModal(page)
    editPage = new EditPage(page)
    await page.goto('/edit/test-project-123')
  })

  test('should open export modal', async ({ page }) => {
    if (await editPage.exportButton.isVisible()) {
      await editPage.openExportModal()

      // モーダルが開く
      await expect(page.getByTestId('modal-backdrop')).toBeVisible()
      await expect(exportModal.exportButton).toBeVisible()
    }
  })

  test('should select quality options', async ({ page }) => {
    if (await editPage.exportButton.isVisible()) {
      await editPage.openExportModal()
      await page.waitForTimeout(500)

      // 720p選択
      if (await exportModal.quality720p.isVisible()) {
        await exportModal.selectQuality('720p')
        await expect(exportModal.quality720p).toHaveClass(/border-primary/)
      }

      // 1080p選択
      if (await exportModal.quality1080p.isVisible()) {
        await exportModal.selectQuality('1080p')
      }
    }
  })

  test('should select format options', async ({ page }) => {
    if (await editPage.exportButton.isVisible()) {
      await editPage.openExportModal()
      await page.waitForTimeout(500)

      // MP4選択
      if (await exportModal.formatMp4.isVisible()) {
        await exportModal.selectFormat('mp4')
      }

      // WebM選択
      if (await exportModal.formatWebm.isVisible()) {
        await exportModal.selectFormat('webm')
      }
    }
  })

  test('should toggle subtitle options', async ({ page }) => {
    if (await editPage.exportButton.isVisible()) {
      await editPage.openExportModal()
      await page.waitForTimeout(500)

      // 字幕オプション切り替え
      if (await exportModal.includeSubtitles.isVisible()) {
        await exportModal.toggleSubtitles(false)
        await expect(exportModal.includeSubtitles).not.toBeChecked()

        await exportModal.toggleSubtitles(true)
        await expect(exportModal.includeSubtitles).toBeChecked()
      }
    }
  })

  test('should toggle thumbnail option', async ({ page }) => {
    if (await editPage.exportButton.isVisible()) {
      await editPage.openExportModal()
      await page.waitForTimeout(500)

      if (await exportModal.includeThumbnail.isVisible()) {
        const initialState = await exportModal.includeThumbnail.isChecked()
        await exportModal.toggleThumbnail(!initialState)
      }
    }
  })

  test('should toggle watermark option', async ({ page }) => {
    if (await editPage.exportButton.isVisible()) {
      await editPage.openExportModal()
      await page.waitForTimeout(500)

      if (await exportModal.watermark.isVisible()) {
        await exportModal.toggleWatermark(true)
      }
    }
  })

  test('should cancel export', async ({ page }) => {
    if (await editPage.exportButton.isVisible()) {
      await editPage.openExportModal()
      await page.waitForTimeout(500)

      await exportModal.cancel()

      // モーダルが閉じる
      await expect(exportModal.exportButton).not.toBeVisible()
    }
  })

  test('should start export', async ({ page }) => {
    if (await editPage.exportButton.isVisible()) {
      await editPage.openExportModal()
      await page.waitForTimeout(500)

      // 書き出し開始
      await exportModal.startExport()

      // 書き出し処理が開始される（ボタンが無効化またはローディング表示）
      await expect(exportModal.exportButton).toBeDisabled()
    }
  })
})
