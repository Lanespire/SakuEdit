# RVE パターン分析結果

> 分析対象: `docs/editor-example/` (購入済み React Video Editor Pro)
> 比較対象: `app/reactvideoeditor/pro/` (SakuEdit 現在の実装)
> 分析日: 2026-03-15

---

## 1. アダプタパターン

### 概要

RVE は **アダプタパターン** を中心にメディアソースを完全に抽象化している。これにより、Pexels・Pixabay・自前 API など異なるメディアプロバイダを統一的なインターフェースで扱える。

### 型階層

```
BaseMediaItem
  ├── StandardImage (type: 'image', src: { original, large, medium, small, thumbnail })
  ├── StandardVideo (type: 'video', videoFiles: Array<{quality, format, url}>)
  └── StandardAudio (id, title, artist, duration, file)

BaseMediaAdaptor
  ├── ImageAdaptor     → search() + getImageUrl()
  ├── VideoAdaptor     → search() + getVideoUrl() + getThumbnailUrl()
  └── MediaAdaptor     → searchImages() + searchVideos() + getImageUrl() + getVideoUrl()
```

### オーバーレイアダプタ (overlay-adaptors.ts)

メディアアダプタをさらに拡張し、エディタ固有のオーバーレイ種別ごとにアダプタを定義:

| アダプタ | インターフェース | 主要メソッド |
|---------|-----------------|-------------|
| VideoOverlayAdaptor | extends VideoAdaptor | search(), getVideoUrl(), getThumbnailUrl() |
| ImageOverlayAdaptor | extends ImageAdaptor | search(), getImageUrl() |
| SoundOverlayAdaptor | 独自定義 | search(), getAudioUrl() |
| TextOverlayAdaptor | 独自定義 | getTemplates() |
| StickerOverlayAdaptor | 独自定義 | getCategories(), getTemplates() |
| TemplateOverlayAdaptor | 独自定義 | getTemplates(params?) |
| AnimationOverlayAdaptor | 独自定義 | getTemplates() |

### ファクトリパターン

各アダプタには `createStatic*Adaptor()` ファクトリ関数があり、静的データからアダプタを簡単に生成できる:

- `createStaticTextAdaptor(templates, displayName)` - テキストテンプレート用
- `createStaticAudioAdaptor(audioList, displayName)` - オーディオトラック用
- `createStaticTemplateAdaptor(displayName)` - テンプレート用
- `createStaticAnimationAdaptor(animations, displayName)` - アニメーション用
- `createStatic3DLayoutAdaptor(layouts, displayName)` - 3Dレイアウト用

外部 API 用には `createPexelsImageAdaptor(apiKey)` / `createPexelsVideoAdaptor(apiKey)` のようなファクトリで API キーをバインドする。

### MediaAdaptorContext

`MediaAdaptorProvider` が全アダプタを React Context で管理:

1. **Props で渡されたアダプタ** を優先使用、なければ **デフォルトアダプタ** にフォールバック
2. **並列検索**: `Promise.all()` で全アダプタの検索を同時実行
3. **結果マージ**: `_source` / `_sourceDisplayName` メタデータを付与して統合
4. **シャッフル**: `shuffleArray()` で複数ソースの結果を混合（テキストテンプレート以外）
5. **エラーハンドリング**: 個別アダプタのエラーは `sourceResults[].error` に記録、他のアダプタの結果は正常に返す

### SakuEditとの差分

SakuEdit は既に RVE のアダプタパターンをほぼそのまま利用している（`app/reactvideoeditor/pro/types/media-adaptors.ts`, `overlay-adaptors.ts`, `contexts/media-adaptor-context.tsx` が存在）。

**追加すべき点:**
- SakuEdit 独自のメディアソース（ユーザーアップロード動画、ローカルファイル）用のカスタムアダプタ
- 無音検出結果をタイムラインに反映するための `SilenceDetectionAdaptor` のような拡張

---

## 2. タイムラインパターン

### アーキテクチャ

タイムラインは **hooks ベースの関心分離** で構成されている:

| Hook | 責務 |
|------|------|
| `useTimelineZoom` | ズーム制御（ホイール、スライダー） |
| `useTimelineInteractions` | マウスインタラクション、ゴーストマーカー |
| `useTimelineTracks` | トラック CRUD、アイテム移動・リサイズ・削除 |
| `useTimelineSettings` | 自動空トラック削除、分割モード |
| `useTimelineComposition` | 合成時間計算、ビューポート管理 |
| `useTimelineOperations` | 外部コールバックのラッパー |
| `useTimelineHistory` | Undo/Redo 履歴管理 |
| `useTimelineShortcuts` | キーボードショートカット |
| `useMobileDetection` | モバイルデバイス検出 |
| `useTimelineStore` (Zustand) | タイムライン状態のグローバルストア |

### Timeline コンポーネント構成

```
Timeline (forwardRef + useImperativeHandle)
  ├── TimelineHeader
  │   ├── PlaybackControls
  │   ├── ZoomControls
  │   ├── UndoRedoControls
  │   ├── SplitAtSelectionButton
  │   ├── SplittingToggle
  │   ├── AspectRatioDropdown
  │   └── AutoRemoveEmptyTracksToggle
  ├── TimelineTrackHandles (PC のみ表示)
  └── TimelineContent
      ├── TimelineMarkers (時間軸ルーラー)
      ├── TimelineTrack[] (各トラック行)
      │   └── TimelineItem[] (各アイテム)
      │       └── TimelineItemContentFactory → 型別レンダラー
      ├── TimelineGuidelines (整列ガイド)
      ├── TimelineMarqueeSelection (範囲選択)
      └── TimelineInsertionLine (挿入ライン)
```

### TimelineItem の型別レンダリング (Content Factory)

`TimelineItemContentFactory` が `TrackItemType` に応じた専用コンテンツコンポーネントを返す:

| TrackItemType | コンポーネント | 特徴 |
|---------------|---------------|------|
| TEXT | TextItemContent | テキストラベル表示 |
| IMAGE | ImageItemContent | サムネイル表示 |
| VIDEO | VideoItemContent | サムネイル + 波形 |
| AUDIO | AudioItemContent | 波形表示 |
| CAPTION | **CaptionItemContent** | ワード単位のブロック表示 |
| STICKER | StickerItemContent | ステッカープレビュー |
| BLUR | BlurItemContent | ブラー範囲表示 |

### CaptionItemContent の詳細 (字幕表示パターン)

SakuEdit の字幕機能にとって最も重要なパターン:

1. **2 モード表示**: ズームアウト時はラベル表示（ワード数表示）、ズームイン時はワード単位ブロック表示
2. **ワード単位タイミング**: 各ワードに `startMs` / `endMs` があり、プレイヘッドの位置に応じてアクティブなワードがハイライト
3. **Caption データ構造**:
   ```typescript
   interface Caption {
     text: string;
     startMs: number;
     endMs: number;
     timestampMs: null;
     confidence: number;
     words: Array<{
       word: string;
       startMs: number;
       endMs: number;
       confidence?: number;
     }>;
   }
   ```
4. **アクティブワード判定**: `currentFrame / fps` から `currentMs` を算出し、`word.startMs <= currentMs < word.endMs` でハイライト

### TimelineItem の型定義

```typescript
interface TimelineItem {
  id: string;
  trackId: string;
  start: number;      // 秒単位 - タイムライン上の開始位置
  end: number;        // 秒単位 - タイムライン上の終了位置
  type?: TrackItemType | string;
  data?: any;          // 型別の追加データ
  mediaStart?: number; // メディアファイル内の再生開始位置（分割クリップ用）
  mediaEnd?: number;
  mediaSrcDuration?: number;
  speed?: number;      // 再生速度倍率
}
```

### 重要な設計判断

- **秒単位の時間管理**: タイムラインの `start`/`end` は秒単位、キャプションの `startMs`/`endMs` はミリ秒単位
- **分割サポート**: `mediaStart`/`mediaEnd` で元メディアのどの部分を使うか指定可能（無音カットに活用可能）
- **マグネティックタイムライン**: トラック単位で磁気的スナップを ON/OFF 可能
- **`forwardRef` + `useImperativeHandle`**: 外部から `addNewItem()` や `scroll` を呼び出し可能

---

## 3. AIキャプション連携

### API エンドポイント (`app/api/ai/captions/route.ts`)

現在の RVE 実装は **デモモード** (ハードコードされたキャプション返却):

```typescript
POST /api/ai/captions
Request:  { videoSrc: string, language: string }
Response: { success: boolean, captions: Caption[], language: string, processingTime: number }
```

**TODO コメントに記載された実装計画:**
1. 動画から音声を抽出
2. OpenAI Whisper API に送信
3. レスポンスを Caption 形式に変換

### キャプションデータ形式

API が返す Caption は **ワード単位のタイミング情報** を含む:

```typescript
{
  text: "Welcome to React Video Editor Pro.",
  startMs: 0,
  endMs: 3000,
  timestampMs: null,
  confidence: 0.98,
  words: [
    { word: "Welcome", startMs: 0, endMs: 600, confidence: 0.98 },
    { word: "to", startMs: 600, endMs: 800, confidence: 0.98 },
    // ...
  ]
}
```

### useCaptions フック（テストから推測した機能）

テストファイル `tests/hooks/use-captions.test.tsx` から、`useCaptions` フックの全機能を特定:

| メソッド | 機能 |
|---------|------|
| `parseTimeString(str)` | SRT タイムスタンプ文字列 → ミリ秒変換 |
| `cleanSRTText(str)` | HTML タグ・フォーマット指定を除去 |
| `distributeWordTiming(words, startMs, endMs)` | ワードを均等にタイミング分配 |
| `parseSRT(content)` | SRT ファイルをパースし Caption[] に変換 |
| `generateFromText({ text, wordsPerMinute?, sentenceGapMs? })` | プレーンテキストから Caption 生成 |
| `createCaptionOverlay(captions)` | Caption[] からタイムラインオーバーレイを生成 |
| `handleFileUpload(file)` | .srt ファイルアップロード・パース |
| `reset()` | 状態リセット |

**状態管理:**
- `isProcessing`: 処理中フラグ
- `isError`: エラーフラグ
- `error`: エラーメッセージ
- `lastParseResult`: 最後のパース結果

### SakuEdit への影響

SakuEdit の「無音トリミング」「字幕・文字起こし」機能は、この Caption データ構造をそのまま活用できる:

- **無音検出** → 無音区間の `startMs`/`endMs` を特定
- **自動字幕** → Whisper API (or ZAI API) から Caption 形式で取得
- **SRT インポート/エクスポート** → `parseSRT()` / `generateFromText()` パターンを踏襲

---

## 4. テストパターン

### テスト構成

```
tests/
  ├── setup.ts                          # Jest 設定 + カスタムマッチャー
  ├── advanced-timeline/
  │   ├── hooks/                        # タイムライン hooks のユニットテスト (14ファイル)
  │   ├── stores/                       # Zustand ストアのテスト
  │   └── utils.test.ts                 # ユーティリティのテスト
  ├── contexts/                         # React Context のテスト (5ファイル)
  │   ├── editor-context.test.tsx
  │   ├── media-adaptor-context.test.tsx
  │   ├── renderer-context.test.tsx
  │   ├── sidebar-context.test.tsx
  │   └── theme-context.test.tsx
  ├── hooks/                            # カスタムフックのテスト (10ファイル)
  └── utils/                            # ユーティリティのテスト
```

### テスト設計パターン

**1. セットアップ (`tests/setup.ts`)**
- `@testing-library/jest-dom` を使用
- カスタムマッチャー `toHaveBeenCalledOnceWith` を追加

**2. Context テスト (`media-adaptor-context.test.tsx`)**
- **Provider 外での使用エラー** テスト
- **デフォルトアダプタ** のフォールバック動作テスト
- **並列検索** の結果マージテスト
- **エラーハンドリング** テスト（個別アダプタのエラーが全体に影響しないことを検証）
- **hasMore ロジック** テスト（複数アダプタの hasMore 判定）
- モックパターン: `jest.mock()` でデフォルトアダプタをモック化、`beforeEach` で `jest.clearAllMocks()`

**3. Hook テスト (`use-captions.test.tsx`)**
- `renderHook()` + `act()` で非同期フック処理をテスト
- `jest.mock()` で依存コンテキスト（`useEditorContext`）をモック
- テストは **機能単位で describe ブロック** を分割:
  - `parseTimeString` - 境界値テスト（不正なフォーマット、範囲外の値）
  - `cleanSRTText` - HTML タグ除去、空文字列ハンドリング
  - `parseSRT` - 正常系 + 異常系（空コンテンツ、タイミング重複、開始 >= 終了）
  - `generateFromText` - WPM パラメータ、文区切り、空テキストエラー
  - `createCaptionOverlay` - 正常生成 + 空配列エラー
  - `handleFileUpload` - ファイルバリデーション（拡張子、サイズ制限）
  - `reset` - 状態リセット後の再利用可能性

**4. Renderer テスト (`use-rendering.test.tsx`)**
- `RendererProvider` ラッパーでコンテキストを提供
- `VideoRenderer` インターフェースをモック
- 状態遷移テスト: `init` → `rendering` → `done` / `error`
- `undo` で `init` に戻ることを検証

### テストの特徴

- **モック戦略**: `jest.mock()` でモジュール全体をモック、`jest.fn()` で個別関数をモック
- **console 抑制**: `console.error` / `console.log` を `jest.spyOn().mockImplementation()` で抑制
- **非同期テスト**: `act(async () => { await ... })` パターンを一貫して使用
- **エラーケースの網羅**: 正常系だけでなく、境界値・異常系のテストが充実

---

## 5. レンダリング制御

### RenderControls コンポーネント

```typescript
interface RenderControlsProps {
  state: any;               // 現在のレンダリング状態
  handleRender: () => void; // レンダリング開始トリガー
}
```

### 主要機能

1. **環境変数によるレンダリング有効/無効**: `NEXT_PUBLIC_RENDERING_ENABLED === "true"` で制御
2. **レンダリング履歴管理**: `useState<RenderItem[]>` で過去のレンダリング結果を保持
3. **状態表示**:
   - `init` → "Render Video" ボタン
   - `invoking` → "Preparing..." + スピナー
   - `rendering` → "Rendering... XX%" + スピナー
   - `done` → 完了通知 + ダウンロードボタン
   - `error` → エラー表示
4. **SSR / Lambda 対応**: `renderType` に応じてダウンロード URL を変換
5. **通知ベル UI**: Popover で過去のレンダリング結果一覧を表示

### VideoRenderer インターフェース (テストから推測)

```typescript
interface VideoRenderer {
  renderVideo: (params: { id: string; inputProps: CompositionProps }) => Promise<{ renderId: string; bucketName?: string }>;
  getProgress: (params: { id: string; bucketName?: string }) => Promise<ProgressResponse>;
}

type ProgressResponse =
  | { type: 'done'; url: string; size: number }
  | { type: 'error'; message: string }
  | { type: 'progress'; progress: number };
```

### useRendering フック

- `renderMedia()`: レンダリング開始 → `renderVideo()` → ポーリングで `getProgress()` → 完了/エラー
- `undo()`: 状態を `init` にリセット
- `state`: 現在のレンダリング状態

### SakuEdit への影響

SakuEdit は SST (Serverless Stack) でデプロイ予定なので、Lambda ベースのレンダリングパイプラインが適切。RVE の `VideoRenderer` インターフェースを踏襲しつつ、SakuEdit 固有の処理（無音カット適用後のレンダリングなど）を追加できる。

---

## 6. SakuEditへの反映提案

### 6.1 無音トリミング用アダプタ

RVE のアダプタパターンを拡張し、無音検出結果をタイムラインに反映する:

```typescript
interface SilenceDetectionAdaptor {
  name: string;
  displayName: string;
  detectSilence: (params: {
    videoSrc: string;
    threshold: number;       // 無音判定の閾値 (dB)
    minDuration: number;     // 最小無音区間 (ms)
  }) => Promise<{
    silentSegments: Array<{
      startMs: number;
      endMs: number;
      type: 'silence' | 'filler'; // 無音 or フィラー（「えー」「あー」）
    }>;
  }>;
}
```

TimelineItem の `mediaStart`/`mediaEnd` を活用して、無音区間をカットした分割クリップとしてタイムラインに配置できる。

### 6.2 字幕・文字起こし統合

RVE の `useCaptions` フックパターンをベースに、SakuEdit 用に拡張:

- **ZAI API 連携**: `app/api/ai/captions/route.ts` に ZAI API (`glm-5`) を使った文字起こしを実装
- **日本語対応**: SRT パーサーに日本語文字コード対応を追加
- **話者認識**: Caption データに `speaker` フィールドを活用
- **フィラー検出**: 「えー」「あー」「えっと」を自動検出し、無音トリミングと連携

### 6.3 テンポプリセット機能

RVE のテンプレートアダプタパターンを応用:

```typescript
interface TempoPresetAdaptor {
  name: string;
  getPresets: () => Promise<{
    items: Array<{
      id: string;
      name: string;
      cutInterval: number;      // カット間隔 (秒)
      captionTempo: number;     // 字幕表示テンポ (WPM)
      transitionType: string;   // トランジション種別
      bgmVolume: number;        // BGM 音量
    }>;
  }>;
}
```

### 6.4 YouTuber スタイル分析

RVE のテンプレートオーバーレイの構造（overlays 配列でレイヤーを表現）を活用し、分析結果をテンプレートとして保存:

- 分析した BGM・テロップ・編集スタイルを `TemplateOverlay` 形式で保存
- `createStaticTemplateAdaptor()` パターンで、分析結果をテンプレートとして提供

### 6.5 テスト戦略

RVE のテストパターンを踏襲し、SakuEdit 固有のテストを追加:

| テスト対象 | パターン | 優先度 |
|-----------|---------|-------|
| SilenceDetectionAdaptor | Context テスト + モックアダプタ | 高 |
| useCaptions (日本語拡張) | Hook テスト + SRT パースの境界値テスト | 高 |
| TempoPreset | アダプタテスト | 中 |
| VideoRenderer (SST Lambda) | Renderer テスト + 状態遷移テスト | 高 |
| YouTuberStyleAnalysis | 統合テスト | 低 |

### 6.6 レンダリングパイプライン

RVE の `VideoRenderer` インターフェースを SST Lambda 向けにカスタマイズ:

1. **前処理**: 無音カット + フィラー除去を適用した中間ファイル生成
2. **Remotion レンダリング**: 字幕オーバーレイ + テロップ + BGM を合成
3. **後処理**: エンコード設定（解像度、ビットレート、コーデック）
4. **進捗通知**: `getProgress()` でポーリング、完了時にダウンロード URL 提供

---

## まとめ

RVE の設計は **プラガブル（差し替え可能）** なアダプタパターンを中核に、タイムライン・キャプション・レンダリングの各機能を独立したフック/コンテキストで管理している。SakuEdit は既にこの基盤を取り込んでおり、以下の拡張で独自機能を実現できる:

1. **無音検出アダプタ** + TimelineItem の `mediaStart`/`mediaEnd` で無音カット
2. **日本語対応 useCaptions** + ZAI API で自動字幕
3. **テンポプリセットアダプタ** でスタイル保存・再現
4. **テンプレートオーバーレイ形式** で YouTuber スタイル分析結果を保存
5. **SST Lambda 対応 VideoRenderer** で Remotion レンダリング
