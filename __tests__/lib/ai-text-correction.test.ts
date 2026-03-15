import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock ai SDK
const mockGenerateObject = vi.fn()
vi.mock('ai', () => ({
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
}))

// Mock @ai-sdk/openai
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn((model: string) => `mock-model:${model}`)),
}))

import { correctTranscription } from '@/lib/ai-text-correction'

describe('ai-text-correction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =============================================
  // correctTranscription
  // =============================================
  describe('correctTranscription', () => {
    it('空のセグメント配列を渡すと空配列を返す', async () => {
      const result = await correctTranscription([])
      expect(result).toEqual([])
      expect(mockGenerateObject).not.toHaveBeenCalled()
    })

    it('AIが修正したセグメントを正しく返す', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          segments: [
            { index: 0, correctedText: 'こんにちは', wasChanged: false },
            { index: 1, correctedText: '今日はいい天気ですね', wasChanged: true },
          ],
        },
      })

      const segments = [
        { start: 0, end: 1.5, text: 'こんにちは' },
        { start: 2.0, end: 4.0, text: 'きょうわいい天気ですね' },
      ]

      const result = await correctTranscription(segments)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        start: 0,
        end: 1.5,
        text: 'こんにちは',
        original: 'こんにちは',
        corrected: false,
      })
      expect(result[1]).toEqual({
        start: 2.0,
        end: 4.0,
        text: '今日はいい天気ですね',
        original: 'きょうわいい天気ですね',
        corrected: true,
      })
    })

    it('フィラーのみのセグメント（空文字に修正）はフィルタリングされる', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          segments: [
            { index: 0, correctedText: '', wasChanged: true },
            { index: 1, correctedText: '本題です', wasChanged: false },
          ],
        },
      })

      const segments = [
        { start: 0, end: 1.0, text: 'えーっと' },
        { start: 1.5, end: 3.0, text: '本題です' },
      ]

      const result = await correctTranscription(segments)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('本題です')
    })

    it('30件超のセグメントはバッチ処理される', async () => {
      // 35 segments → 2 batches (30 + 5)
      const segments = Array.from({ length: 35 }, (_, i) => ({
        start: i * 1.0,
        end: i * 1.0 + 0.9,
        text: `テスト${i}`,
      }))

      // First batch: 30 items
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          segments: Array.from({ length: 30 }, (_, i) => ({
            index: i,
            correctedText: `テスト${i}`,
            wasChanged: false,
          })),
        },
      })

      // Second batch: 5 items
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          segments: Array.from({ length: 5 }, (_, i) => ({
            index: 30 + i,
            correctedText: `テスト${30 + i}`,
            wasChanged: false,
          })),
        },
      })

      const result = await correctTranscription(segments)

      expect(mockGenerateObject).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(35)
    })

    it('AIエラー時はオリジナルのセグメントをフォールバックとして返す', async () => {
      mockGenerateObject.mockRejectedValueOnce(new Error('API rate limit'))

      const segments = [
        { start: 0, end: 1.5, text: 'テスト文' },
        { start: 2.0, end: 3.5, text: 'フォールバック' },
      ]

      const result = await correctTranscription(segments)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        start: 0,
        end: 1.5,
        text: 'テスト文',
        original: 'テスト文',
        corrected: false,
      })
      expect(result[1]).toEqual({
        start: 2.0,
        end: 3.5,
        text: 'フォールバック',
        original: 'フォールバック',
        corrected: false,
      })
    })

    it('AIが一部のセグメントを返さなくても、全セグメントが結果に含まれる', async () => {
      // AI returns only index 0, skips index 1
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          segments: [
            { index: 0, correctedText: '修正済み', wasChanged: true },
          ],
        },
      })

      const segments = [
        { start: 0, end: 1.0, text: 'オリジナル1' },
        { start: 1.5, end: 2.5, text: 'オリジナル2' },
      ]

      const result = await correctTranscription(segments)

      expect(result).toHaveLength(2)
      // First segment corrected
      expect(result[0].text).toBe('修正済み')
      expect(result[0].corrected).toBe(true)
      // Second segment passed through
      expect(result[1].text).toBe('オリジナル2')
      expect(result[1].corrected).toBe(false)
    })

    it('プレミアムモデルが isPremium=true で使われる', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          segments: [{ index: 0, correctedText: 'テスト', wasChanged: false }],
        },
      })

      const segments = [{ start: 0, end: 1.0, text: 'テスト' }]

      await correctTranscription(segments, true)

      const callArgs = mockGenerateObject.mock.calls[0][0]
      // The model should be the premium one (gemini-3-flash-preview)
      expect(callArgs.model).toContain('gemini-3-flash-preview')
    })

    it('デフォルトモデルが isPremium=false で使われる', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          segments: [{ index: 0, correctedText: 'テスト', wasChanged: false }],
        },
      })

      const segments = [{ start: 0, end: 1.0, text: 'テスト' }]

      await correctTranscription(segments, false)

      const callArgs = mockGenerateObject.mock.calls[0][0]
      expect(callArgs.model).toContain('gemini-3.1-flash-lite-preview')
    })

    it('結果はstartの昇順でソートされる', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          segments: [
            { index: 1, correctedText: '後のセグメント', wasChanged: false },
            { index: 0, correctedText: '先のセグメント', wasChanged: false },
          ],
        },
      })

      const segments = [
        { start: 0, end: 1.0, text: '先のセグメント' },
        { start: 2.0, end: 3.0, text: '後のセグメント' },
      ]

      const result = await correctTranscription(segments)

      expect(result[0].start).toBe(0)
      expect(result[1].start).toBe(2.0)
    })
  })
})
