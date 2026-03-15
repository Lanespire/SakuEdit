import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

import { OverlayType } from '@/app/reactvideoeditor/pro/types'
import type { CaptionOverlay, Overlay } from '@/app/reactvideoeditor/pro/types'

// ---- Mocks ----

const mockChangeOverlay = vi.fn()
let mockOverlays: Overlay[] = []

vi.mock('@/app/reactvideoeditor/pro/contexts/editor-context', () => ({
  useEditorContext: () => ({
    overlays: mockOverlays,
    changeOverlay: mockChangeOverlay,
  }),
}))

vi.mock('@/app/reactvideoeditor/pro/templates/caption-templates', () => ({
  captionTemplates: {
    classic: {
      name: 'クラシック',
      preview: 'テスト',
      styles: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '2.2rem',
        lineHeight: 1.4,
        textAlign: 'center' as const,
        color: '#FFFFFF',
        fontWeight: 500,
      },
    },
    minimal: {
      name: 'ミニマル',
      preview: 'テスト',
      styles: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '1.8rem',
        lineHeight: 1.4,
        textAlign: 'center' as const,
        color: '#CCCCCC',
        fontWeight: 400,
      },
    },
    hustle: {
      name: 'ハッスル',
      preview: 'テスト',
      styles: {
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '2.2rem',
        lineHeight: 1.3,
        textAlign: 'center' as const,
        color: '#FFFFFF',
        fontWeight: 800,
      },
    },
    neon: {
      name: 'ネオン',
      preview: 'テスト',
      styles: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '2rem',
        lineHeight: 1.4,
        textAlign: 'center' as const,
        color: '#00FF00',
        textShadow: '0 0 10px #00FF00',
      },
    },
    retro: {
      name: 'レトロ',
      preview: 'テスト',
      styles: {
        fontFamily: 'Georgia, serif',
        fontSize: '2rem',
        lineHeight: 1.4,
        textAlign: 'center' as const,
        color: '#FFD700',
      },
    },
  },
}))

// Import component after mocks
import { RveStylePanel } from '@/components/rve/panels/RveStylePanel'

// ---- Helpers ----

function makeCaptionOverlay(
  id: number,
  template = 'classic',
): CaptionOverlay {
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
    template,
  } as CaptionOverlay
}

// ---- Tests ----

describe('RveStylePanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockOverlays = []
    mockChangeOverlay.mockReset()
  })

  // ------------------------------------------
  // 字幕なし時の空状態メッセージ
  // ------------------------------------------
  it('字幕なし時の空状態メッセージを表示', () => {
    mockOverlays = []
    render(<RveStylePanel />)
    expect(screen.getByText('字幕がありません')).toBeInTheDocument()
    expect(screen.getByText('字幕を追加してからスタイルを設定できます')).toBeInTheDocument()
  })

  // ------------------------------------------
  // プリセット一覧表示（5種類）
  // ------------------------------------------
  it('字幕がある場合プリセット一覧を5種類表示', () => {
    mockOverlays = [makeCaptionOverlay(1)]
    render(<RveStylePanel />)

    expect(screen.getByText('クラシック')).toBeInTheDocument()
    expect(screen.getByText('ミニマル')).toBeInTheDocument()
    expect(screen.getByText('ポップ')).toBeInTheDocument()
    expect(screen.getByText('ネオン')).toBeInTheDocument()
    expect(screen.getByText('レトロ')).toBeInTheDocument()
  })

  it('プリセットの説明文を表示', () => {
    mockOverlays = [makeCaptionOverlay(1)]
    render(<RveStylePanel />)

    expect(screen.getByText('シンプルな白文字')).toBeInTheDocument()
    expect(screen.getByText('控えめなスタイル')).toBeInTheDocument()
    expect(screen.getByText('太字でインパクト')).toBeInTheDocument()
    expect(screen.getByText('光る文字効果')).toBeInTheDocument()
    expect(screen.getByText('レトロ風味')).toBeInTheDocument()
  })

  // ------------------------------------------
  // 現在のテンプレートが選択状態で表示
  // ------------------------------------------
  it('現在のテンプレートがハイライトされる', () => {
    mockOverlays = [makeCaptionOverlay(1, 'classic')]
    const { container } = render(<RveStylePanel />)

    // classicプリセットのボタンがactiveクラスを持つ
    const buttons = container.querySelectorAll('button')
    const classicButton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('クラシック'),
    )
    expect(classicButton).toBeDefined()
    expect(classicButton?.className).toContain('border-primary')
  })

  it('別テンプレートが選択されている場合そちらがハイライトされる', () => {
    mockOverlays = [makeCaptionOverlay(1, 'neon')]
    const { container } = render(<RveStylePanel />)

    const buttons = container.querySelectorAll('button')
    const neonButton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('ネオン'),
    )
    expect(neonButton).toBeDefined()
    expect(neonButton?.className).toContain('border-primary')
  })

  // ------------------------------------------
  // プリセットクリックで changeOverlay が呼ばれる
  // ------------------------------------------
  it('プリセットをクリックすると changeOverlay が呼ばれる', () => {
    mockOverlays = [makeCaptionOverlay(1), makeCaptionOverlay(2)]
    render(<RveStylePanel />)

    const minimalButton = screen.getByText('ミニマル').closest('button')
    expect(minimalButton).toBeDefined()
    fireEvent.click(minimalButton!)

    // 2つのキャプションオーバーレイそれぞれに対して呼ばれる
    expect(mockChangeOverlay).toHaveBeenCalledTimes(2)
    expect(mockChangeOverlay).toHaveBeenCalledWith(1, expect.any(Function))
    expect(mockChangeOverlay).toHaveBeenCalledWith(2, expect.any(Function))
  })

  // ------------------------------------------
  // サンプルテキストのプレビュー表示
  // ------------------------------------------
  it('各プリセットにサンプルテキストのプレビューを表示', () => {
    mockOverlays = [makeCaptionOverlay(1)]
    render(<RveStylePanel />)

    const sampleTexts = screen.getAllByText('サンプルテキスト')
    expect(sampleTexts).toHaveLength(5)
  })
})
