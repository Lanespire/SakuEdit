import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

import { OverlayType } from '@/app/reactvideoeditor/pro/types'
import type { ClipOverlay, CaptionOverlay, Overlay } from '@/app/reactvideoeditor/pro/types'

// ---- Mocks ----

const mockChangeOverlay = vi.fn()
const mockSetOverlays = vi.fn()
let mockOverlays: Overlay[] = []

vi.mock('@/app/reactvideoeditor/pro/contexts/editor-context', () => ({
  useEditorContext: () => ({
    overlays: mockOverlays,
    changeOverlay: mockChangeOverlay,
    setOverlays: mockSetOverlays,
    aspectRatio: '16:9',
  }),
}))

vi.mock('@/app/reactvideoeditor/pro/utils/aspect-ratio-transform', () => ({
  getDimensionsForAspectRatio: () => ({ width: 1920, height: 1080 }),
}))

vi.mock('@/lib/rve-bridge', () => ({
  applySilenceCut: vi.fn((_overlay: ClipOverlay) => ({
    ..._overlay,
    segments: [{ startFrame: 0, endFrame: 100 }],
  })),
  removeSilenceCut: vi.fn((_overlay: ClipOverlay) => {
    const { segments: _s, ...rest } = _overlay as ClipOverlay & { segments?: unknown }
    void _s
    return rest
  }),
  rebuildCaptionOverlays: vi.fn((_subs: unknown, overlays: Overlay[]) => overlays),
}))

vi.mock('@/lib/editor', () => ({
  EDITOR_FPS: 30,
}))

// Import component after mocks
import { RveCutPanel } from '@/components/rve/panels/RveCutPanel'

// ---- Helpers ----

function makeVideoOverlay(overrides: Partial<ClipOverlay> = {}): ClipOverlay {
  return {
    id: 1,
    type: OverlayType.VIDEO,
    content: 'test.mp4',
    src: '/test.mp4',
    from: 0,
    durationInFrames: 300,
    left: 0,
    top: 0,
    width: 1920,
    height: 1080,
    row: 0,
    rotation: 0,
    isDragging: false,
    styles: {},
    ...overrides,
  } as ClipOverlay
}

function makeCaptionOverlay(id: number): CaptionOverlay {
  return {
    id,
    type: OverlayType.CAPTION,
    from: 0,
    durationInFrames: 150,
    left: 0,
    top: 800,
    width: 1920,
    height: 100,
    row: 1,
    rotation: 0,
    isDragging: false,
    captions: [],
    template: 'classic',
  } as CaptionOverlay
}

// ---- Tests ----

describe('RveCutPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockOverlays = []
    mockChangeOverlay.mockReset()
    mockSetOverlays.mockReset()
  })

  // ------------------------------------------
  // ビデオoverlayなし時の空状態表示
  // ------------------------------------------
  it('ビデオoverlayなし時の空状態表示', () => {
    mockOverlays = []
    render(<RveCutPanel />)
    expect(screen.getByText('動画がありません')).toBeInTheDocument()
  })

  // ------------------------------------------
  // 「無音区間を検出」ボタン表示
  // ------------------------------------------
  it('ビデオoverlayあり時に「無音区間を検出」ボタンを表示', () => {
    mockOverlays = [makeVideoOverlay()]
    render(<RveCutPanel />)
    expect(screen.getByText('無音区間を検出')).toBeInTheDocument()
  })

  // ------------------------------------------
  // 無音カット適用済み時の「カットを解除」ボタン表示
  // ------------------------------------------
  it('セグメントがある場合「カットを解除」ボタンを表示', () => {
    mockOverlays = [
      makeVideoOverlay({
        segments: [
          { startFrame: 0, endFrame: 100 },
          { startFrame: 150, endFrame: 300 },
        ],
      }),
    ]
    render(<RveCutPanel />)
    expect(screen.getByText('カットを解除')).toBeInTheDocument()
    expect(screen.getByText(/無音カット適用済み/)).toBeInTheDocument()
  })

  it('「カットを解除」をクリックすると changeOverlay が呼ばれる', () => {
    mockOverlays = [
      makeVideoOverlay({
        segments: [{ startFrame: 0, endFrame: 100 }],
      }),
    ]
    render(<RveCutPanel />)
    fireEvent.click(screen.getByText('カットを解除'))
    expect(mockChangeOverlay).toHaveBeenCalledWith(1, expect.any(Function))
  })

  // ------------------------------------------
  // 「文字起こしから字幕を取得」ボタン表示
  // ------------------------------------------
  it('字幕なしの場合「文字起こしから字幕を取得」ボタンを表示', () => {
    mockOverlays = [makeVideoOverlay()]
    render(<RveCutPanel />)
    expect(screen.getByText('文字起こしから字幕を取得')).toBeInTheDocument()
  })

  // ------------------------------------------
  // 字幕ありの場合の「字幕を再読み込み」表示
  // ------------------------------------------
  it('字幕ありの場合「字幕を再読み込み」ボタンを表示', () => {
    mockOverlays = [makeVideoOverlay(), makeCaptionOverlay(2), makeCaptionOverlay(3)]
    render(<RveCutPanel />)
    expect(screen.getByText('字幕を再読み込み')).toBeInTheDocument()
    expect(screen.getByText(/現在 2 件の字幕/)).toBeInTheDocument()
  })

  // ------------------------------------------
  // 無音検出ボタンクリック時の fetch 呼び出し
  // ------------------------------------------
  it('無音検出ボタンクリックで fetch を呼び出す', async () => {
    mockOverlays = [makeVideoOverlay()]

    // window.location.pathname をモック
    Object.defineProperty(window, 'location', {
      value: { pathname: '/edit/project-123' },
      writable: true,
    })

    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          project: {
            videos: [
              {
                silenceDetected: [
                  { start: 1.0, end: 2.5 },
                  { start: 5.0, end: 6.0 },
                ],
              },
            ],
          },
        }),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    render(<RveCutPanel />)
    fireEvent.click(screen.getByText('無音区間を検出'))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/projects/project-123')
    })

    await waitFor(() => {
      expect(screen.getByText(/2 箇所の無音区間を検出/)).toBeInTheDocument()
    })
  })

  // ------------------------------------------
  // 字幕再読み込みの fetch 呼び出し
  // ------------------------------------------
  it('字幕再読み込みボタンクリックで fetch を呼び出す', async () => {
    mockOverlays = [makeVideoOverlay()]

    Object.defineProperty(window, 'location', {
      value: { pathname: '/edit/project-456' },
      writable: true,
    })

    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          subtitles: [
            { text: 'こんにちは', startTime: 0, endTime: 1.5 },
          ],
        }),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    render(<RveCutPanel />)
    fireEvent.click(screen.getByText('文字起こしから字幕を取得'))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/projects/project-456/subtitles')
    })
  })
})
