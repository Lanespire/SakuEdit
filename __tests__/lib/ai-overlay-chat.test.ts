import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock ai SDK
const mockGenerateObject = vi.fn()
vi.mock('ai', () => ({
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
}))

// Mock @ai-sdk/openai
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn((model: string) => `mock-model:${model}`)),
}))

// Mock the types module to avoid importing React components
vi.mock('@/app/reactvideoeditor/pro/types', () => ({
  OverlayType: {
    TEXT: 'text',
    IMAGE: 'image',
    SHAPE: 'shape',
    VIDEO: 'video',
    SOUND: 'sound',
    CAPTION: 'caption',
    LOCAL_DIR: 'local-dir',
    STICKER: 'sticker',
    TEMPLATE: 'TEMPLATE',
    SETTINGS: 'settings',
  },
}))

import { generateOverlayOperations } from '@/lib/ai-overlay-chat'

// Helper to create minimal overlay objects for testing
function makeVideoOverlay(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    type: 'video',
    from: 0,
    durationInFrames: 300,
    left: 0,
    top: 0,
    width: 1920,
    height: 1080,
    row: 0,
    isDragging: false,
    rotation: 0,
    content: '',
    src: '/video.mp4',
    styles: { volume: 1 },
    ...overrides,
  }
}

function makeCaptionOverlay(overrides: Record<string, unknown> = {}) {
  return {
    id: 2,
    type: 'caption',
    from: 0,
    durationInFrames: 300,
    left: 0,
    top: 800,
    width: 1920,
    height: 200,
    row: 1,
    isDragging: false,
    rotation: 0,
    captions: [{ text: 'テスト字幕', startMs: 0, endMs: 1000, timestampMs: 0, confidence: 0.9, words: [] }],
    template: 'classic',
    ...overrides,
  }
}

function makeTextOverlay(overrides: Record<string, unknown> = {}) {
  return {
    id: 3,
    type: 'text',
    from: 0,
    durationInFrames: 150,
    left: 100,
    top: 100,
    width: 400,
    height: 100,
    row: 2,
    isDragging: false,
    rotation: 0,
    content: 'テキストオーバーレイ',
    styles: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff',
      backgroundColor: 'transparent',
      fontFamily: 'sans-serif',
      fontStyle: 'normal',
      textDecoration: 'none',
    },
    ...overrides,
  }
}

describe('ai-overlay-chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =============================================
  // generateOverlayOperations
  // =============================================
  describe('generateOverlayOperations', () => {
    it('正常なレスポンスを返す', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          operations: [
            {
              op: 'add',
              overlayType: 'text',
              fields: {
                content: 'タイトル',
                from: 0,
                durationInFrames: 90,
                left: 100,
                top: 50,
                width: 400,
                height: 60,
              },
            },
          ],
          message: 'タイトルテキストを追加しました。',
        },
      })

      const result = await generateOverlayOperations({
        userMessage: '「タイトル」というテキストを追加して',
        overlays: [],
      })

      expect(result.operations).toHaveLength(1)
      expect(result.operations[0].op).toBe('add')
      expect(result.operations[0].overlayType).toBe('text')
      expect(result.message).toBe('タイトルテキストを追加しました。')
    })

    it('既存オーバーレイを含めてAIに渡す', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          operations: [
            { op: 'update', overlayId: 1, fields: { 'styles.volume': 0.5 } },
          ],
          message: '動画の音量を50%に下げました。',
        },
      })

      const overlays = [makeVideoOverlay()] as any[]

      const result = await generateOverlayOperations({
        userMessage: '動画の音量を半分にして',
        overlays,
      })

      expect(result.operations[0].op).toBe('update')
      expect(result.operations[0].overlayId).toBe(1)

      // Verify that overlay summary was included in the messages sent to AI
      const callArgs = mockGenerateObject.mock.calls[0][0]
      const systemMessages = callArgs.messages.filter((m: any) => m.role === 'system')
      const summaryMessage = systemMessages.find((m: any) => m.content.includes('現在のタイムライン'))
      expect(summaryMessage).toBeDefined()
      expect(summaryMessage.content).toContain('VIDEO')
    })

    it('チャット履歴が最新10件のみ含まれる', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          operations: [],
          message: 'はい、理解しました。',
        },
      })

      const chatHistory = Array.from({ length: 15 }, (_, i) => ({
        role: 'user' as const,
        content: `メッセージ${i}`,
      }))

      await generateOverlayOperations({
        userMessage: 'テスト',
        overlays: [],
        chatHistory,
      })

      const callArgs = mockGenerateObject.mock.calls[0][0]
      // system(2) + recent history(10) + user message(1) = 13
      const userMessages = callArgs.messages.filter((m: any) => m.role === 'user')
      // 10 from history + 1 current = 11
      expect(userMessages).toHaveLength(11)
    })

    it('エラー時にフォールバックメッセージを返す', async () => {
      mockGenerateObject.mockRejectedValueOnce(new Error('API Error'))

      const result = await generateOverlayOperations({
        userMessage: 'テキストを追加',
        overlays: [],
      })

      expect(result.operations).toEqual([])
      expect(result.message).toBe('すみません、処理中にエラーが発生しました。もう一度お試しください。')
    })

    it('複数のoperationを含むレスポンスを正しく返す', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          operations: [
            { op: 'delete', overlayId: 3 },
            {
              op: 'add',
              overlayType: 'text',
              fields: {
                content: '新しいテキスト',
                from: 0,
                durationInFrames: 150,
              },
            },
          ],
          message: '古いテキストを削除し、新しいテキストを追加しました。',
        },
      })

      const overlays = [makeVideoOverlay(), makeTextOverlay()] as any[]

      const result = await generateOverlayOperations({
        userMessage: 'テキストを置き換えて',
        overlays,
      })

      expect(result.operations).toHaveLength(2)
      expect(result.operations[0].op).toBe('delete')
      expect(result.operations[1].op).toBe('add')
    })

    it('空のタイムラインでもサマリが生成される', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          operations: [],
          message: 'タイムラインは空です。',
        },
      })

      await generateOverlayOperations({
        userMessage: '何がある？',
        overlays: [],
      })

      const callArgs = mockGenerateObject.mock.calls[0][0]
      const summaryMessage = callArgs.messages.find(
        (m: any) => m.role === 'system' && m.content.includes('空のタイムライン'),
      )
      expect(summaryMessage).toBeDefined()
    })

    it('fpsとアスペクト比がカスタム値で渡される', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          operations: [],
          message: 'OK',
        },
      })

      await generateOverlayOperations({
        userMessage: 'テスト',
        overlays: [],
        fps: 60,
        aspectRatio: '9:16',
      })

      const callArgs = mockGenerateObject.mock.calls[0][0]
      const summaryMessage = callArgs.messages.find(
        (m: any) => m.role === 'system' && m.content.includes('fps=60'),
      )
      expect(summaryMessage).toBeDefined()
      expect(summaryMessage.content).toContain('9:16')
    })

    it('キャプションオーバーレイのサマリにtemplateとcaption数が含まれる', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          operations: [],
          message: 'OK',
        },
      })

      const overlays = [makeCaptionOverlay()] as any[]

      await generateOverlayOperations({
        userMessage: '字幕のスタイルは？',
        overlays,
      })

      const callArgs = mockGenerateObject.mock.calls[0][0]
      const summaryMessage = callArgs.messages.find(
        (m: any) => m.role === 'system' && m.content.includes('CAPTION'),
      )
      expect(summaryMessage).toBeDefined()
      expect(summaryMessage.content).toContain('classic')
      expect(summaryMessage.content).toContain('1件')
    })

    it('サウンドオーバーレイのサマリにvolumeが含まれる', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          operations: [],
          message: 'OK',
        },
      })

      const soundOverlay = {
        id: 4,
        type: 'sound',
        from: 0,
        durationInFrames: 600,
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        row: 3,
        isDragging: false,
        rotation: 0,
        content: 'bgm',
        src: '/bgm.mp3',
        styles: { volume: 0.7 },
      } as any

      await generateOverlayOperations({
        userMessage: 'BGMの情報',
        overlays: [soundOverlay],
      })

      const callArgs = mockGenerateObject.mock.calls[0][0]
      const summaryMessage = callArgs.messages.find(
        (m: any) => m.role === 'system' && m.content.includes('SOUND'),
      )
      expect(summaryMessage).toBeDefined()
      expect(summaryMessage.content).toContain('vol=0.7')
    })
  })
})
