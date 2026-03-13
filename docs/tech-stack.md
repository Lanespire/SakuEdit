# SakuEdit 技術スタック

## 確定技術

| カテゴリ | 技術 | バージョン | 用途 |
|----------|------|-----------|------|
| Framework | Next.js | 16.x | App Router, RSC |
| UI | React | 19.x | コンポーネント |
| Styling | Tailwind CSS | 4.x | スタイリング |
| Database | Turso / libSQL | latest | アプリ runtime DB |
| ORM | Prisma | Latest | DB操作 |
| Auth | Better Auth | Latest | 認証 |
| Video | Remotion | Latest | 動画生成・編集 |

---

## 技術選定結果

### ASR（音声認識）

**採用技術**: OpenAI Whisper

| 候補 | 精度（日本語） | 処理速度 | コスト | オフライン対応 | 話者認識 | タイムコード生成 | ライセンス |
|------|---------------|---------|--------|--------------|---------|----------------|----------|
| **OpenAI Whisper** | 高い。多言語対応で日本語向き | 中 | `$0.006/分` | API不可、OSS自前実行なら可 | なし | **word/segment粒度で対応** | MIT (OSS版) |
| Web Speech API | 中〜低。ブラウザ/OS依存が強く不安定 | 高（リアルタイム） | 無料 | 一部可（実験的） | なし | 実質なし | Web標準API |
| Z.AI ASR (glm-asr-2512) | 高め（日本語比較根拠はWhisperより薄い） | 高（ストリーミング対応） | `$0.0024/分`相当 | 不可 | なし | なし | プロプライエタリ |

**選定理由**

1. **高品質な日本語文字起こし**: Whisperは多言語対応で日本語精度が高い
2. **編集可能なタイムコード**: word/segment粒度でタイムコードが出力可能
3. **長尺動画への安定対応**: 30秒/25MB制限がない
4. **Remotionとの接続性**: タイムコードをRemotionの字幕JSONに正規化しやすい

**補足**:
- Z.AIの `glm-asr-2512` は30秒/25MB制限とタイムコード非対応があるため、ASR本体には不向き
- `glm-5` はASRではなく、字幕整形・句読点補正・要約・YouTuberスタイル分析に使用
- Web Speech APIは「マイク入力での簡易修正」用途に限定

### 動画処理

**採用技術**: Server-side processing (FFmpeg)

| 候補 | 処理速度 | クライアントCPU負荷 | サーバーコスト | 機能 | ブラウザ対応 | 開発難易度 |
|------|---------|------------------|-------------|------|------------|----------|
| **Server-side processing** | 高くて安定 | 低い | 中〜高 | **最も広い**。無音検出、精密トリミング、字幕焼き込み | 非常に良い | 中 |
| FFmpeg.wasm | 低（ネイティブより大幅に遅い） | 非常に高い | 低い | 広いがパフォーマンスに課題 | 広め | 中 |
| WebCodecs | 高い（ブラウザ内codec直接） | 中〜高 | 低い | 低〜中（字幕焼き込み等は自前実装が重い） | 限定的 | 高 |

**選定理由**

1. **処理速度**: ネイティブFFmpegによる高速処理
2. **機能網羅性**: 無音検出、精密トリミング、字幕焼き込みまで網羅
3. **クライアント負荷軽減**: 重い処理をサーバー側で行う
4. **ブラウザ互換性**: ブラウザ差異を吸収可能
5. **Remotionとの連携**: サーバー側処理がRemotionとの親和性が高い

**補足**:
- WebCodecsは「ブラウザ内プレビュー高速化」用途で必要なら後から導入検討
- クライアントサイド処理は必要最小限にし、サーバー側で処理を集中させる

### スタイル分析

**使用技術:**
- ZAI API (glm-5) - 動画内容の分析
- OpenAI Whisper - ASR（音声文字起こし）
- 処理フロー:
  1. 動画からフレーム抽出
  2. 音声を抽出してWhisperでテキスト化（タイムコード付き）
  3. LLMで編集スタイルを分析（カット間隔、字幕スタイル、BGM選定）
  4. 分析結果をStyleテンプレートとして保存

**GLM-5の役割**

Z.AIの `glm-5` はASRではなく以下の用途に使用:

1. **字幕整形**: 句読点補正、表記ゆれ統一
2. **要約**: 動画内容の要約生成
3. **YouTuberスタイル分析**: 参考動画から編集スタイルを推定・分析
4. **テキスト処理**: 字幕の圧縮、テンポ調整用テキスト処理

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────┐
│                             クライアント (ブラウザ)                    │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Next.js 16.1.5 + React 19.2.3 + Tailwind CSS 4                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │  │
│  │  │  ランディング  │  │  アップロード  │  │  プレビュー   │             │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │  │
│  │  │  スタイル選択 │  │  編集UI      │  │  書き出し設定 │             │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                      │
│                                    ▼                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            サーバー (API Routes)                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Next.js API Routes                                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │  │
│  │  │  Auth (Better)│  │  動画処理     │  │  ASR処理     │             │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   OpenAI Whisper  │  │     FFmpeg       │  │     Z.AI GLM-5    │
│   (ASR)           │  │  (動画処理)       │  │  (字幕整形/分析)   │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ - 音声文字起こし   │  │ - 音声抽出        │  │ - 句読点補正       │
│ - タイムコード生成 │  │ - 無音検出        │  │ - 表記ゆれ統一     │
│                  │  │ - トリミング       │  │ - 字幕圧縮         │
│                  │  │ - 字幕焼き込み     │  │ - スタイル分析     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Remotion                                     │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  動画生成・編集エンジン                                              │  │
│  │  - 字幕アニメーション                                               │  │
│  │  - トランジション                                                  │  │
│  │  - MP4書き出し                                                     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Turso/libSQL + Prisma                            │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  データベース                                                       │  │
│  │  - User, Project, Video, Style, Subtitle, StyleAnalysis         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 実装フロー

### 1. 動画アップロード時
1. クライアントで動画ファイル選択
2. サーバーにアップロード
3. FFmpegで音声抽出 + 無音検出
4. WhisperでASR（タイムコード付き文字起こし）
5. GLM-5で字幕整形
6. Prismaで保存

### 2. 編集処理時
1. エディタで編集操作
2. フロントエンドでリアルタイムプレビュー（WebCodecs使用予定）
3. 編集結果をPrismaに保存

### 3. 書き出し時
1. 編集データを取得
2. Remotionで動画生成
3. FFmpegで字幕焼き込み + エンコード
4. ダウンロードURLを返却

---

## ディレクトリ構成

```
sakuedit/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認証関連ルート
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── dashboard/          # ダッシュボード
│   │   ├── projects/          # プロジェクト一覧
│   │   ├── editor/            # 動画編集画面
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx   # メイン編集画面
│   │   │   │   └── subtitles/ # 字幕編集モーダル
│   │   ├── export/            # 書き出し設定
│   │   ├── pricing/           # 料金プラン
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Better Auth
│   │   │   ├── videos/        # 動画処理API
│   │   │   ├── asr/           # ASR処理API
│   │   │   ├── styles/        # スタイル分析API
│   │   │   └── export/        # 書き出しAPI
│   │   ├── layout.tsx
│   │   └── page.tsx           # ランディングページ
│   ├── components/             # Reactコンポーネント
│   │   ├── ui/                # UI基本コンポーネント
│   │   ├── editor/            # エディタコンポーネント
│   │   │   ├── timeline/      # タイムライン
│   │   │   ├── preview/       # プレビュー
│   │   │   └── controls/      # コントロール
│   │   ├── modals/            # モーダル
│   │   └── upload/            # アップロード
│   ├── lib/                   # ユーティリティ
│   │   ├── db/                # データベース
│   │   │   └── prisma.ts     # Prismaクライアント
│   │   ├── auth/              # Better Auth設定
│   │   ├── video/             # 動画処理
│   │   │   ├── ffmpeg.ts      # FFmpeg操作
│   │   │   └── remotion.ts    # Remotion操作
│   │   ├── asr/               # ASR
│   │   │   └── whisper.ts     # Whisper連携
│   │   └── ai/                # AI連携
│   │       └── zai.ts         # Z.AI GLM-5連携
│   ├── styles/                # スタイル
│   │   └── globals.css
│   └── remotion/              # Remotionコンポジション
│       ├── Root.tsx           # ルートコンポジション
│       ├── Subtitles.tsx      # 字幕
│       └── composables/       # 再利用可能コンポジション
├── prisma/
│   ├── schema.prisma          # データベーススキーマ
│   ├── migrations/            # マイグレーション
│   └── seed.ts                # シードデータ
├── docs/                      # ドキュメント
│   ├── tech-stack.md          # 技術スタック
│   ├── architecture.md        # アーキテクチャ
│   └── api/                   # APIドキュメント
├── public/                    # 静的ファイル
│   ├── images/
│   └── fonts/
├── .env                       # 環境変数
├── .env.example               # 環境変数テンプレート
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

---

## 依存関係

### 主要パッケージ
```json
{
  "dependencies": {
    "next": "16.1.5",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "@prisma/client": "^5.x",
    "better-auth": "^1.x",
    "@remotion/cli": "^4.x",
    "remotion": "^4.x",
    "@remotion/player": "^4.x",
    "openai": "^4.x",
    "zod": "^3.x",
    "tailwindcss": "^4.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^19.x",
    "@types/react-dom": "^19.x",
    "typescript": "^5.x",
    "eslint": "^9.x",
    "prettier": "^3.x"
  }
}
```

---

## 環境変数

```env
# Database
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN=""
TURSO_DATABASE_NAME="your-database"

# Auth
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"

# OpenAI (Whisper)
OPENAI_API_KEY=""

# Z.AI (GLM-5)
ZAI_API_KEY=""

# Storage
DATABASE_URL="file:./dev.db"
OUTPUT_DIR="./outputs"
```

---

## セキュリティ考慮事項

1. **認証**: Better Authでセキュアな認証を実装
2. **ファイルアップロード**: ファイルサイズ制限、形式チェック
3. **API保護**: レート制限、CSRF保護
4. **データ保護**: ユーザーデータの暗号化
5. **URL取り込み（重要）**:
   - **許可ドメイン**: YouTube, TikTok, Vimeo のみ許可
   - **SSRF対策**: 内部IPへのアクセスをブロック
   - **隔離環境**: ダウンロード・トランスコードは分離コンテナで実行
   - **マルウェア検査**: ファイル形式の厳格な検証
   - **署名URL**: 一時的なアクセスURLを生成
   - **著作権ポリシー**: 分析のみに使用、再配布禁止

---

## パフォーマンス最適化

1. **動画処理**: ジョブキューで非同期処理
2. **キャッシュ**: 反応キャッシュでAPIレスポンスをキャッシュ
3. **CDN**: 静的アセットの配信最適化
4. **コード分割**: 動的インポートでバンドルサイズ削減

---

## データベース戦略

### 開発環境
- **Turso/libSQL**: Prisma schema は `sqlite` を維持しつつ、runtime は `@prisma/adapter-libsql` 経由で Turso を使う

### 本番環境（推奨）
- **Turso/libSQL または PostgreSQL**
- **理由**: 複数ワーカー対応、再起動時のジョブ継続、保存保証

### 移行方法
```bash
# 1. Prisma Migrate はローカル SQLite に対して実行
npx prisma migrate dev --name <migration-name>

# 2. 生成された SQL を Turso CLI で適用
export MIGRATION_SQL_PATH="prisma/migrations/<timestamp>_<migration-name>/migration.sql"
turso db shell "$TURSO_DATABASE_NAME" < "$MIGRATION_SQL_PATH"
```

---

## ストレージ戦略

### 開発環境
- **S3**: `projects/{projectId}/...` の object key を source of truth にする

### 本番環境（推奨）
- **オブジェクトストレージ**: Vercel Blob / Cloudflare R2 / AWS S3
- **理由**: スケーラビリティ、CDN連携、データ耐久性

### ファイル構成
```
uploads/
└── projects/
    └── {projectId}/
        ├── input.mp4
        └── artifacts/
            └── {pipelineVersion}/
                ├── output.mp4
                ├── subtitles.srt
                ├── thumbnail.jpg
                └── source-audio.wav

# S3 使用時
projects/{projectId}/input.mp4
projects/{projectId}/artifacts/{pipelineVersion}/output.mp4
projects/{projectId}/artifacts/{pipelineVersion}/subtitles.srt
projects/{projectId}/artifacts/{pipelineVersion}/thumbnail.jpg
projects/{projectId}/artifacts/{pipelineVersion}/source-audio.wav
projects/{projectId}/exports/{exportJobId}/...
```

---

## ジョブキューシステム

### 開発環境
- **SST Function URL + ProcessingJob**: start API は job を作成し、worker を async invoke する
- **VideoProcessor runtime**: `sst dev` はローカル固定 runtime、deploy は Lambda Layer または container image を使う

### 本番環境（推奨）
- **Vercel Queue / BullMQ (Redis)**: 永続的なジョブ管理
- **機能**:
  - ジョブの永続化
  - 再試行ロジック
  - 進捗トラッキング
  - 失敗時のリカバリー

---

## Better Auth スキーマ対応

Better Authの公式スキーマに準拠:

```prisma
// Better Auth推奨フィールド
model User {
  id            String    @id
  email         String    @unique
  emailVerified Boolean   @default(false)  // DateTime → Boolean
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

公式ドキュメント: https://better-auth.com/docs/concepts/database
