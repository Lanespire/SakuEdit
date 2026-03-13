# SakuEdit 全機能編集画面 完全設計・実装プラン

## Context

現在の編集画面は字幕表示+無音カットのみ対応。ユーザーの要望は「Remotionの全機能を活用し、AIチャットから自然言語でテキスト追加・カット・エフェクト・SE/BGMなど全て操作できる編集画面」。さらにMediaBunny v1.39.1の150+のAPIを最大限活用し、FFmpegへの依存を削減する。

**核心アーキテクチャ**:
- **DB** = 永続的なsource of truth（Project.compositionData JSON文字列として保存）
- **Zustand composition-store** = 編集中のワーキングコピー（CompositionData型）
- **Remotion** = CompositionDataを受け取って映像をレンダリングする純粋関数
- AIチャットもUIもZustand storeのCompositionDataを読み書きし、自動保存でDBに永続化
- コマンドエグゼキュータ等の中間層は不要

---

## ファクトチェック済み項目（Codex + npm registry + 型定義で実機検証）

| 項目 | 検証方法 | 結果 |
|---|---|---|
| @remotion/sfx | npm install + index.mjs読み | ✅ 11種のURL文字列（コンポーネントではない） |
| @remotion/noise | .d.ts確認 | ✅ noise2D, noise3D, noise4D |
| @remotion/shapes | .d.ts確認 | ✅ 9コンポーネント（Rect,Circle,Triangle,Star,Ellipse,Pie,Arrow,Heart,Polygon） |
| @remotion/paths | .d.ts確認 | ✅ evolvePath, getLength, interpolatePath等20関数 |
| @remotion/light-leaks | .d.ts + GitHub src | ✅ LightLeak (props: seed, hueShift, durationInFrames) |
| @remotion/motion-blur | .d.ts確認 | ✅ CameraMotionBlur + Trail（2コンポーネント） |
| @remotion/rounded-text-box | .d.ts確認 | ✅ createRoundedTextBox()関数（SVGパス返却） |
| @remotion/layout-utils | .d.ts確認 | ✅ measureText, fitText, fillTextBox, fitTextOnNLines |
| @remotion/web-renderer | .d.ts + package.json | ✅ renderMediaOnWeb（⚠️ UNLICENSED, 内部で mediabunny@1.37.0使用 ≠ アプリの1.39.1） |
| ~~@remotion/starburst~~ | npm registry | ❌ v4.0.434に存在しない（v4.0.435のみ）→ **プランから除外** |
| MediaBunny CanvasSink/AudioBufferSink/Conversion | .d.ts確認 | ✅ 全て実在 |
| MediaBunny TextSubtitleSource | .d.ts確認 | ✅ 実在 |
| MediaBunny全Sourceクラス | .d.ts grep | ✅ 20クラス実在 |
| Beatoven.ai API | GitHub api-spec.md | ✅ POST /api/v1/tracks/compose, GET /api/v1/tasks/<id> |

---

## Phase 1: CompositionData型システム + Remotionパッケージ追加

### 目的
全編集要素を表現するCompositionData Zodスキーマを定義し、必要な全Remotionパッケージをインストール。

### 新規ファイル

**`lib/composition-data.ts`** (~500行)

Zodスキーマで全トラック・全要素を網羅的に定義:

```typescript
CompositionData {
  meta: {
    width: number          // デフォルト1920
    height: number         // デフォルト1080
    fps: number            // デフォルト30 (EDITOR_FPS)
    durationSeconds: number
    backgroundColor: string // デフォルト '#000'
  }
  videoTrack: VideoTrackItem[] {
    id, sourceUrl, playbackSegments: PlaybackSegment[]
    volume, opacity, playbackRate, startTime, endTime
    fit: 'cover' | 'contain' | 'fill'
    transparency: boolean  // ProRes/VP9 alpha対応
    loop: boolean
  }
  audioTracks: AudioTrackItem[] {
    id, sourceUrl, category: 'bgm' | 'se' | 'voiceover' | 'sfx-builtin'
    volume, startTime, endTime
    fadeInSeconds, fadeOutSeconds
    loop, playbackRate, pitch
    sfxType?: string       // @remotion/sfx用（URL文字列をエクスポート）:
                           // 'whoosh' | 'whip' | 'pageTurn' | 'uiSwitch' | 'mouseClick'
                           // | 'shutterModern' | 'shutterOld' | 'ding' | 'bruh' | 'vineBoom' | 'windowsXpError'
                           // 使い方: import { whoosh } from '@remotion/sfx'; <Audio src={whoosh} />
  }
  subtitleTrack: SubtitleItem[] {
    id, text, startTime, endTime
    position: 'top' | 'center' | 'bottom'
    fontSize, fontColor, backgroundColor, fontFamily
    isBold, isItalic
    animation: 'fade' | 'spring' | 'typewriter' | 'word-highlight' | 'none'
    displayMode: 'word-level' | 'sentence' | 'tiktok-paging'  // TikTok風キャプション対応
    strokeColor?, strokeWidth?  // テキストストローク
    shadowColor?, shadowBlur?
  }
  effectTrack: EffectItem[] {
    id, startTime, endTime, effectType:
      | 'particle'         // @remotion/noise: noise2D/3D粒子
      | 'light-leak'       // @remotion/light-leaks
      | 'camera-motion-blur' // @remotion/motion-blur: CameraMotionBlur
      | 'trail'            // @remotion/motion-blur: Trail (残像エフェクト)
      | 'transition-fade'  // @remotion/transitions: fade
      | 'transition-slide' // slide
      | 'transition-wipe'  // wipe
      | 'transition-flip'  // flip
      | 'transition-clock-wipe' // clockWipe
      | 'noise-gradient'   // @remotion/noise: ノイズグラデーション
      | 'audio-visualizer' // @remotion/media-utils: 音声ビジュアライザ
      | 'path-animation'   // @remotion/paths: SVGパスアニメ
    config: Record<string, unknown>  // effectType固有のパラメータ
  }
  overlayTrack: OverlayItem[] {
    id, startTime, endTime, layer: number
    position: { x, y }     // パーセンテージ or ピクセル
    size: { width, height }
    rotation: number
    opacity: number
    animation: {
      type: 'fade-in' | 'slide-in' | 'scale-in' | 'spring' | 'none'
      easing?: string
      durationFrames?: number
    }
    overlayType:
      | 'text' → { content, fontSize, fontFamily, fontColor, backgroundColor, textAlign,
                    fitMode: 'none' | 'fit-text' | 'fill-text-box',
                    animatedText: 'typewriter' | 'word-by-word' | 'none' }
      | 'image' → { sourceUrl, fit: 'cover' | 'contain' | 'fill' }
      | 'lottie' → { sourceUrl, playbackRate, loop }
      | 'gif' → { sourceUrl, playbackRate, loopBehavior }
      | 'rive' → { sourceUrl, artboard, stateMachine }
      | 'shape' → { shapeType: 'rect' | 'circle' | 'triangle' | 'star' | 'ellipse' | 'pie'
                    | 'arrow' | 'heart' | 'polygon',
                    fill, stroke, strokeWidth, cornerRadius }
      | 'rounded-text-box' → { text, fontSize, padding, backgroundColor, borderRadius,
                                fontFamily }
      | 'chart' → { chartType: 'bar' | 'pie' | 'line' | 'stock',
                    data, colors, animation }
      | '3d-scene' → { sceneConfig, cameraPosition, lightConfig }
      | 'skia-canvas' → { drawCommands }
      | 'map' → { center, zoom, pitch, bearing, markers, lineCoordinates,
                  style, cameraAnimation }
  }
  captionTrack?: CaptionItem[] {
    id, text, startMs, endMs, confidence
    tokens?: { text, fromMs, toMs }[]
    displayStyle: 'highlighted-word' | 'karaoke' | 'bounce'
  }
}
```

**パッチシステム:**
```typescript
CompositionPatch =
  | { op: 'add_item', track: TrackName, item: TrackItem, index?: number }
  | { op: 'remove_item', track: TrackName, itemId: string }
  | { op: 'update_item', track: TrackName, itemId: string, fields: Partial<TrackItem> }
  | { op: 'update_meta', fields: Partial<CompositionMeta> }
  | { op: 'reorder_items', track: TrackName, itemIds: string[] }
  | { op: 'duplicate_item', track: TrackName, itemId: string, newId: string }

applyPatches(data: CompositionData, patches: CompositionPatch[]): CompositionData
validateCompositionData(data: CompositionData): ValidationResult
compositionDataFromLegacy(subtitles, markers, playbackSegments, video, ...): CompositionData
compositionDataToLegacy(data: CompositionData): { subtitles, markers, ... }
```

### パッケージインストール

```bash
# 高優先度 - Phase 2で即使用
npm i @remotion/transitions @remotion/shapes @remotion/noise \
      @remotion/animation-utils @remotion/media-utils \
      @remotion/layout-utils @remotion/paths

# ビジュアル・エフェクト
npm i @remotion/lottie @remotion/gif @remotion/rive \
      @remotion/motion-blur @remotion/rounded-text-box \
      @remotion/light-leaks

# フォント・テキスト
npm i @remotion/google-fonts @remotion/tailwind

# 3D・高度描画
npm i @remotion/three @remotion/skia

# メディア処理
npm i @remotion/media-parser @remotion/webcodecs \
      @remotion/whisper-web @remotion/web-renderer

# SFX
npm i @remotion/sfx
```

### 既存ファイル変更
- **`prisma/schema.prisma`**: Projectモデルに `compositionData String?` フィールド追加
- マイグレーション実行

### 検証
- `npx tsc --noEmit` で型チェック通過
- `applyPatches()` の全操作テスト
- `compositionDataFromLegacy()` 変換テスト

---

## Phase 2: UniversalComposition + 全レンダラーコンポーネント

### 目的
CompositionDataを受け取り全要素をレンダリングするUniversalCompositionを構築。

### 新規ファイル

**`remotion/compositions/UniversalComposition.tsx`** (~180行)
```tsx
<AbsoluteFill style={{ backgroundColor: compositionData.meta.backgroundColor }}>
  <VideoTrackRenderer items={compositionData.videoTrack} fps={fps} />
  <AudioTrackRenderer items={compositionData.audioTracks} fps={fps} />
  <EffectTrackRenderer items={compositionData.effectTrack} fps={fps}
    audioTracks={compositionData.audioTracks} />
  <OverlayTrackRenderer items={compositionData.overlayTrack} fps={fps} />
  <SubtitleTrackRenderer items={compositionData.subtitleTrack} fps={fps}
    playbackSegments={compositionData.videoTrack[0]?.playbackSegments} />
  {compositionData.captionTrack && (
    <CaptionTrackRenderer items={compositionData.captionTrack} fps={fps} />
  )}
</AbsoluteFill>
```

**レンダラーコンポーネント:**

| ファイル | 行数 | 説明 |
|---|---|---|
| `remotion/renderers/VideoTrackRenderer.tsx` | ~100 | PlaybackSegment→Sequence+Video、透過動画対応 |
| `remotion/renderers/SubtitleTrackRenderer.tsx` | ~150 | 5種アニメーション（fade/spring/typewriter/word-highlight/none） |
| `remotion/renderers/CaptionTrackRenderer.tsx` | ~120 | TikTok風ワードレベルキャプション |
| `remotion/renderers/AudioTrackRenderer.tsx` | ~100 | BGM/SE/ナレーション、@remotion/sfx対応 |
| `remotion/renderers/EffectTrackRenderer.tsx` | ~250 | 12種エフェクト |
| `remotion/renderers/OverlayTrackRenderer.tsx` | ~300 | 12種オーバーレイ |
| `remotion/renderers/TransitionRenderer.tsx` | ~80 | TransitionSeriesラッパー |

### EffectTrackRenderer 対応表

| effectType | パッケージ | 実装 |
|---|---|---|
| `particle` | `@remotion/noise` | noise2D/3Dで粒子座標計算 |
| `light-leak` | `@remotion/light-leaks` | `<LightLeak>` (seed, hueShift, durationInFrames) |
| `camera-motion-blur` | `@remotion/motion-blur` | `<CameraMotionBlur>` (shutterAngle, samples) |
| `trail` | `@remotion/motion-blur` | `<Trail>` (layers, lagInFrames, trailOpacity) |
| `transition-fade` | `@remotion/transitions` | `<TransitionSeries>` + fade() |
| `transition-slide` | `@remotion/transitions` | slide({ direction }) |
| `transition-wipe` | `@remotion/transitions` | wipe({ direction }) |
| `transition-flip` | `@remotion/transitions` | flip() |
| `transition-clock-wipe` | `@remotion/transitions` | clockWipe() |
| `noise-gradient` | `@remotion/noise` | ノイズグラデーション背景 |
| `audio-visualizer` | `@remotion/media-utils` | visualizeAudio()→スペクトラム |
| `path-animation` | `@remotion/paths` | evolvePath()でSVGパス描画 |

### OverlayTrackRenderer 対応表

| overlayType | パッケージ | 実装 |
|---|---|---|
| `text` | `@remotion/layout-utils`, `@remotion/google-fonts` | fitText、Googleフォント |
| `image` | remotion core (`<Img>`) | position/scale/rotation |
| `lottie` | `@remotion/lottie` | `<Lottie>` + delayRender |
| `gif` | `@remotion/gif` | `<Gif>` / `<AnimatedImage>` |
| `rive` | `@remotion/rive` | `<RemotionRive>` |
| `shape` | `@remotion/shapes` | 9種（Rect〜Polygon） |
| `rounded-text-box` | `@remotion/rounded-text-box` | createRoundedTextBox()→SVGパス |
| `chart` | `@remotion/paths` + SVG | evolvePath()でアニメグラフ |
| `3d-scene` | `@remotion/three` | `<ThreeCanvas>` |
| `skia-canvas` | `@remotion/skia` | `<SkiaCanvas>` |
| `map` | Mapbox GL | delayRender + Map |

### 既存ファイル変更

**`remotion/Root.tsx`** - UniversalComposition登録追加（既存VideoCompositionは維持）

### 検証
- Remotion Studio でUniversalCompositionプレビュー
- 字幕/動画が既存と同等に動作
- 各エフェクト単体テスト

---

## Phase 3: Zustand composition-store + レガシーデータ移行

### 目的
CompositionDataの状態管理ストアを構築し、既存editor-ui-storeからの移行パスを確立。

### 新規ファイル

**`lib/stores/composition-store.ts`** (~250行)
```typescript
interface CompositionStoreState {
  compositionData: CompositionData
  undoStack: CompositionData[]
  redoStack: CompositionData[]
  isDirty: boolean

  hydrateFromServer: (serverData: string) => void
  hydrateFromLegacy: (legacy: LegacyEditorData) => void
  applyPatches: (patches: CompositionPatch[]) => void
  applyPatchesNoHistory: (patches: CompositionPatch[]) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  getTrackItems: <T>(track: TrackName) => T[]
  getItemById: (track: TrackName, id: string) => TrackItem | undefined
  toInputProps: () => UniversalCompositionProps
  toJSON: () => string
  markClean: () => void
}
```

### 既存ファイル変更

- **`lib/stores/editor-ui-store.ts`**: UI状態のみ維持、データはcomposition-storeに委譲
- **`app/edit/[id]/page.tsx`**: composition-store初期化、自動保存、Remotion Player props切替
- **`lib/client/project-processing.ts`**: compositionData JSON保存対応
- **`app/api/projects/[id]/timeline/route.ts`**: compositionDataフィールド保存対応

### 検証
- legacy→CompositionData変換正常動作
- undo/redo全トラック横断動作
- 保存→リロードでデータ保持

---

## Phase 4: AIチャットエンジン（自然言語 → CompositionPatch[]）

### 目的
AIチャットから自然言語でCompositionDataを編集する機能を実装。

### 新規ファイル

**`lib/ai-composition-chat.ts`** (~350行)
```typescript
generateCompositionPatches(
  userMessage: string,
  currentData: CompositionData,
  chatHistory: AIChatMessage[],
  availableAssets?: { se?: FreesoundResult[], bgm?: BeatovenResult[] }
): Promise<{
  patches: CompositionPatch[]
  message: string
  needsAssetSearch?: { type: 'se' | 'bgm', query: string }
}>
```

**`app/api/projects/[id]/chat/route.ts`** (~100行)

### AIコマンド対応表

| ユーザー入力例 | パッチ操作 | 使用パッケージ |
|---|---|---|
| 「3分にテロップ追加」 | add_item → subtitleTrack | - |
| 「字幕を赤くして」 | update_item → subtitleTrack | - |
| 「字幕をTikTok風に」 | update_item (displayMode: 'tiktok-paging') | @remotion/captions |
| 「パーティクル追加」 | add_item → effectTrack (particle) | @remotion/noise |
| 「ライトリーク入れて」 | add_item → effectTrack (light-leak) | @remotion/light-leaks |
| 「フェードトランジション」 | add_item → effectTrack (transition-fade) | @remotion/transitions |
| 「モーションブラー」 | add_item → effectTrack (camera-motion-blur) | @remotion/motion-blur |
| 「残像エフェクト」 | add_item → effectTrack (trail) | @remotion/motion-blur |
| 「BGMつけて」 | add_item → audioTracks (bgm) | Beatoven.ai |
| 「シュッて音入れて」 | add_item → audioTracks (sfx-builtin: whoosh) | @remotion/sfx |
| 「テキストオーバーレイ」 | add_item → overlayTrack (text) | @remotion/layout-utils |
| 「星の形追加」 | add_item → overlayTrack (shape: star) | @remotion/shapes |

### 検証
- AIチャット→字幕追加→プレビュー表示
- フォローアップでスタイル変更
- undo/redoでAI操作巻き戻し

---

## Phase 5: マルチトラックタイムラインUI + プロパティパネル

### 目的
CompositionDataの全トラックを視覚的に操作できるタイムラインUIを構築。

### 新規ファイル

| ファイル | 行数 | 説明 |
|---|---|---|
| `components/editor/MultiTrackTimeline.tsx` | ~300 | 全トラック表示、ドラッグ移動/リサイズ |
| `components/editor/TrackItem.tsx` | ~120 | アイテム視覚表示、選択、コンテキストメニュー |
| `components/editor/PropertyPanel.tsx` | ~250 | 選択アイテムのプロパティ編集フォーム |
| `components/editor/AddItemPanel.tsx` | ~200 | カテゴリ別アイテム追加UI |

### トラック色分け
- video: 青, audio: 緑, subtitle: 黄, effect: 紫, overlay: オレンジ, caption: ピンク

### AddItemPanel カテゴリ
- テキスト: 字幕 / テロップ / テキストオーバーレイ / 丸角テキストボックス
- エフェクト: パーティクル / ライトリーク / モーションブラー / 残像 / トランジション等
- メディア: 画像 / GIF / Lottie / Rive
- 図形: 9種全て（長方形〜多角形）
- オーディオ: BGM / SE / ビルトインSE / ナレーション
- 高度: 3D / Skia / 地図 / グラフ

### 既存ファイル変更
- `app/edit/[id]/page.tsx`: 3ペインレイアウト（プレビュー+タイムライン+プロパティ）
- `lib/stores/editor-ui-store.ts`: selectedItemId/selectedItemTrack管理追加

---

## Phase 6: SE/BGM検索 + 外部API統合 + Voiceover

### 目的
Freesound APIでSE検索、Beatoven.aiでBGM生成、ElevenLabsでVoiceover生成を統合。

### 新規ファイル

| ファイル | 行数 | 説明 |
|---|---|---|
| `lib/freesound-client.ts` | ~100 | Freesound API v2 (CC0フィルタ付き) |
| `lib/beatoven-client.ts` | ~80 | Beatoven.ai Track Composition API |
| `lib/elevenlabs-client.ts` | ~100 | ElevenLabs TTS + SE生成 |
| `lib/remotion-sfx-adapter.ts` | ~60 | @remotion/sfx 11種マッピング |
| `app/api/audio/search/route.ts` | ~50 | Freesound検索プロキシ |
| `app/api/audio/generate-bgm/route.ts` | ~50 | Beatoven.ai BGM生成プロキシ |
| `app/api/audio/generate-voiceover/route.ts` | ~50 | ElevenLabs TTSプロキシ |
| `app/api/audio/generate-sfx/route.ts` | ~40 | ElevenLabs SE生成プロキシ |
| `components/editor/AudioBrowser.tsx` | ~200 | SE/BGM/ナレーション検索UI |

### フォールバックチェーン
1. **SE**: @remotion/sfx → Freesound(CC0) → ElevenLabs(AI生成)
2. **BGM**: Beatoven.ai → ユーザーアップロード
3. **ナレーション**: ElevenLabs TTS

### 環境変数
```
FREESOUND_API_KEY=...
BEATOVEN_API_KEY=...
ELEVENLABS_API_KEY=...
MAPBOX_TOKEN=...
```

---

## Phase 7: MediaBunny完全統合 + FFmpeg依存削減

### 目的
MediaBunny v1.39.1の150+ APIを最大活用し、FFmpegへの依存を最小化。

### 既存ファイル変更

**`lib/mediabunny-adapter.ts`** (114行 → ~400行)

```typescript
// 既存（改善）
getMediaDurationWithMediabunny(path)
getMediaMetadataWithMediabunny(path)

// スタブ → 完全実装
generateThumbnailWithMediabunny(path, timestamp, outputPath)  // CanvasSink
generateWaveformWithMediabunny(path, resolution)              // AudioBufferSink

// 新規追加
extractFrameAtTimestamp(path, timestamp)           // CanvasSink
extractFramesAtTimestamps(path, timestamps)        // CanvasSink (バッチ)
getDetailedMediaInfo(path)                         // computePacketStats
convertVideo(inputPath, outputPath, options)        // Conversion API
extractAudioBuffer(path, startTime?, endTime?)      // AudioBufferSink
embedSubtitles(videoPath, subtitles, outputPath)   // TextSubtitleSource
getMediaTags(path)                                 // metadata
setMediaTags(inputPath, tags, outputPath)           // MetadataTags
canProcessInBrowser(mimeType)                      // canDecodeVideo/Audio
```

### MediaBunny API活用マッピング

| MediaBunny API | 用途 | 代替するもの |
|---|---|---|
| `CanvasSink` | サムネイル/フレーム抽出 | FFmpeg `-ss -vframes 1` |
| `AudioBufferSink` | 波形/オーディオ解析 | FFmpeg `-f wav` |
| `Conversion API` | 動画変換/トリム | FFmpeg変換コマンド |
| `TextSubtitleSource` | 字幕埋め込み | FFmpegサブタイトルフィルタ |
| `MetadataTags` | メタデータ読み書き | FFprobe/FFmpeg |
| `computePacketStats()` | 詳細解析 | FFprobe -show_frames |
| `canDecodeVideo/Audio` | ランタイムチェック | なし（新機能） |

---

## 重要な既存コード再利用

| 既存コード | 場所 | 再利用箇所 |
|---|---|---|
| `buildDisplaySubtitles()` | `lib/editor.ts` | SubtitleTrackRenderer |
| `getPlaybackSegments()` | `lib/editor.ts` | VideoTrackRenderer, compositionDataFromLegacy |
| `mapSourceTimeToTimelineTime()` | `lib/editor.ts` | 全レンダラーの時間変換 |
| `mapTimelineTimeToSourceTime()` | `lib/editor.ts` | 全レンダラーの時間変換 |
| `sortSubtitles()` | `lib/editor.ts` | composition-store |
| `formatTimelineTime()` | `lib/editor.ts` | MultiTrackTimeline |
| `createNewSubtitle()` | `lib/editor.ts` | AddItemPanel |
| `getDurationInFrames()` | `lib/editor.ts` | Root.tsx calculateMetadata |
| ZAI API設定 | `lib/ai.ts` | ai-composition-chat |
| `createSnapshot()` / undo/redo | `lib/stores/editor-ui-store.ts` | composition-storeのundo/redo参考 |
| 字幕アニメーション | `remotion/compositions/VideoComposition.tsx` | SubtitleTrackRenderer |
| Segment→Sequence描画 | `remotion/compositions/VideoComposition.tsx` | VideoTrackRenderer |
| `segmentsToCaptions()` | `lib/remotion-captions-adapter.ts` | CaptionTrackRenderer |
| `shapeCaptionSegments()` | `lib/remotion-captions-adapter.ts` | CaptionTrackRenderer |
| `parseSrtToSegments()` | `lib/remotion-captions-adapter.ts` | SRTインポート |
| `transcribeWithRemotionWhisper()` | `lib/remotion-whisper-adapter.ts` | キャプション自動生成 |
| `getMediaDurationWithMediabunny()` | `lib/mediabunny-adapter.ts` | composition-store初期化 |
| `AudioWaveformTrack` | `components/editor/AudioWaveformTrack.tsx` | MultiTrackTimeline |

---

## ファイル変更サマリー

### 新規作成 (~30ファイル)
- `lib/composition-data.ts`
- `lib/stores/composition-store.ts`
- `lib/ai-composition-chat.ts`
- `lib/freesound-client.ts`
- `lib/beatoven-client.ts`
- `lib/elevenlabs-client.ts`
- `lib/remotion-sfx-adapter.ts`
- `remotion/compositions/UniversalComposition.tsx`
- `remotion/renderers/VideoTrackRenderer.tsx`
- `remotion/renderers/SubtitleTrackRenderer.tsx`
- `remotion/renderers/CaptionTrackRenderer.tsx`
- `remotion/renderers/AudioTrackRenderer.tsx`
- `remotion/renderers/EffectTrackRenderer.tsx`
- `remotion/renderers/OverlayTrackRenderer.tsx`
- `remotion/renderers/TransitionRenderer.tsx`
- `app/api/projects/[id]/chat/route.ts`
- `app/api/audio/search/route.ts`
- `app/api/audio/generate-bgm/route.ts`
- `app/api/audio/generate-voiceover/route.ts`
- `app/api/audio/generate-sfx/route.ts`
- `components/editor/MultiTrackTimeline.tsx`
- `components/editor/TrackItem.tsx`
- `components/editor/PropertyPanel.tsx`
- `components/editor/AddItemPanel.tsx`
- `components/editor/AudioBrowser.tsx`
- Prismaマイグレーション

### 変更 (~8ファイル)
- `remotion/Root.tsx`
- `lib/stores/editor-ui-store.ts`
- `app/edit/[id]/page.tsx`
- `lib/client/project-processing.ts`
- `prisma/schema.prisma`
- `package.json`
- `lib/mediabunny-adapter.ts`
- `lib/video-processor.ts`

---

## 実装順序と依存関係

```
Phase 1 (型+パッケージ) ──→ Phase 2 (レンダラー) ──→ Phase 3 (Store+移行)
                                                          │
                                                          ├──→ Phase 4 (AIチャット)
                                                          ├──→ Phase 5 (タイムラインUI)
                                                          ├──→ Phase 6 (SE/BGM/Voiceover)
                                                          └──→ Phase 7 (MediaBunny完全統合)
```

Phase 4/5/6/7 は Phase 3 完了後に並列実行可能。

---

## E2E検証チェックリスト

### ビルド・基本動作
- [ ] `npm run build` 成功
- [ ] `npx tsc --noEmit` 型エラーなし
- [ ] Remotion Studio でUniversalComposition表示

### データ移行・永続化
- [ ] 既存プロジェクト → legacy変換 → プレビュー正常
- [ ] 保存 → リロード → compositionData保持
- [ ] Undo/Redo → 全操作巻き戻し

### AIチャット
- [ ] 「字幕追加して」→ プレビュー反映
- [ ] 「ライトリーク入れて」→ エフェクト表示
- [ ] 「BGMつけて」→ 検索→追加→再生
- [ ] 「シュッて音入れて」→ @remotion/sfx whoosh再生

### タイムラインUI
- [ ] 全トラック表示
- [ ] ドラッグ移動 → プレビュー即時反映
- [ ] プロパティ変更 → プレビュー即時反映
- [ ] AddItemPanelから全カテゴリ追加可能

### オーディオ
- [ ] Freesound SE検索 → プレビュー → 追加 → 再生
- [ ] @remotion/sfx ビルトインSE → 追加 → 再生
- [ ] Beatoven.ai BGM生成 → 追加 → 再生
- [ ] ElevenLabs ナレーション → 追加 → 再生

### MediaBunny
- [ ] サムネイル生成（FFmpegなし）
- [ ] 波形生成（FFmpegなし）
- [ ] 動画変換（Conversion API）

### Remotion全機能
- [ ] 字幕5種アニメーション
- [ ] TikTok風キャプション
- [ ] パーティクル (@remotion/noise)
- [ ] ライトリーク (@remotion/light-leaks)
- [ ] モーションブラー (@remotion/motion-blur)
- [ ] 5種トランジション (@remotion/transitions)
- [ ] テキストオーバーレイ + fitText (@remotion/layout-utils)
- [ ] Lottie (@remotion/lottie)
- [ ] GIF (@remotion/gif)
- [ ] 図形 (@remotion/shapes)
- [ ] Googleフォント (@remotion/google-fonts)
- [ ] 音声ビジュアライザ (@remotion/media-utils)
