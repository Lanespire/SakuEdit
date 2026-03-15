import { describe, it, expect } from 'vitest'
import {
  getCaptionOverlays,
  createCaptionOverlay,
  updateCaptionText,
  rebuildCaptionOverlays,
  applySilenceCut,
  removeSilenceCut,
  createTextOverlay,
  createImageOverlay,
  createAudioOverlay,
  type SubtitleData,
  type CanvasSize,
} from '@/lib/rve-bridge'
import { OverlayType } from '@/app/reactvideoeditor/pro/types'
import type {
  CaptionOverlay,
  ClipOverlay,
  Overlay,
  TextOverlay,
  ImageOverlay as ImageOverlayType,
  SoundOverlay,
} from '@/app/reactvideoeditor/pro/types'
import { EDITOR_FPS, type SilenceRegion } from '@/lib/editor'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const CANVAS: CanvasSize = { width: 1920, height: 1080 }

function makeVideoOverlay(
  overrides?: Partial<ClipOverlay>,
): ClipOverlay {
  return {
    id: 1,
    type: OverlayType.VIDEO,
    content: '',
    src: '/video.mp4',
    from: 0,
    durationInFrames: 300,
    left: 0,
    top: 0,
    width: 1920,
    height: 1080,
    row: 0,
    rotation: 0,
    isDragging: false,
    mediaSrcDuration: 10,
    styles: {},
    ...overrides,
  }
}

function makeTextOverlayStub(id: number): Overlay {
  return {
    id,
    type: OverlayType.TEXT,
    content: 'hello',
    from: 0,
    durationInFrames: 150,
    left: 0,
    top: 0,
    width: 200,
    height: 80,
    row: 1,
    rotation: 0,
    isDragging: false,
    styles: {
      fontSize: '36px',
      fontWeight: '500',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      fontFamily: 'Noto Sans JP',
      fontStyle: 'normal',
      textDecoration: 'none',
    },
  } as TextOverlay
}

function makeCaptionOverlayStub(id: number): CaptionOverlay {
  return {
    id,
    type: OverlayType.CAPTION,
    from: 0,
    durationInFrames: 90,
    left: 100,
    top: 800,
    width: 1688,
    height: 280,
    row: 1,
    rotation: 0,
    isDragging: false,
    captions: [
      {
        text: 'テスト',
        startMs: 0,
        endMs: 3000,
        timestampMs: 0,
        confidence: 1,
        words: [
          { word: 'テ', startMs: 0, endMs: 1000, confidence: 1 },
          { word: 'ス', startMs: 1000, endMs: 2000, confidence: 1 },
          { word: 'ト', startMs: 2000, endMs: 3000, confidence: 1 },
        ],
      },
    ],
    styles: {
      fontFamily: 'Noto Sans JP, sans-serif',
      fontSize: '43px',
      lineHeight: 1.4,
      textAlign: 'center',
      color: '#FFFFFF',
      fontWeight: 500,
      textShadow: '0 2px 18px rgba(0,0,0,0.45)',
    },
    template: 'classic',
  }
}

// ---------------------------------------------------------------------------
// 1. getCaptionOverlays
// ---------------------------------------------------------------------------

describe('getCaptionOverlays', () => {
  it('空配列を渡すと空配列を返す', () => {
    expect(getCaptionOverlays([])).toEqual([])
  })

  it('CAPTIONオーバーレイのみの配列からすべてを返す', () => {
    const c1 = makeCaptionOverlayStub(1)
    const c2 = makeCaptionOverlayStub(2)
    const result = getCaptionOverlays([c1, c2])
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(2)
  })

  it('混合型の配列からCAPTIONのみフィルタする', () => {
    const text = makeTextOverlayStub(1)
    const caption = makeCaptionOverlayStub(2)
    const video = makeVideoOverlay({ id: 3 })
    const result = getCaptionOverlays([text, caption, video])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
    expect(result[0].type).toBe(OverlayType.CAPTION)
  })

  it('CAPTIONがない場合は空配列を返す', () => {
    const text = makeTextOverlayStub(1)
    const video = makeVideoOverlay({ id: 2 })
    expect(getCaptionOverlays([text, video])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 2. createCaptionOverlay
// ---------------------------------------------------------------------------

describe('createCaptionOverlay', () => {
  const subtitle: SubtitleData = {
    text: 'こんにちは世界',
    startTime: 1.0,
    endTime: 4.0,
  }

  it('デフォルト位置（bottom）でオーバーレイを生成する', () => {
    const result = createCaptionOverlay(subtitle, CANVAS, 10)
    expect(result.id).toBe(10)
    expect(result.type).toBe(OverlayType.CAPTION)
    expect(result.from).toBe(Math.round(1.0 * EDITOR_FPS))
    expect(result.durationInFrames).toBe(Math.ceil(3.0 * EDITOR_FPS))
    // bottom position: top should be near bottom of canvas
    expect(result.top).toBeGreaterThan(CANVAS.height * 0.5)
  })

  it('top位置で正しいバウンドを設定する', () => {
    const sub: SubtitleData = { ...subtitle, position: 'top' }
    const result = createCaptionOverlay(sub, CANVAS, 1)
    // top position: top should be near the top of canvas
    expect(result.top).toBeLessThan(CANVAS.height * 0.2)
  })

  it('center位置で正しいバウンドを設定する', () => {
    const sub: SubtitleData = { ...subtitle, position: 'center' }
    const result = createCaptionOverlay(sub, CANVAS, 1)
    // center position: top should be approximately center
    const expectedCenter = Math.round(CANVAS.height / 2)
    expect(Math.abs(result.top + result.height / 2 - expectedCenter)).toBeLessThan(50)
  })

  it('テキストのwordsを正しく分割する（日本語文字単位）', () => {
    const result = createCaptionOverlay(subtitle, CANVAS, 1)
    const words = result.captions[0].words
    // Japanese text without spaces splits by character
    expect(words.length).toBe('こんにちは世界'.length)
    expect(words[0].word).toBe('こ')
    expect(words[words.length - 1].word).toBe('界')
  })

  it('英語テキストはスペースで分割する', () => {
    const sub: SubtitleData = { text: 'Hello World Test', startTime: 0, endTime: 3 }
    const result = createCaptionOverlay(sub, CANVAS, 1)
    const words = result.captions[0].words
    expect(words).toHaveLength(3)
    expect(words[0].word).toBe('Hello')
    expect(words[1].word).toBe('World')
    expect(words[2].word).toBe('Test')
  })

  it('captionのstartMsは0から始まる（相対時間）', () => {
    const result = createCaptionOverlay(subtitle, CANVAS, 1)
    expect(result.captions[0].startMs).toBe(0)
  })

  it('空テキストでもクラッシュしない', () => {
    const sub: SubtitleData = { text: '', startTime: 0, endTime: 1 }
    const result = createCaptionOverlay(sub, CANVAS, 1)
    expect(result.captions[0].words).toEqual([])
  })

  it('width/heightが正の値を持つ', () => {
    const result = createCaptionOverlay(subtitle, CANVAS, 1)
    expect(result.width).toBeGreaterThan(0)
    expect(result.height).toBeGreaterThan(0)
  })

  it('durationInFramesが最低1フレームになる', () => {
    const sub: SubtitleData = { text: 'a', startTime: 1.0, endTime: 1.0 }
    const result = createCaptionOverlay(sub, CANVAS, 1)
    expect(result.durationInFrames).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// 3. updateCaptionText
// ---------------------------------------------------------------------------

describe('updateCaptionText', () => {
  it('テキストを更新しwordsを再構築する', () => {
    const overlay = makeCaptionOverlayStub(1)
    const updated = updateCaptionText(overlay, '新しいテキスト')
    expect(updated.captions[0].text).toBe('新しいテキスト')
    expect(updated.captions[0].words.length).toBe('新しいテキスト'.length)
    expect(updated.captions[0].words[0].word).toBe('新')
  })

  it('元のオーバーレイを変更しない（イミュータブル）', () => {
    const overlay = makeCaptionOverlayStub(1)
    const originalText = overlay.captions[0].text
    updateCaptionText(overlay, '変更後')
    expect(overlay.captions[0].text).toBe(originalText)
  })

  it('startMs/endMsを保持する', () => {
    const overlay = makeCaptionOverlayStub(1)
    const updated = updateCaptionText(overlay, 'abc')
    expect(updated.captions[0].startMs).toBe(overlay.captions[0].startMs)
    expect(updated.captions[0].endMs).toBe(overlay.captions[0].endMs)
  })

  it('idやtype等の他プロパティを維持する', () => {
    const overlay = makeCaptionOverlayStub(5)
    const updated = updateCaptionText(overlay, 'test')
    expect(updated.id).toBe(5)
    expect(updated.type).toBe(OverlayType.CAPTION)
    expect(updated.template).toBe('classic')
  })
})

// ---------------------------------------------------------------------------
// 4. rebuildCaptionOverlays
// ---------------------------------------------------------------------------

describe('rebuildCaptionOverlays', () => {
  it('既存の字幕を全て置き換える', () => {
    const existingCaption = makeCaptionOverlayStub(1)
    const text = makeTextOverlayStub(2)
    const overlays: Overlay[] = [existingCaption, text]

    const newSubtitles: SubtitleData[] = [
      { text: '字幕A', startTime: 0, endTime: 2 },
      { text: '字幕B', startTime: 2, endTime: 4 },
    ]

    const result = rebuildCaptionOverlays(newSubtitles, overlays, CANVAS)

    // text overlay should be preserved
    const textOverlays = result.filter((o) => o.type === OverlayType.TEXT)
    expect(textOverlays).toHaveLength(1)
    expect(textOverlays[0].id).toBe(2)

    // new captions should be created
    const captions = result.filter((o) => o.type === OverlayType.CAPTION)
    expect(captions).toHaveLength(2)
  })

  it('字幕が空の場合、CAPTIONを全て削除する', () => {
    const caption = makeCaptionOverlayStub(1)
    const text = makeTextOverlayStub(2)
    const result = rebuildCaptionOverlays([], [caption, text], CANVAS)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe(OverlayType.TEXT)
  })

  it('非CAPTIONオーバーレイを保持する', () => {
    const text = makeTextOverlayStub(1)
    const video = makeVideoOverlay({ id: 2 })
    const result = rebuildCaptionOverlays(
      [{ text: 'new', startTime: 0, endTime: 1 }],
      [text, video],
      CANVAS,
    )
    const nonCaptions = result.filter((o) => o.type !== OverlayType.CAPTION)
    expect(nonCaptions).toHaveLength(2)
  })

  it('新しいIDはmaxId + 1から連番で割り振る', () => {
    const text = makeTextOverlayStub(10)
    const subtitles: SubtitleData[] = [
      { text: 'A', startTime: 0, endTime: 1 },
      { text: 'B', startTime: 1, endTime: 2 },
    ]
    const result = rebuildCaptionOverlays(subtitles, [text], CANVAS)
    const captions = result.filter((o) => o.type === OverlayType.CAPTION)
    expect(captions[0].id).toBe(11)
    expect(captions[1].id).toBe(12)
  })
})

// ---------------------------------------------------------------------------
// 5. applySilenceCut
// ---------------------------------------------------------------------------

describe('applySilenceCut', () => {
  const fps = EDITOR_FPS // 30

  it('無音区間0件の場合、元のオーバーレイをそのまま返す', () => {
    const video = makeVideoOverlay()
    const result = applySilenceCut(video, [], fps)
    expect(result).toBe(video) // same reference
  })

  it('無音区間1件の場合、正しくセグメントを生成する', () => {
    // 10秒動画, 2~4秒を無音カット
    const video = makeVideoOverlay({ mediaSrcDuration: 10, durationInFrames: 300 })
    const regions: SilenceRegion[] = [{ start: 2, end: 4 }]
    const result = applySilenceCut(video, regions, fps)

    expect(result.segments).toBeDefined()
    expect(result.segments!.length).toBe(2)
    // segment 1: 0-60 frames (0~2秒)
    expect(result.segments![0]).toEqual({ startFrame: 0, endFrame: 60 })
    // segment 2: 120-300 frames (4~10秒)
    expect(result.segments![1]).toEqual({ startFrame: 120, endFrame: 300 })
    // duration = 60 + 180 = 240 frames (8秒)
    expect(result.durationInFrames).toBe(240)
  })

  it('無音区間が複数件の場合、すべてカットする', () => {
    // 10秒動画, 1~2秒と5~7秒を無音カット
    const video = makeVideoOverlay({ mediaSrcDuration: 10, durationInFrames: 300 })
    const regions: SilenceRegion[] = [
      { start: 1, end: 2 },
      { start: 5, end: 7 },
    ]
    const result = applySilenceCut(video, regions, fps)

    expect(result.segments).toBeDefined()
    expect(result.segments!.length).toBe(3)
    // 0-30 (0~1秒), 60-150 (2~5秒), 210-300 (7~10秒)
    expect(result.segments![0]).toEqual({ startFrame: 0, endFrame: 30 })
    expect(result.segments![1]).toEqual({ startFrame: 60, endFrame: 150 })
    expect(result.segments![2]).toEqual({ startFrame: 210, endFrame: 300 })
    // duration = 30 + 90 + 90 = 210 frames (7秒)
    expect(result.durationInFrames).toBe(210)
  })

  it('全区間が無音の場合、元のオーバーレイを返す', () => {
    const video = makeVideoOverlay({ mediaSrcDuration: 10, durationInFrames: 300 })
    const regions: SilenceRegion[] = [{ start: 0, end: 10 }]
    const result = applySilenceCut(video, regions, fps)
    // segments is empty, so original is returned
    expect(result).toBe(video)
  })

  it('ソートされていない無音区間でも正しく処理する', () => {
    const video = makeVideoOverlay({ mediaSrcDuration: 10, durationInFrames: 300 })
    const regions: SilenceRegion[] = [
      { start: 5, end: 7 },
      { start: 1, end: 2 },
    ]
    const result = applySilenceCut(video, regions, fps)
    // Should produce same result as sorted
    expect(result.segments).toBeDefined()
    expect(result.segments!.length).toBe(3)
    expect(result.segments![0]).toEqual({ startFrame: 0, endFrame: 30 })
  })

  it('先頭が無音の場合、先頭セグメントをスキップする', () => {
    const video = makeVideoOverlay({ mediaSrcDuration: 10, durationInFrames: 300 })
    const regions: SilenceRegion[] = [{ start: 0, end: 3 }]
    const result = applySilenceCut(video, regions, fps)
    expect(result.segments).toBeDefined()
    expect(result.segments![0].startFrame).toBe(90) // 3秒目から
    expect(result.durationInFrames).toBe(210) // 7秒分
  })

  it('末尾が無音の場合、末尾セグメントをスキップする', () => {
    const video = makeVideoOverlay({ mediaSrcDuration: 10, durationInFrames: 300 })
    const regions: SilenceRegion[] = [{ start: 8, end: 10 }]
    const result = applySilenceCut(video, regions, fps)
    expect(result.segments).toBeDefined()
    expect(result.segments![0]).toEqual({ startFrame: 0, endFrame: 240 })
    expect(result.durationInFrames).toBe(240)
  })

  it('元のオーバーレイを変更しない（イミュータブル）', () => {
    const video = makeVideoOverlay({ mediaSrcDuration: 10, durationInFrames: 300 })
    const originalDuration = video.durationInFrames
    applySilenceCut(video, [{ start: 2, end: 4 }], fps)
    expect(video.durationInFrames).toBe(originalDuration)
    expect(video.segments).toBeUndefined()
  })

  it('mediaSrcDurationがない場合、durationInFrames/fpsから計算する', () => {
    const video = makeVideoOverlay({ mediaSrcDuration: undefined, durationInFrames: 300 })
    const regions: SilenceRegion[] = [{ start: 2, end: 4 }]
    const result = applySilenceCut(video, regions, fps)
    expect(result.segments).toBeDefined()
    expect(result.segments!.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// 6. removeSilenceCut
// ---------------------------------------------------------------------------

describe('removeSilenceCut', () => {
  it('segmentsをundefinedにしてdurationInFramesを復元する', () => {
    const video = makeVideoOverlay({
      mediaSrcDuration: 10,
      durationInFrames: 240,
      segments: [
        { startFrame: 0, endFrame: 60 },
        { startFrame: 120, endFrame: 300 },
      ],
    })
    const result = removeSilenceCut(video)
    expect(result.segments).toBeUndefined()
    // mediaSrcDuration=10 * EDITOR_FPS=30 = 300
    expect(result.durationInFrames).toBe(Math.max(EDITOR_FPS, Math.ceil(10 * EDITOR_FPS)))
  })

  it('mediaSrcDurationがない場合、現在のdurationInFramesを維持する', () => {
    const video = makeVideoOverlay({
      mediaSrcDuration: undefined,
      durationInFrames: 240,
      segments: [{ startFrame: 0, endFrame: 240 }],
    })
    const result = removeSilenceCut(video)
    expect(result.segments).toBeUndefined()
    expect(result.durationInFrames).toBe(240)
  })

  it('segmentsがない状態でも安全に動作する', () => {
    const video = makeVideoOverlay({ mediaSrcDuration: 5 })
    const result = removeSilenceCut(video)
    expect(result.segments).toBeUndefined()
    expect(result.durationInFrames).toBe(Math.max(EDITOR_FPS, Math.ceil(5 * EDITOR_FPS)))
  })

  it('元のオーバーレイを変更しない（イミュータブル）', () => {
    const segments = [{ startFrame: 0, endFrame: 60 }]
    const video = makeVideoOverlay({ mediaSrcDuration: 10, segments })
    removeSilenceCut(video)
    expect(video.segments).toBeDefined()
    expect(video.segments).toBe(segments)
  })
})

// ---------------------------------------------------------------------------
// 7. createTextOverlay
// ---------------------------------------------------------------------------

describe('createTextOverlay', () => {
  it('正しいプロパティでTextOverlayを生成する', () => {
    const result = createTextOverlay('テスト', CANVAS, 42)
    expect(result.id).toBe(42)
    expect(result.type).toBe(OverlayType.TEXT)
    expect(result.content).toBe('テスト')
    expect(result.durationInFrames).toBe(EDITOR_FPS * 5)
    expect(result.width).toBeGreaterThan(0)
    expect(result.height).toBe(80)
  })

  it('キャンバス中央に配置する', () => {
    const result = createTextOverlay('text', CANVAS, 1)
    const centerX = CANVAS.width / 2
    const centerY = CANVAS.height / 2
    expect(Math.abs(result.left + result.width / 2 - centerX)).toBeLessThan(2)
    expect(Math.abs(result.top + result.height / 2 - centerY)).toBeLessThan(2)
  })

  it('幅はキャンバス幅の60%か600のうち小さい方', () => {
    const result = createTextOverlay('text', CANVAS, 1)
    expect(result.width).toBe(Math.min(Math.round(CANVAS.width * 0.6), 600))
  })

  it('小さなキャンバスでも正しく動作する', () => {
    const small: CanvasSize = { width: 320, height: 240 }
    const result = createTextOverlay('text', small, 1)
    expect(result.width).toBe(Math.round(320 * 0.6))
    expect(result.left).toBeGreaterThanOrEqual(0)
    expect(result.top).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// 8. createImageOverlay
// ---------------------------------------------------------------------------

describe('createImageOverlay', () => {
  it('正しいプロパティでImageOverlayを生成する', () => {
    const result = createImageOverlay('/img.png', CANVAS, 7)
    expect(result.id).toBe(7)
    expect(result.type).toBe(OverlayType.IMAGE)
    expect(result.src).toBe('/img.png')
    expect(result.durationInFrames).toBe(EDITOR_FPS * 5)
  })

  it('サイズはキャンバスの短辺の40%', () => {
    const result = createImageOverlay('/img.png', CANVAS, 1)
    const expectedSize = Math.round(Math.min(CANVAS.width, CANVAS.height) * 0.4)
    expect(result.width).toBe(expectedSize)
    expect(result.height).toBe(expectedSize)
  })

  it('キャンバス中央に配置する', () => {
    const result = createImageOverlay('/img.png', CANVAS, 1)
    const centerX = CANVAS.width / 2
    const centerY = CANVAS.height / 2
    expect(Math.abs(result.left + result.width / 2 - centerX)).toBeLessThan(2)
    expect(Math.abs(result.top + result.height / 2 - centerY)).toBeLessThan(2)
  })

  it('objectFitがcontainに設定される', () => {
    const result = createImageOverlay('/img.png', CANVAS, 1)
    expect(result.styles.objectFit).toBe('contain')
  })
})

// ---------------------------------------------------------------------------
// 9. createAudioOverlay
// ---------------------------------------------------------------------------

describe('createAudioOverlay', () => {
  it('正しいプロパティでSoundOverlayを生成する', () => {
    const result = createAudioOverlay('/audio.mp3', 15.5, 99)
    expect(result.id).toBe(99)
    expect(result.type).toBe(OverlayType.SOUND)
    expect(result.src).toBe('/audio.mp3')
    expect(result.content).toBe('/audio.mp3')
    expect(result.mediaSrcDuration).toBe(15.5)
  })

  it('durationInFramesはfpsベースで計算される', () => {
    const result = createAudioOverlay('/audio.mp3', 5, 1)
    expect(result.durationInFrames).toBe(Math.ceil(5 * EDITOR_FPS))
  })

  it('durationが0でも最低1フレーム', () => {
    const result = createAudioOverlay('/audio.mp3', 0, 1)
    expect(result.durationInFrames).toBeGreaterThanOrEqual(1)
  })

  it('ビジュアル要素のサイズは0（音声なので非表示）', () => {
    const result = createAudioOverlay('/audio.mp3', 5, 1)
    expect(result.width).toBe(0)
    expect(result.height).toBe(0)
  })

  it('volumeが1に設定される', () => {
    const result = createAudioOverlay('/audio.mp3', 5, 1)
    expect(result.styles.volume).toBe(1)
  })

  it('rowが2に設定される（オーディオトラック）', () => {
    const result = createAudioOverlay('/audio.mp3', 5, 1)
    expect(result.row).toBe(2)
  })
})
