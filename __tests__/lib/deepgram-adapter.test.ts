import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fs/promises before importing the module
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
}))

import fs from 'fs/promises'
import { isDeepgramConfigured, transcribeWithDeepgram } from '@/lib/deepgram-adapter'

describe('deepgram-adapter', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  // =============================================
  // isDeepgramConfigured
  // =============================================
  describe('isDeepgramConfigured', () => {
    it('環境変数が設定されている場合 true を返す', () => {
      process.env.DEEPGRAM_API_KEY = 'test-key-123'
      expect(isDeepgramConfigured()).toBe(true)
    })

    it('環境変数が未設定の場合 false を返す', () => {
      delete process.env.DEEPGRAM_API_KEY
      expect(isDeepgramConfigured()).toBe(false)
    })

    it('環境変数が空文字の場合 false を返す', () => {
      process.env.DEEPGRAM_API_KEY = ''
      expect(isDeepgramConfigured()).toBe(false)
    })
  })

  // =============================================
  // transcribeWithDeepgram
  // =============================================
  describe('transcribeWithDeepgram', () => {
    beforeEach(() => {
      process.env.DEEPGRAM_API_KEY = 'test-api-key'
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake-audio'))
    })

    it('DEEPGRAM_API_KEY が未設定の場合エラーを投げる', async () => {
      delete process.env.DEEPGRAM_API_KEY
      await expect(transcribeWithDeepgram('/path/to/audio.wav')).rejects.toThrow(
        'DEEPGRAM_API_KEY is not configured',
      )
    })

    it('utterances ありの場合、正しくパースして返す', async () => {
      const mockResponse = {
        results: {
          channels: [
            {
              alternatives: [
                {
                  transcript: 'こんにちは世界',
                  words: [],
                },
              ],
            },
          ],
          utterances: [
            { start: 0.0, end: 1.5, transcript: 'こんにちは', confidence: 0.95 },
            { start: 2.0, end: 3.5, transcript: '世界', confidence: 0.90 },
          ],
        },
      }

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        }),
      )

      const result = await transcribeWithDeepgram('/path/to/audio.wav')

      expect(result.text).toBe('こんにちは世界')
      expect(result.segments).toHaveLength(2)
      expect(result.segments[0]).toEqual({
        start: 0.0,
        end: 1.5,
        text: 'こんにちは',
        confidence: 0.95,
      })
      expect(result.segments[1]).toEqual({
        start: 2.0,
        end: 3.5,
        text: '世界',
        confidence: 0.90,
      })
    })

    it('utterances なし・words ありの場合、3秒セグメントにグループ化する', async () => {
      const mockResponse = {
        results: {
          channels: [
            {
              alternatives: [
                {
                  transcript: '今日はいい天気です',
                  words: [
                    { word: '今日は', start: 0.0, end: 0.5, confidence: 0.9 },
                    { word: 'いい', start: 0.6, end: 1.0, confidence: 0.85 },
                    { word: '天気', start: 1.1, end: 1.5, confidence: 0.92 },
                    { word: 'です', start: 1.6, end: 2.0, confidence: 0.88 },
                  ],
                },
              ],
            },
          ],
          utterances: [],
        },
      }

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        }),
      )

      const result = await transcribeWithDeepgram('/path/to/audio.wav')

      expect(result.text).toBe('今日はいい天気です')
      // All words within 3 seconds should be grouped together
      expect(result.segments).toHaveLength(1)
      expect(result.segments[0].text).toBe('今日はいい天気です')
      expect(result.segments[0].start).toBe(0.0)
      expect(result.segments[0].end).toBe(2.0)
    })

    it('words が1秒以上離れている場合、別セグメントに分割する', async () => {
      const mockResponse = {
        results: {
          channels: [
            {
              alternatives: [
                {
                  transcript: 'こんにちはさようなら',
                  words: [
                    { word: 'こんにちは', start: 0.0, end: 0.5, confidence: 0.9 },
                    { word: 'さようなら', start: 2.0, end: 2.5, confidence: 0.85 },
                  ],
                },
              ],
            },
          ],
          utterances: [],
        },
      }

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        }),
      )

      const result = await transcribeWithDeepgram('/path/to/audio.wav')

      expect(result.segments).toHaveLength(2)
      expect(result.segments[0].text).toBe('こんにちは')
      expect(result.segments[1].text).toBe('さようなら')
    })

    it('alternative がない場合、空の結果を返す', async () => {
      const mockResponse = {
        results: {
          channels: [{ alternatives: [] }],
        },
      }

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        }),
      )

      const result = await transcribeWithDeepgram('/path/to/audio.wav')

      expect(result.text).toBe('')
      expect(result.segments).toEqual([])
    })

    it('APIエラーの場合、エラーを投げる', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          text: () => Promise.resolve('Unauthorized'),
        }),
      )

      await expect(transcribeWithDeepgram('/path/to/audio.wav')).rejects.toThrow(
        'Deepgram API error (401): Unauthorized',
      )
    })

    it('正しいパラメータでAPIを呼び出す', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: {
              channels: [{ alternatives: [{ transcript: '', words: [] }] }],
              utterances: [],
            },
          }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await transcribeWithDeepgram('/path/to/audio.wav', 'en')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('https://api.deepgram.com/v1/listen')
      expect(url).toContain('language=en')
      expect(url).toContain('model=nova-3')
      expect(url).toContain('utterances=true')
      expect(options.method).toBe('POST')
      expect(options.headers.Authorization).toBe('Token test-api-key')
    })
  })
})
