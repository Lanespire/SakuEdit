# SakuEdit 新機能設計書

> 作成日: 2026-03-12
> 対象機能: Claude×Remotion Skills / サムネイル候補生成 / ジェットカット / ナレーション / 切り抜き動画

---

## 目次

1. [全体アーキテクチャ](#1-全体アーキテクチャ)
2. [Claude × Remotion Skills（動画生成）](#2-claude--remotion-skills動画生成)
3. [サムネイル候補生成（YouTuber参考）](#3-サムネイル候補生成youtuber参考)
4. [ジェットカット（Jump Cut）](#4-ジェットカットjump-cut)
5. [ナレーション（TTS生成）](#5-ナレーションtts生成)
6. [切り抜き動画（Clip / Highlight）](#6-切り抜き動画clip--highlight)
7. [DBスキーマ変更](#7-dbスキーマ変更)
8. [APIエンドポイント一覧](#8-apiエンドポイント一覧)
9. [処理フロー全体図](#9-処理フロー全体図)
10. [実装優先度](#10-実装優先度)
11. [料金プラン改訂案](#11-料金プラン改訂案)

---

## 1. 全体アーキテクチャ

### 設計方針

既存のパイプライン型フロー（`upload → analyze → process → export`）に対して、新機能は**各ステージに横串を通す形**で追加する。

- **Remotion** は現在最小限（字幕オーバーレイのみ）→ 大幅拡張
- **AnalysisJob** + **AISuggestion** の仕組みを「提案→適用」フローに活用
- FFmpegからRemotionへの**段階的移行**（ExportJobに`renderEngine`フラグ）

### 新規ファイル構成

```
lib/
  ├── remotion-generator.ts     # Claude APIでRemotionプロパティ生成
  ├── jetcut.ts                 # ジェットカットエンジン
  ├── clip-detector.ts          # ハイライト検出エンジン
  ├── clip-generator.ts         # クリップ動画生成
  ├── narration.ts              # TTS統合・ナレーション生成
  └── thumbnail-generator.ts    # サムネイル生成ロジック

remotion/compositions/
  ├── VideoComposition.tsx      # （既存、拡張）
  ├── JumpCutComposition.tsx    # ジェットカット用
  ├── ClipComposition.tsx       # 切り抜き動画用
  ├── NarrationComposition.tsx  # ナレーション付き
  └── ThumbnailComposition.tsx  # サムネイル生成用

remotion/templates/
  ├── youtube-standard.tsx      # YouTuber風テンプレート
  ├── short-form.tsx            # ショート動画テンプレート
  └── clip-highlight.tsx        # 切り抜きハイライト

app/api/
  ├── jetcut/
  │   ├── route.ts              # POST: 分析、PATCH: 適用
  │   └── preview/route.ts      # GET: プレビュー
  ├── narration/
  │   ├── route.ts              # POST: 生成、GET: 一覧
  │   └── preview/route.ts      # POST: 音声プレビュー
  ├── clips/
  │   ├── route.ts              # POST: 検出、GET: 一覧
  │   └── [clipId]/
  │       └── route.ts          # POST render, GET, DELETE
  ├── thumbnails/
  │   └── route.ts              # POST: 候補生成、GET: 一覧
  └── render/
      └── route.ts              # POST: Remotionレンダリング
```

---

## 2. Claude × Remotion Skills（動画生成）

### 概要

Claudeが文字起こし・スタイル分析結果から Remotion コンポジションの**プロパティ（props）を自動生成**し、テンプレートコンポジションでレンダリングする。

> コード自体を毎回生成するのではなく、**テンプレートコンポジション + 動的props** のアプローチを採用。安全で高速。

### 処理フロー

```
AI分析結果 → Claude が最適なpropsをJSON生成 → Remotion でレンダリング
```

### インターフェース

```typescript
// lib/remotion-generator.ts

interface RemotionProject {
  composition: string          // コンポジション名
  props: Record<string, any>   // 動的プロパティ
  durationInFrames: number
  fps: number
  width: number
  height: number
}

async function generateRemotionProject(params: {
  transcription: ASRResult       // 文字起こし
  styleProfile: StyleAnalysis    // スタイル分析
  sourceVideo: string            // 元動画パス
  mode: 'jumpcut' | 'clip' | 'narration' | 'full'
}): Promise<RemotionProject>
```

### ExportJob 拡張

```prisma
model ExportJob {
  // ...既存フィールド
  renderEngine  String  @default("ffmpeg")  // "ffmpeg" | "remotion"
  compositionId String?                      // Remotion composition ID
  renderProps   Json?                        // Remotion props JSON
}
```

---

## 3. サムネイル候補生成（YouTuber参考）

### 概要

参考YouTuberのサムネイル傾向を分析し、動画内容に合った候補を複数生成する。

### 入出力

| | 内容 |
|---|---|
| **Input** | 参考YouTuber URL（既存style分析から取得可能）、文字起こし・ハイライト情報、動画フレーム |
| **Output** | サムネイル候補 3〜5枚、各候補のタイトル案 |

### パイプライン

```typescript
// lib/thumbnail-generator.ts

// --- Step 1: 参考サムネスタイル分析（既存visualProfileを拡張） ---

interface ThumbnailStyleAnalysis {
  layout: 'face-left' | 'face-right' | 'centered' | 'split'
  textPosition: 'top' | 'bottom' | 'overlay' | 'side'
  textStyle: {
    fontSize: 'large' | 'xlarge' | 'xxlarge'
    color: string
    hasOutline: boolean
    hasBackground: boolean
    font: string
  }
  emotion: 'surprised' | 'happy' | 'serious' | 'angry' | 'neutral'
  colorScheme: string[]
  hasArrows: boolean
  hasEmoji: boolean
  hasBeforeAfter: boolean
}

// --- Step 2: ベストフレーム選定 ---

async function selectBestFrames(
  videoPath: string,
  transcription: ASRResult,
  highlights: number[]
): Promise<Array<{
  timestamp: number
  framePath: string
  score: number             // 表情スコア（驚き・インパクト）
  reason: string
}>>

// --- Step 3: サムネイル候補生成（Remotion） ---

async function generateThumbnailCandidates(params: {
  frames: SelectedFrame[]
  titleSuggestions: string[]  // Claude生成
  style: ThumbnailStyleAnalysis
  count: number               // 候補数（3〜5）
}): Promise<ThumbnailCandidate[]>
```

### DBスキーマ

```prisma
model ThumbnailCandidate {
  id          String   @id @default(cuid())
  projectId   String
  imagePath   String
  imageUrl    String?
  title       String
  score       Float    @default(0)
  layout      Json
  isSelected  Boolean  @default(false)
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("thumbnail_candidates")
}
```

---

## 4. ジェットカット（Jump Cut）

### 概要

「間」を詰める極端なカット編集。既存の無音カットの進化版。

既存の `detectSilence()` は**無音区間**のみ検出（-35dB閾値）。ジェットカットでは以下を追加：

- **フィラー語** 検出・除去（「えー」「あの」「まあ」）
- **言い直し** 検出（同じ内容の繰り返し）
- **息継ぎ** 検出
- **テンポ調整**（カット間にフレーム単位のギャップ設定）

### インターフェース

```typescript
// lib/jetcut.ts

interface JetCutConfig {
  // 無音カット設定（既存拡張）
  silenceThreshold: number      // dB（デフォルト: -35）
  minSilenceDuration: number    // 秒（デフォルト: 0.3、攻めるなら0.15）

  // フィラー語検出
  fillerDetection: boolean
  fillerWords: string[]         // ["えー", "あの", "まあ", "えっと", "うーん"]

  // 言い直し検出
  repeatDetection: boolean
  repeatSimilarity: number      // 類似度閾値（0.7〜0.9）

  // 息継ぎカット
  breathDetection: boolean
  breathThreshold: number

  // テンポ制御
  paddingBefore: number         // カット前の余白（フレーム単位）
  paddingAfter: number          // カット後の余白
  maxCutsPerMinute: number      // 最大カット数/分（安全弁）

  // アグレッシブ度プリセット
  preset: 'gentle' | 'standard' | 'aggressive' | 'extreme'
}

interface JetCutSegment {
  type: 'keep' | 'cut'
  start: number
  end: number
  reason: 'silence' | 'filler' | 'repeat' | 'breath' | 'manual'
  confidence: number            // 0-1
  text?: string                 // カットされるテキスト
}

async function analyzeForJetCut(params: {
  videoPath: string
  transcription: ASRResult
  config: JetCutConfig
}): Promise<{
  segments: JetCutSegment[]
  stats: {
    originalDuration: number
    editedDuration: number
    cutCount: number
    savedTime: number
    savedPercentage: number
  }
}>
```

### プリセット定義

```typescript
const JETCUT_PRESETS = {
  gentle: {
    // 明確な無音のみカット（初心者向け）
    silenceThreshold: -40,
    minSilenceDuration: 0.8,
    fillerDetection: false,
    repeatDetection: false,
    breathDetection: false,
    paddingBefore: 3,       // フレーム
    paddingAfter: 3,
    maxCutsPerMinute: 10,
  },
  standard: {
    // 無音 + フィラーカット
    silenceThreshold: -35,
    minSilenceDuration: 0.4,
    fillerDetection: true,
    repeatDetection: false,
    breathDetection: false,
    paddingBefore: 2,
    paddingAfter: 2,
    maxCutsPerMinute: 20,
  },
  aggressive: {
    // 無音 + フィラー + 息継ぎ
    silenceThreshold: -30,
    minSilenceDuration: 0.2,
    fillerDetection: true,
    repeatDetection: true,
    breathDetection: true,
    paddingBefore: 1,
    paddingAfter: 1,
    maxCutsPerMinute: 40,
  },
  extreme: {
    // ほぼ全ての隙間をカット（YouTuber風）
    silenceThreshold: -25,
    minSilenceDuration: 0.15,
    fillerDetection: true,
    repeatDetection: true,
    breathDetection: true,
    paddingBefore: 0,
    paddingAfter: 1,
    maxCutsPerMinute: 60,
  },
}
```

### UI: ジェットカットプレビュー

```
┌─────────────────────────────────────────┐
│  ジェットカット設定                      │
│  ┌─────────────────────────────┐        │
│  │ ● やさしい  ○ 標準         │        │
│  │ ○ アグレッシブ  ○ 極限     │        │
│  └─────────────────────────────┘        │
│                                         │
│  █████░░██████░░░████████░██████        │
│  ↑ キープ  ↑カット   波形表示           │
│                                         │
│  元: 10:23  →  編集後: 7:45 (25%短縮)   │
│  カット数: 47回                          │
│                                         │
│  [プレビュー再生]  [適用]               │
└─────────────────────────────────────────┘
```

---

## 5. ナレーション（TTS生成）

### 概要

テキストからAI音声を生成して動画に合成する。

### ユースケース

1. 字幕テキストから自動ナレーション生成
2. Claude生成のスクリプトで解説動画
3. 切り抜き動画に解説ナレーション追加
4. 多言語ナレーション（翻訳→TTS）

### TTSプロバイダ設計

```typescript
// lib/narration.ts

// --- TTS プロバイダ抽象化 ---

interface TTSProvider {
  name: string
  generateSpeech(params: TTSRequest): Promise<TTSResult>
  listVoices(): Promise<Voice[]>
}

interface TTSRequest {
  text: string
  voice: string               // voice ID
  speed: number               // 0.5 - 2.0
  pitch: number               // -20 to 20
  language: string            // "ja", "en", etc.
  format: 'mp3' | 'wav'
}

interface TTSResult {
  audioPath: string
  duration: number
  segments: Array<{           // ワードレベルタイミング
    text: string
    start: number
    end: number
  }>
}

interface Voice {
  id: string
  name: string
  language: string
  gender: 'male' | 'female' | 'neutral'
  style: 'narrator' | 'casual' | 'news' | 'cheerful'
  preview_url?: string
}
```

### TTS プロバイダ候補

| プロバイダ | 品質 | 日本語 | コスト | 備考 |
|-----------|------|--------|--------|------|
| **OpenAI TTS** | ◎ 最も自然 | ◎ | $15/1M文字 | `tts-1-hd` 推奨 |
| **VOICEVOX** | ○ | ◎ 特化 | 無料（OSS） | キャラボイスで差別化可能 |
| **Google Cloud TTS** | ◎ | ○ | $16/1M文字 | SSML対応で細かい制御可能 |

**推奨**: メインは OpenAI TTS、無料プランには VOICEVOX を割り当て。

### ナレーション生成フロー

```typescript
async function generateNarration(params: {
  projectId: string
  mode: 'from_subtitles' | 'from_script' | 'ai_generated'

  // from_subtitles: 既存字幕からナレーション
  subtitleIds?: string[]

  // from_script: ユーザー入力スクリプト
  script?: string

  // ai_generated: Claudeがスクリプト生成
  aiPrompt?: string
  transcription?: ASRResult

  // 音声設定
  voice: string
  speed: number
  language: string
}): Promise<{
  narrationId: string
  audioPath: string
  duration: number
  segments: TTSSegment[]
}>
```

### Remotion統合

```typescript
// remotion/compositions/NarrationComposition.tsx

interface NarrationCompositionProps {
  videoUrl: string
  narrationAudioUrl: string    // ナレーション音声
  originalAudioVolume: number  // 元動画の音量（0-1、ナレーション時は下げる）
  narrationVolume: number      // ナレーション音量
  subtitles: SubtitleProps[]   // ナレーションに連動した字幕
  bgmUrl?: string              // BGM（オプション）
  bgmVolume?: number
}
```

### DBスキーマ

```prisma
model Narration {
  id          String   @id @default(cuid())
  projectId   String
  audioPath   String
  audioUrl    String?
  script      String
  voice       String
  speed       Float    @default(1.0)
  language    String   @default("ja")
  duration    Float
  segments    Json?                     // ワードレベルタイミング
  provider    String   @default("openai")  // openai | voicevox | google
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("narrations")
}
```

---

## 6. 切り抜き動画（Clip / Highlight）

### 概要

長尺動画からAIが「面白い部分」「重要な部分」を自動検出し、短尺クリップを生成する。

### 検出モード

| モード | 説明 |
|--------|------|
| `auto` | テキスト・音声・視覚の総合スコアで自動検出 |
| `topic` | トピック境界で分割 |
| `emotion` | 感情の起伏でハイライト |
| `custom` | ユーザー指定キーワードで検出 |

### ハイライト検出パイプライン

```typescript
// lib/clip-detector.ts

interface ClipDetectionConfig {
  mode: 'auto' | 'topic' | 'emotion' | 'custom'
  targetClipCount: number       // 希望クリップ数
  minClipDuration: number       // 最短クリップ秒数（15秒〜）
  maxClipDuration: number       // 最長クリップ秒数（〜90秒）
  targetPlatform: 'youtube' | 'youtube_shorts' | 'tiktok' | 'instagram'

  // カスタムモード用
  keywords?: string[]
  excludeKeywords?: string[]
}

interface DetectedClip {
  id: string
  startTime: number
  endTime: number
  duration: number

  // スコアリング
  score: number                 // 総合スコア (0-100)
  textScore: number             // テキスト面白さスコア
  audioScore: number            // 音声盛り上がりスコア
  visualScore: number           // 視覚変化スコア

  // メタデータ
  title: string                 // AI生成タイトル
  summary: string
  tags: string[]
  thumbnailTimestamp: number    // サムネに最適なフレーム

  // 感情分析
  emotionProfile: {
    dominant: 'funny' | 'informative' | 'dramatic' | 'surprising' | 'emotional'
    intensity: number
  }
}

async function detectHighlights(params: {
  videoPath: string
  transcription: ASRResult
  waveform: number[]
  sceneChanges: number[]
  config: ClipDetectionConfig
}): Promise<DetectedClip[]>
```

### マルチモーダルスコアリング

```typescript
// テキストスコア（Claude で分析）
async function scoreTextSegments(
  transcription: ASRResult
): Promise<Array<{ start: number; end: number; score: number; reason: string }>>

// 音声スコア（FFmpegのvolume detect + 笑い声検出）
async function scoreAudioSegments(
  audioPath: string
): Promise<Array<{ start: number; end: number; score: number; type: string }>>

// 視覚スコア（シーン変化密度 + フレーム分析）
async function scoreVisualSegments(
  videoPath: string,
  sceneChanges: number[]
): Promise<Array<{ start: number; end: number; score: number }>>

// 統合スコアリング
function mergeScores(
  text: ScoredSegment[],
  audio: ScoredSegment[],
  visual: ScoredSegment[],
  weights: { text: number; audio: number; visual: number }
): MergedScore[]
```

### プラットフォーム別出力仕様

| Platform | 解像度 | 最大秒数 | フォーマット |
|----------|--------|---------|-------------|
| YouTube | 1920×1080 | 90秒 | MP4 |
| YouTube Shorts | 1080×1920（縦） | 60秒 | MP4 |
| TikTok | 1080×1920（縦） | 60秒 | MP4 |
| Instagram Reels | 1080×1350（4:5） | 60秒 | MP4 |

### DBスキーマ

```prisma
model Clip {
  id              String   @id @default(cuid())
  projectId       String
  title           String
  summary         String?
  startTime       Float
  endTime         Float
  duration        Float
  score           Float    @default(0)
  scoreBreakdown  Json?                     // {text, audio, visual}
  tags            Json?
  emotionType     String?

  // 出力
  platform        String   @default("youtube")
  outputPath      String?
  outputUrl       String?
  thumbnailPath   String?
  status          JobStatus @default(PENDING)

  isSelected      Boolean  @default(false)
  isExported      Boolean  @default(false)
  createdAt       DateTime @default(now())

  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("clips")
}
```

---

## 7. DBスキーマ変更

### Project リレーション追加

```prisma
model Project {
  // ...既存フィールド

  // NEW relations
  thumbnailCandidates ThumbnailCandidate[]
  narrations          Narration[]
  clips               Clip[]
}
```

### SuggestionType 追加

```prisma
enum SuggestionType {
  SILENCE_CUT
  TEMPO_OPTIMIZE
  HIGHLIGHT_DETECT
  SUBTITLE_IMPROVE
  BGM_SUGGEST
  JETCUT_SUGGEST        // NEW
  CLIP_SUGGEST          // NEW
  NARRATION_SUGGEST     // NEW
  THUMBNAIL_SUGGEST     // NEW
}
```

### TrackType 追加

```prisma
enum TrackType {
  VIDEO
  AUDIO
  SUBTITLE
  EFFECT
  NARRATION             // NEW
}
```

### Plan 拡張

```prisma
model Plan {
  // ...既存フィールド

  // NEW limits
  hasClipGeneration       Boolean @default(false)
  hasNarration            Boolean @default(false)
  monthlyNarrationMinutes Int     @default(0)
  hasThumbnailAI          Boolean @default(false)
  hasJetCut               Boolean @default(false)
}
```

---

## 8. APIエンドポイント一覧

| Method | Path | 機能 | プラン制限 |
|--------|------|------|-----------|
| `POST` | `/api/jetcut` | ジェットカット分析 | Free: gentle のみ |
| `GET` | `/api/jetcut/preview?projectId=` | カットプレビュー | - |
| `POST` | `/api/narration` | ナレーション生成 | Pro以上 |
| `GET` | `/api/narration?projectId=` | ナレーション一覧 | - |
| `POST` | `/api/narration/preview` | 音声プレビュー | Pro以上 |
| `POST` | `/api/clips` | ハイライト検出 | Pro以上 |
| `GET` | `/api/clips?projectId=` | クリップ一覧 | - |
| `POST` | `/api/clips/[clipId]/render` | クリップ動画生成 | Pro以上 |
| `POST` | `/api/thumbnails` | サムネ候補生成 | Pro以上 |
| `GET` | `/api/thumbnails?projectId=` | サムネ候補一覧 | - |
| `POST` | `/api/render` | Remotionレンダリング | Pro以上 |

---

## 9. 処理フロー全体図

```
                    ┌─────────┐
                    │ Upload  │
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         ┌────────┐ ┌────────┐ ┌──────────┐
         │  ASR   │ │  無音  │ │ スタイル │
         │文字起こし│ │  検出  │ │   分析   │
         └───┬────┘ └───┬────┘ └────┬─────┘
             │          │           │
    ┌────────┼──────────┼───────────┤
    ▼        ▼          ▼           ▼
┌────────┐┌────────┐┌────────┐┌──────────┐
│ジェット ││切り抜き ││ナレー  ││  サムネ  │  ← NEW
│ カット  ││  検出  ││ション  ││   候補   │
└───┬────┘└───┬────┘└───┬────┘└────┬─────┘
    │         │         │          │
    └────┬────┴─────────┴──────────┘
         │
         ▼
    ┌──────────┐
    │ Remotion │  ← Claude × Remotion Skills
    │  Render  │    コンポジション自動選択
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │  Export  │
    └──────────┘
```

---

## 10. 実装優先度

| 順位 | 機能 | 理由 | 工数 |
|------|------|------|------|
| **1** | ジェットカット | 既存の無音カット拡張。コアバリュー強化。既存パイプラインの延長 | 小 |
| **2** | 切り抜き動画 | 市場ニーズ大。ASR + スコアリングの仕組み新規 | 中 |
| **3** | サムネイル候補 | VisualProfile拡張 + Remotionレンダ。既存分析基盤を活用 | 中 |
| **4** | ナレーション | TTS統合が新規依存。Remotionでの音声合成 | 中〜大 |
| **5** | Remotion Skills統合 | 全機能の基盤。段階的にFFmpeg→Remotion移行 | 大（継続） |

> **段階的移行が鍵**: ExportJobに `renderEngine` フラグを追加して「FFmpeg出力」と「Remotion出力」を並行させる。ユーザーがRemotionプレビューで確認→OKならRemotionレンダ、というプログレッシブエンハンスメントが安全。

---

## 11. 料金プラン改訂案

| 機能 | Free (¥0) | Pro (¥2,480/月) | Business (¥8,980/月) |
|------|-----------|-----------------|---------------------|
| ジェットカット | gentle のみ | 全プリセット | 全プリセット + カスタム |
| 切り抜き検出 | 1クリップ | 10クリップ/本 | 無制限 |
| サムネ候補 | × | 3候補/本 | 5候補/本 |
| ナレーション | × | 30分/月 | 120分/月 |
| Remotion レンダ | × | ○ | ○ |

---

## 12. FFmpeg × Remotion 統合設計

### 設計方針：「選択制」ではなく「レイヤー分離」

FFmpegとRemotionは競合しない。役割が違う。

- ❌ 選択制（ユーザーが「FFmpeg」「Remotion」を選ぶ）
- ❌ 全面置き換え（FFmpegを捨てる）
- ✅ **自動使い分け**（シンプル→FFmpeg、リッチ→Remotion）

ユーザーにエンジンを選ばせるのは意味がない。**出力の複雑さに応じてシステムが自動で使い分ける**。

### 現在のパイプラインの分析

`process/route.ts` の各ステップとエンジンの対応：

| Step | 処理 | エンジン | 変更 |
|------|------|---------|------|
| 1 | 音声抽出 | FFmpeg | **変更なし** |
| 2 | 文字起こし(ASR) | Remotion whisper-cpp / local Whisper | **変更なし** |
| 3 | 字幕生成 | AI | **変更なし** |
| 4 | 無音検出 | FFmpeg | **変更なし** |
| 5 | **動画処理（カット+字幕）** | FFmpeg | **★ ここだけ分岐** |
| 6 | サムネイル | FFmpeg | Remotionでも可能に |
| 7 | 波形データ | FFmpeg | **変更なし** |

**Step 5 だけ**がFFmpegとRemotionで重なる部分。他は全部FFmpegのまま。

### 3レイヤーアーキテクチャ

```
                  【分析レイヤー】← FFmpeg固定、変えない
                  ┌──────────────────────┐
                  │ 音声抽出 (FFmpeg)     │
                  │ ASR (whisper-cpp)     │
                  │ 無音検出 (FFmpeg)     │
                  │ 波形生成 (FFmpeg)     │
                  │ シーン検出 (FFmpeg)   │
                  └──────────┬───────────┘
                             │
                             ▼
                  【編集レイヤー】← 「何をするか」の判断
                  ┌──────────────────────┐
                  │ 字幕生成              │
                  │ ジェットカット解析     │
                  │ クリップ検出           │
                  │ ナレーション生成       │
                  └──────────┬───────────┘
                             │
                  ┌──────────┴───────────┐
                  ▼                      ▼
        【シンプル出力】          【リッチ出力】
        FFmpeg                   Remotion
        ┌──────────────┐        ┌──────────────────┐
        │ 無音カット    │        │ アニメ字幕         │
        │ 字幕バーンイン │        │ トランジション      │
        │ エンコード    │        │ BGM/ナレMix        │
        └──────────────┘        │ サムネデザイン      │
                                │ 縦動画変換         │
                                │ イントロ/アウトロ   │
                                └──────────────────┘
```

### 自動使い分けルール

| やりたいこと | エンジン | 理由 |
|---|---|---|
| 無音カット + 字幕焼き込みだけ | **FFmpeg** | 速い。今と同じ |
| アニメーション字幕をつけたい | **Remotion** | FFmpegでは不可能 |
| BGMを重ねたい | **Remotion** | 音声レイヤー制御 |
| ナレーションを合成したい | **Remotion** | 3層音声ミックス |
| 切り抜きクリップ生成 | **Remotion** | イントロ付き + 縦変換 |
| サムネイルデザイン | **Remotion** | テキスト + エフェクト |
| 単純エクスポート（品質変更のみ） | **FFmpeg** | 速い。Remotion不要 |

### コード統合ポイント

#### 1. `export/route.ts` の分岐（最小変更）

現在（FFmpeg一択）:

```typescript
// export/route.ts:174-180
const exportResult = await exportVideo(inputPath, outputPath, {
  quality,
  format,
  subtitles: ...,
  burnSubtitles: ...,
})
```

変更後（出力内容に応じて自動選択）:

```typescript
const needsRemotion = hasAnimatedSubtitles || hasBGM || hasNarration ||
                      hasTransitions || targetPlatform !== 'youtube'

if (needsRemotion) {
  const result = await renderWithRemotion(compositionId, {
    videoUrl: inputPath,
    subtitles,
    narrationAudio,
    bgmAudio,
    style,
  }, outputPath)
} else {
  const result = await exportVideo(inputPath, outputPath, { ... })
}
```

#### 2. `renderWithRemotion()` を Node.js API に置き換え

現在の `video-processor.ts:828` は `npx remotion render` をspawnしている（遅い）。
`@remotion/renderer` の Node.js API を直接使う：

```typescript
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'

async function renderWithRemotion(compositionId, props, outputPath) {
  const bundled = await bundle('./remotion/Root.tsx')
  const composition = await selectComposition({
    serveUrl: bundled,
    id: compositionId,
    inputProps: props,
  })
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: props,
  })
}
```

#### 3. 編集画面に `@remotion/player` を埋め込み（プレビュー）

`@remotion/player` は既にインストール済み。レンダリング前にブラウザプレビューが可能：

```tsx
import { Player } from '@remotion/player'
import { VideoComposition } from '@/remotion/compositions/VideoComposition'

// edit/[id]/page.tsx に追加
<Player
  component={VideoComposition}
  inputProps={{ videoUrl, subtitles, style }}
  durationInFrames={totalFrames}
  fps={30}
  style={{ width: '100%' }}
  controls
/>
```

### 統合可能性の評価

**完全に統合可能。統合不可な部分はない。**

根拠：
1. Remotionは既にインストール済み（`@remotion/cli`, `@remotion/player`, `remotion`）
2. `renderWithRemotion()` が既に `video-processor.ts:828` に骨格として存在
3. Next.jsとRemotionは同じReact → コンポジション共有可能
4. FFmpegとRemotionは並行稼働できる（分析はFFmpeg、描画はRemotion）

### 注意事項

| 懸念 | 対策 |
|---|---|
| Remotionレンダリングが遅い | バンドルをキャッシュ。シンプルな出力はFFmpegのまま |
| Lambda上でRemotionが動くか | `@remotion/lambda` パッケージがある。SST対応 |
| Remotionライセンス | 商用は Companies License（有料）。要確認 |

### 実装のやること（3つだけ）

1. **`export/route.ts` に分岐を1つ追加**（`needsRemotion` 判定）
2. **Remotionコンポジションを増やす**（ナレーション用、クリップ用、サムネ用）
3. **編集画面に `<Player>` を埋め込む**（プレビュー）

既存の処理は一切壊れない。
