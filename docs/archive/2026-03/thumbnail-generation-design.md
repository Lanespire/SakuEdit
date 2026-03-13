# サムネイルAI生成機能 設計書

## 1. 概要

動画編集完了後、AI（Gemini 3.1 Flash Image Preview via OpenRouter）を使って YouTube サムネイルを自動生成する機能。
samune-ai.jp のように、素材アップロード・動画フレーム利用・参考YouTuberスタイル再現・テンプレート選択をサポートする。

### 主な特徴

- ボタン押下で生成（自動ではなくオンデマンド）
- 4つの生成モード（テンプレート / 素材UP / 動画フレーム / 参考YouTuber風）
- 最大4枚同時生成、採用→プロジェクト代表サムネに設定
- Pro以上のプランで利用可能

---

## 2. システム構成図

```
┌──────────────────────────────────────────────────────────┐
│  Edit Page (/edit/[id])                                  │
│  ┌────────────────────────┐                              │
│  │ Bottom Toolbar          │                              │
│  │ [書き出し] [サムネ生成]  │  ← 新規ボタン追加            │
│  └────────┬───────────────┘                              │
│           │                                              │
│  ┌────────▼───────────────────────────────────────────┐  │
│  │ ThumbnailGeneratorModal                            │  │
│  │                                                    │  │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │  │
│  │ │テンプレ│ │素材UP │ │動画素材│ │参考風  │ ← 4つのタブ │  │
│  │ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘              │  │
│  │    │        │        │        │                    │  │
│  │ ┌──▼────────▼────────▼────────▼──┐                │  │
│  │ │  プロンプト入力 + オプション     │                │  │
│  │ │  [タイトルテキスト] [色味] [構図] │                │  │
│  │ └──────────────┬─────────────────┘                │  │
│  │                │                                    │  │
│  │ ┌──────────────▼─────────────────┐                │  │
│  │ │  生成結果プレビュー (最大4枚)    │                │  │
│  │ │  [採用] [再生成] [編集]          │                │  │
│  │ └────────────────────────────────┘                │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
              POST /api/thumbnail/generate
                         │
                         ▼
           ┌─────────────────────────┐
           │  lib/ai-thumbnail.ts    │
           │                         │
           │  OpenRouter API          │
           │  google/gemini-3.1-     │
           │  flash-image-preview    │
           │                         │
           │  modalities: ["image",  │
           │               "text"]   │
           └────────┬────────────────┘
                    │
                    ▼ base64 image
           ┌─────────────────────────┐
           │  uploads/projects/      │
           │   {projectId}/          │
           │    thumbnails/          │
           │     {id}.png            │
           └─────────────────────────┘
```

---

## 3. データモデル（Prisma スキーマ追加）

### 3.1 Thumbnail モデル（新規）

```prisma
// ============================================
// Thumbnail (AI生成サムネイル)
// ============================================

model Thumbnail {
  id          String          @id @default(cuid())
  projectId   String
  status      JobStatus       @default(PENDING)

  // 生成設定
  mode        ThumbnailMode   // テンプレ / 素材UP / 動画フレーム / 参考風
  templateId  String?         // テンプレート使用時
  prompt      String          // ユーザー入力テキスト（タイトルなど）
  stylePrompt String?         // 参考YouTuber風の追加プロンプト

  // 入力素材
  inputImages Json?           // [{path, type: "upload"|"frame"|"reference"}]

  // 生成結果
  imageUrl    String?         // 表示用URL (/api/thumbnail/generated/[id])
  imagePath   String?         // ディスク上のパス
  width       Int             @default(1280)
  height      Int             @default(720)

  // メタ
  isSelected  Boolean         @default(false) // 採用されたサムネイル
  error       String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  project     Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("thumbnails")
}

enum ThumbnailMode {
  TEMPLATE      // テンプレートから生成
  UPLOAD        // 自分の素材をベースに生成
  VIDEO_FRAME   // 動画フレームをベースに生成
  REFERENCE     // 参考YouTuberのスタイルで生成
}
```

### 3.2 既存モデルへの変更

```prisma
// Project モデルにリレーション追加
model Project {
  // ... 既存フィールド
  thumbnails  Thumbnail[]
}

// Plan モデルにサムネ生成回数追加
model Plan {
  // ... 既存フィールド
  monthlyThumbnailCount  Int  @default(0)  // 月間サムネ生成回数
}
```

---

## 4. API設計

### 4.1 POST /api/thumbnail/generate

サムネイル生成リクエスト。

**Request Body:**

```typescript
interface ThumbnailGenerateRequest {
  projectId: string
  mode: 'TEMPLATE' | 'UPLOAD' | 'VIDEO_FRAME' | 'REFERENCE'

  // 共通
  prompt: string              // サムネに入れたいテキスト（動画タイトルなど）

  // テンプレートモード
  templateId?: string

  // 素材アップロードモード
  uploadedImages?: string[]   // base64画像の配列

  // 動画フレームモード
  frameTimestamps?: number[]  // 使いたいフレームの秒数

  // 参考YouTuberモード
  referenceUrl?: string       // YouTube URL（既存のスタイル分析結果を利用）
  referenceImages?: string[]  // 参考サムネイル画像(base64)

  // オプション
  options?: {
    aspectRatio?: '16:9' | '4:3'  // デフォルト 16:9
    textPosition?: 'left' | 'center' | 'right'
    colorScheme?: string          // "warm" | "cool" | "vibrant" | "dark"
    count?: number                // 生成枚数 (1-4, デフォルト2)
  }
}
```

**Response:**

```typescript
interface ThumbnailGenerateResponse {
  thumbnails: Array<{
    id: string
    imageUrl: string       // /api/thumbnail/generated/{id}
    width: number
    height: number
  }>
}
```

### 4.2 GET /api/thumbnail/generated/[id]

生成済みサムネイル画像の配信（PNG/JPEG）。

### 4.3 POST /api/thumbnail/[id]/select

サムネイルを採用（プロジェクトの代表サムネイルに設定）。

### 4.4 GET /api/thumbnail/templates

テンプレート一覧を返す。

```typescript
interface ThumbnailTemplate {
  id: string
  name: string
  category: 'gaming' | 'vlog' | 'education' | 'business' | 'entertainment'
  previewUrl: string
  description: string
  promptHint: string  // テンプレート用のベースプロンプト
}
```

### 4.5 POST /api/thumbnail/extract-frames

動画から指定時間のフレームを抽出（FFmpeg利用）。

```typescript
// Request
{ projectId: string, timestamps: number[] }

// Response
{ frames: Array<{ timestamp: number, imageUrl: string, base64: string }> }
```

---

## 5. AI生成ロジック（lib/ai-thumbnail.ts）

### 5.1 モデル設定

```typescript
// OpenRouter + Gemini 3.1 Flash Image Preview
const THUMBNAIL_MODEL = 'google/gemini-3.1-flash-image-preview'

// 料金:
//   input:  $0.10 / 1M tokens
//   output (text):  $0.40 / 1M tokens
//   output (image): $60 / 1M tokens
//   ≈ $0.15 / 4K画像 (約22円)
```

### 5.2 API呼び出しイメージ

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-3.1-flash-image-preview',
    modalities: ['image', 'text'],     // 画像出力を有効化
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          // 入力画像がある場合
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64}` }
          },
        ],
      },
    ],
  }),
})

// レスポンスから base64 画像を取得
// response.choices[0].message.content → 画像データURL
```

### 5.3 生成フロー（モード別）

| モード | 入力 | プロンプト戦略 |
|--------|------|----------------|
| **TEMPLATE** | テンプレートベースプロンプト + タイトル | テンプレートの構図・色味を指示 + ユーザーのタイトルテキストを合成 |
| **UPLOAD** | ユーザーアップロード画像 + タイトル | 画像を参照しつつ、サムネイル向けにリミックス |
| **VIDEO_FRAME** | 動画フレーム（FFmpegで抽出） | フレームの人物・背景を活かしてサムネイル化 |
| **REFERENCE** | 参考サムネイル画像 + Style分析結果 | 参考のレイアウト・色味・テキスト配置を模倣 |

### 5.4 プロンプト設計

```
[System Prompt]
You are a professional YouTube thumbnail designer.
Create a 1280x720 thumbnail image.

Rules:
1. テキストは大きく読みやすく配置
2. 日本語テキストを正確にレンダリング
3. YouTubeサムネイルとして目を引くデザイン
4. 人物がある場合は顔を大きく
5. 背景はシンプルすぎずうるさすぎず
6. コントラストを高くして視認性確保

[User Prompt - TEMPLATEモード例]
テンプレート: バトル系ゲーム実況
タイトルテキスト: 「最強武器で無双してみた」
色味: warm
テキスト位置: right

[User Prompt - REFERENCEモード例]
参考画像のスタイルを模倣してサムネイルを作成してください。
- 構図: {visualProfile.compositionStyle}
- 色味: {visualProfile.colorStyle}
- テキスト配置: {visualProfile.subtitleStyle}
タイトルテキスト: 「最強武器で無双してみた」
```

---

## 6. フロントエンド コンポーネント構成

### 6.1 ファイル構成

```
components/
  thumbnail/
    ThumbnailGeneratorModal.tsx    # メインモーダル（タブ切替 + 生成ボタン）
    ThumbnailTemplateGrid.tsx      # テンプレート選択グリッド
    ThumbnailUploader.tsx          # 素材アップロード（D&D対応）
    ThumbnailFramePicker.tsx       # 動画フレーム選択（シークバー）
    ThumbnailReferenceInput.tsx    # 参考URL/画像入力
    ThumbnailPreviewGrid.tsx       # 生成結果プレビュー（最大4枚）
    ThumbnailPromptInput.tsx       # プロンプト・オプション入力欄
```

### 6.2 モーダル UIレイアウト

```
┌─────────────────────────────────────────────────────┐
│  サムネイル生成                                [×]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [テンプレート] [素材アップ] [動画から] [参考風]     │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ (タブコンテンツ)                               │  │
│  │  テンプレートグリッド / アップローダー /        │  │
│  │  フレームピッカー / 参考入力                    │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ─── テキスト入力 ──────────────────────────────── │
│  [サムネイルに入れるテキスト                     ]  │
│  [サブテキスト（任意）                           ]  │
│                                                     │
│  ─── オプション ───────────────────────────────── │
│  色味: [warm] [cool] [vibrant] [dark]               │
│  テキスト位置: [左] [中央] [右]                     │
│  生成枚数: [1] [2] [3] [4]                          │
│                                                     │
│             [サムネイルを生成]                       │
│                                                     │
│  ─── 生成結果 ─────────────────────────────────── │
│  ┌────────┐ ┌────────┐                              │
│  │  img1  │ │  img2  │                              │
│  │ [採用] │ │ [採用] │                              │
│  └────────┘ └────────┘                              │
│                                                     │
│                            [再生成] [ダウンロード]    │
└─────────────────────────────────────────────────────┘
```

---

## 7. テンプレート設計

テンプレートはJSONファイルで管理（`lib/thumbnail-templates.ts`）。

### 7.1 初期テンプレート一覧

| カテゴリ | テンプレート名 | 構図 | 特徴 |
|----------|---------------|------|------|
| ゲーム実況 | バトル系 | 人物左 + 大テキスト右 | 赤系グラデ背景、衝撃フォント |
| ゲーム実況 | 攻略系 | 中央テキスト + 枠付き | 青系、分かりやすい |
| Vlog | おしゃれ系 | 写真フルブリード + 下部テキスト | 淡色、ミニマル |
| Vlog | 旅行系 | 風景背景 + 白抜きテキスト | 暖色、鮮やか |
| 教育 | 解説系 | 左にアイコン + 右に要点テキスト | クリーン、見やすい |
| 教育 | ランキング系 | 数字大きく + リスト風 | 黄色アクセント |
| ビジネス | プレゼン風 | 中央揃え + グラデ背景 | 青白、信頼感 |
| エンタメ | ドッキリ/驚き | 斜めテキスト + 驚きエフェクト | 派手、高彩度 |

### 7.2 テンプレートデータ形式

```typescript
export interface ThumbnailTemplate {
  id: string
  name: string
  category: 'gaming' | 'vlog' | 'education' | 'business' | 'entertainment'
  previewUrl: string
  description: string
  promptHint: string  // AI生成用のベースプロンプト
}

export const THUMBNAIL_TEMPLATES: ThumbnailTemplate[] = [
  {
    id: 'gaming-battle',
    name: 'バトル系',
    category: 'gaming',
    previewUrl: '/templates/gaming-battle.png',
    description: '迫力のあるゲーム実況サムネイル',
    promptHint: 'Create a dynamic gaming thumbnail with the person on the left side, large bold impact text on the right, red gradient background with energy effects, dramatic lighting...',
  },
  // ...
]
```

---

## 8. プラン制御・課金

### 8.1 プラン別制限

| プラン | サムネイル生成 | 月間生成数 | 備考 |
|--------|--------------|-----------|------|
| **Free** | 不可 | 0 | アップグレード誘導表示 |
| **Pro** | 可能 | 10枚/月 | |
| **Business** | 可能 | 50枚/月 | |
| **Enterprise** | 可能 | 無制限 | |

### 8.2 コスト見積もり

- Gemini 3.1 Flash Image Preview: 1枚 ≈ **$0.15**（約22円）
- Pro (10枚/月): 最大 ≈ 220円/ユーザー/月
- Business (50枚/月): 最大 ≈ 1,100円/ユーザー/月

### 8.3 Plan スキーマへの追加

```typescript
// lib/plans.ts の PlanDefinition に追加
monthlyThumbnailCount: number

// 各プランの値:
// free: 0
// pro: 10
// business: 50
// enterprise: 999
```

---

## 9. ファイル変更一覧

### 9.1 新規作成

| ファイル | 説明 |
|---------|------|
| `lib/ai-thumbnail.ts` | Gemini 3.1 Image生成ロジック |
| `lib/thumbnail-templates.ts` | テンプレート定義（JSON） |
| `app/api/thumbnail/generate/route.ts` | 生成API |
| `app/api/thumbnail/generated/[id]/route.ts` | 生成済み画像配信API |
| `app/api/thumbnail/[id]/select/route.ts` | サムネイル採用API |
| `app/api/thumbnail/templates/route.ts` | テンプレート一覧API |
| `app/api/thumbnail/extract-frames/route.ts` | フレーム抽出API |
| `components/thumbnail/ThumbnailGeneratorModal.tsx` | メインモーダル |
| `components/thumbnail/ThumbnailTemplateGrid.tsx` | テンプレート選択 |
| `components/thumbnail/ThumbnailUploader.tsx` | 素材アップロード |
| `components/thumbnail/ThumbnailFramePicker.tsx` | フレーム選択 |
| `components/thumbnail/ThumbnailReferenceInput.tsx` | 参考入力 |
| `components/thumbnail/ThumbnailPreviewGrid.tsx` | 結果プレビュー |
| `components/thumbnail/ThumbnailPromptInput.tsx` | プロンプト入力 |

### 9.2 既存ファイル変更

| ファイル | 変更内容 |
|---------|---------|
| `prisma/schema.prisma` | `Thumbnail` モデル追加、`ThumbnailMode` enum追加、`Project` リレーション追加、`Plan` に `monthlyThumbnailCount` 追加 |
| `app/edit/[id]/page.tsx` | 「サムネ生成」ボタン追加（Bottom Toolbar）、モーダル呼び出し |
| `lib/ai.ts` | `MODELS` に `geminiFlashImage` 追加 |
| `lib/plans.ts` | `PlanDefinition` に `monthlyThumbnailCount` 追加、各プラン値設定 |

---

## 10. 実装優先順位

| Phase | タスク | 内容 |
|-------|--------|------|
| **1** | DBスキーマ | Thumbnail モデル、Plan 拡張、マイグレーション |
| **2** | AI生成コア | `lib/ai-thumbnail.ts`（OpenRouter API呼び出し） |
| **3** | 生成API | `POST /api/thumbnail/generate`（テンプレートモードのみ） |
| **4** | モーダルUI | `ThumbnailGeneratorModal` 基本UI + テンプレートタブ |
| **5** | Edit統合 | Edit ページへのボタン追加・モーダル接続 |
| **6** | フレーム抽出 | FFmpegフレーム抽出 + VIDEO_FRAME モード |
| **7** | 素材アップ | ドラッグ&ドロップ + UPLOAD モード |
| **8** | 参考風モード | 既存Style分析結果活用 + REFERENCE モード |
| **9** | プラン制御 | 使用量カウント・制限チェック |

---

## 11. 技術的な注意点

### 11.1 OpenRouter API

- 既存の `OPENROUTER_API_KEY` をそのまま利用（新規キー不要）
- `modalities: ["image", "text"]` で画像出力を有効化
- レスポンスの画像は `data:image/png;base64,...` 形式
- `image_config` パラメータでアスペクト比制御可能

### 11.2 画像サイズ

- YouTubeサムネイル推奨: **1280 x 720** (16:9)
- 生成時にこのサイズを指定
- 0.5K解像度オプションで低コスト生成も可能

### 11.3 既存機能との連携

- **スタイル分析**: `analyzeVisualStyle()` の結果（色味・構図）をREFERENCEモードのプロンプトに活用
- **動画フレーム**: `lib/video-processor.ts` の既存FFmpegロジックでフレーム抽出
- **ExportJob**: 書き出し時にサムネイルも同時ダウンロード可能

---

## 参考リンク

- [OpenRouter Gemini 3.1 Flash Image Preview](https://openrouter.ai/google/gemini-3.1-flash-image-preview)
- [OpenRouter Image Generation Docs](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)
- [サムネAI (参考サービス)](https://www.samune-ai.jp/)
