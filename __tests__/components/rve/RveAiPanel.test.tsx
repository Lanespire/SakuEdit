import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

import type { Overlay } from '@/app/reactvideoeditor/pro/types'

// ---- Mocks ----

const mockSetOverlays = vi.fn()
let mockOverlays: Overlay[] = []

vi.mock('@/app/reactvideoeditor/pro/contexts/editor-context', () => ({
  useEditorContext: () => ({
    overlays: mockOverlays,
    setOverlays: mockSetOverlays,
    aspectRatio: '16:9',
    fps: 30,
  }),
}))

vi.mock('@/app/reactvideoeditor/pro/utils/aspect-ratio-transform', () => ({
  getDimensionsForAspectRatio: () => ({ width: 1920, height: 1080 }),
}))

vi.mock('@/lib/editor', () => ({
  EDITOR_FPS: 30,
}))

// Import component after mocks
import { RveAiPanel } from '@/components/rve/panels/RveAiPanel'

// ---- Tests ----

describe('RveAiPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockOverlays = []
    mockSetOverlays.mockReset()
    // jsdom does not implement scrollTo
    Element.prototype.scrollTo = vi.fn()
  })

  // ------------------------------------------
  // 初期状態（AIアシスタントの空状態）
  // ------------------------------------------
  it('初期状態でAIアシスタントの空状態を表示', () => {
    render(<RveAiPanel />)
    expect(screen.getByText('AIアシスタント')).toBeInTheDocument()
    expect(screen.getByText('編集に関する指示を入力してください')).toBeInTheDocument()
  })

  it('AIの説明テキストを表示', () => {
    render(<RveAiPanel />)
    expect(
      screen.getByText(/AIに自然言語で編集指示を出せます/),
    ).toBeInTheDocument()
  })

  // ------------------------------------------
  // 入力フィールドとボタン表示
  // ------------------------------------------
  it('入力フィールドとボタンを表示', () => {
    render(<RveAiPanel />)

    const input = screen.getByPlaceholderText('編集指示を入力...')
    expect(input).toBeInTheDocument()
    expect(input).not.toBeDisabled()

    // 送信ボタンはinputが空なのでdisabled
    const form = input.closest('form')
    expect(form).toBeDefined()
    const submitButton = form?.querySelector('button[type="submit"]')
    expect(submitButton).toBeDefined()
    expect(submitButton).toBeDisabled()
  })

  it('入力フィールドに値を入力すると送信ボタンが有効になる', () => {
    render(<RveAiPanel />)

    const input = screen.getByPlaceholderText('編集指示を入力...')
    fireEvent.change(input, { target: { value: 'テロップを追加して' } })

    const form = input.closest('form')
    const submitButton = form?.querySelector('button[type="submit"]')
    expect(submitButton).not.toBeDisabled()
  })

  // ------------------------------------------
  // メッセージ送信後のUI更新
  // ------------------------------------------
  it('メッセージ送信後にユーザーメッセージが表示される', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/edit/project-789' },
      writable: true,
    })

    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          message: 'テロップを追加しました。',
          operations: [],
        }),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    render(<RveAiPanel />)

    const input = screen.getByPlaceholderText('編集指示を入力...')
    fireEvent.change(input, { target: { value: 'テロップを追加して' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    // ユーザーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('テロップを追加して')).toBeInTheDocument()
    })

    // AI応答が表示される
    await waitFor(() => {
      expect(screen.getByText('テロップを追加しました。')).toBeInTheDocument()
    })
  })

  it('送信中は入力フィールドがdisabledになる', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/edit/project-789' },
      writable: true,
    })

    // resolveを遅延させる
    let resolveResponse: (value: unknown) => void
    const responsePromise = new Promise((resolve) => {
      resolveResponse = resolve
    })
    globalThis.fetch = vi.fn().mockReturnValue(responsePromise)

    render(<RveAiPanel />)

    const input = screen.getByPlaceholderText('編集指示を入力...')
    fireEvent.change(input, { target: { value: 'テスト指示' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    // ローディング中は入力がdisabled
    await waitFor(() => {
      expect(input).toBeDisabled()
    })

    // 「考え中...」テキストが表示される
    expect(screen.getByText('考え中...')).toBeInTheDocument()

    // レスポンスを返す
    resolveResponse!({
      ok: true,
      json: () => Promise.resolve({ message: '完了', operations: [] }),
    })

    await waitFor(() => {
      expect(input).not.toBeDisabled()
    })
  })

  it('APIエラー時にエラーメッセージを表示', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/edit/project-789' },
      writable: true,
    })

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
    })

    render(<RveAiPanel />)

    const input = screen.getByPlaceholderText('編集指示を入力...')
    fireEvent.change(input, { target: { value: 'テスト' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/エラー: AI応答に失敗しました/)).toBeInTheDocument()
    })
  })

  it('operationsがある場合setOverlaysが呼ばれる', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/edit/project-789' },
      writable: true,
    })

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          message: 'テキストを追加しました。',
          operations: [
            {
              op: 'add',
              overlayType: 'text',
              fields: { content: '新しいテロップ' },
            },
          ],
        }),
    })

    render(<RveAiPanel />)

    const input = screen.getByPlaceholderText('編集指示を入力...')
    fireEvent.change(input, { target: { value: 'テロップ追加' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockSetOverlays).toHaveBeenCalledTimes(1)
    })

    // setOverlaysに渡された配列にtext overlayが含まれているか確認
    const newOverlays = mockSetOverlays.mock.calls[0][0]
    expect(newOverlays).toHaveLength(1)
    expect(newOverlays[0].type).toBe('text')
    expect(newOverlays[0].content).toBe('新しいテロップ')
  })

  it('fetch時にchatHistoryとoverlaysをPOSTする', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/edit/project-789' },
      writable: true,
    })

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'OK', operations: [] }),
    })

    render(<RveAiPanel />)

    const input = screen.getByPlaceholderText('編集指示を入力...')
    fireEvent.change(input, { target: { value: '字幕を大きくして' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/projects/project-789/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        }),
      )
    })

    const body = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    )
    expect(body.message).toBe('字幕を大きくして')
    expect(body.aspectRatio).toBe('16:9')
    expect(body.fps).toBe(30)
  })
})
