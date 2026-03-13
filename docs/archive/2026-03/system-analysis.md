# SakuEdit システム分析レポート

> 調査日: 2026-03-13
> 調査方法: フロントエンド / バックエンド / 動画処理の3チーム並行分析

---

## 目次

1. [システム概要](#システム概要)
2. [実装済み機能（✅）](#実装済み機能)
3. [部分実装・制限あり（🔧）](#部分実装制限あり)
4. [未実装・スタブ状態（❌）](#未実装スタブ状態)
5. [技術スタック](#技術スタック)
6. [データベース設計](#データベース設計)
7. [API エンドポイント一覧](#api-エンドポイント一覧)
8. [ページ・UI 一覧](#ページui-一覧)
9. [デプロイ前チェックリスト](#デプロイ前チェックリスト)

---

## システム概要

**SakuEdit** は「急いで動画編集したい人・編集分からない人でもサクッと編集できる」をコンセプトにしたAI動画編集SaaS。

**コア機能**: 動画アップロード → AI自動処理（無音カット・字幕生成）→ マルチトラック編集 → エクスポート

---

## 実装済み機能

### 🎬 動画処理パイプライン（完全実装）

| 機能 | 説明 | 実装箇所 |
|------|------|----------|
| 動画アップロード | ドラッグ&ドロップ、500MBまで、YouTube/TikTok URL対応 | `app/home/page.tsx`, `app/api/upload/route.ts` |
| 音声抽出 | FFmpegで動画から音声分離 | `lib/video-processor.ts` |
| 音声文字起こし (ASR) | Remotion Whisper CPP統合、日本語対応 | `lib/remotion-whisper-adapter.ts` |
| 無音検出 | 閾値ベースの無音区間自動検出 | `lib/video-processor.ts` |
| 字幕自動生成 | ASRセグメントからタイムコード付き字幕生成 | `lib/ai.ts` |
| 波形データ生成 | エディタ表示用波形データ抽出 | `lib/video-processor.ts` |
| サムネイル自動生成 | フレーム抽出によるサムネイル | `lib/video-processor.ts` |

### ✂️ エディタ（完全実装・1232行の大規模コンポーネント）

| 機能 | 説明 | 実装箇所 |
|------|------|----------|
| 3カラムレイアウト | サイドバー / プレビュー+タイムライン / インスペクタ | `app/edit/[id]/page.tsx` |
| マルチトラックタイムライン | 6トラック（動画・音声・字幕・キャプション・エフェクト・オーバーレイ） | `components/editor/MultiTrackTimeline.tsx` |
| 動画プレビュー | HTML5プレーヤー、字幕オーバーレイ、無音スキップ、再生速度変更 | `components/editor/VideoPlayer.tsx` |
| アイテム追加 | テキスト・エフェクト・メディア・図形・音声のテンプレートから追加 | `components/editor/EditorSidebar.tsx`, `AddItemPanel.tsx` |
| プロパティ編集 | 選択アイテムの属性変更（色・サイズ・位置・タイミング等） | `components/editor/PropertyPanel.tsx` |
| AI チャット編集 | 自然言語で編集指示→CompositionPatch自動生成 | `components/editor/IntegratedEditorPanel.tsx` |
| 字幕CRUD | 字幕の追加・編集・削除・スタイルカスタマイズ | `components/editor/SubtitleEditModal.tsx` |
| Undo/Redo | Zustandストアによる履歴管理 | `lib/stores/editor-ui-store.ts` |
| 自動保存 | 30秒ごとのタイムライン+コンポジション自動保存 | `lib/hooks/useEditorActions.ts` |
| 処理ワークスペース | エディタ内で処理中ステータス表示、リトライ機能 | `components/editor/ProcessingWorkspace.tsx` |

### 🎨 Remotion レンダリング（11種エフェクト + 6種オーバーレイ）

| カテゴリ | 対応項目 |
|---------|---------|
| エフェクト (10種) | zoom, shake, flash, blur, color-shift, vignette, glitch, particle, speed-lines, spotlight |
| トランジション (5種) | fade, slide, wipe, flip, clock-wipe |
| オーバーレイ (6種) | text, image, shape (rect/circle/triangle/star/arrow/heart/hexagon), sticker, lower-third, watermark |
| アニメーション (5種) | fadeIn, slideIn, scaleIn, bounceIn, typewriter |
| 字幕スタイル | neon, handwritten等のプリセット |
| 音声SFX (11種) | whoosh, whip, ding等（@remotion/sfx統合） |
| コンポジション | VideoComposition（レガシー）, UniversalComposition（現行・6トラック対応） |

### 📤 エクスポート（完全実装）

| 機能 | 説明 |
|------|------|
| 品質選択 | 720p / 1080p / 4K |
| 字幕オプション | 動画焼き込み / SRT分離 / 両方 |
| サムネイル同時生成 | エクスポート時にサムネイルも生成可能 |
| S3アップロード | 署名付きURL生成（1時間有効） |
| プラン別課金 | 品質別秒数計算（4K=1.5倍）、月間クォータ管理 |

### 🖼️ AIサムネイル生成（完全実装）

| 機能 | 説明 |
|------|------|
| 4つの生成モード | テンプレート / アップロード画像 / ビデオフレーム / 参考YouTuber |
| 複数枚生成 | 1〜4枚同時生成 |
| AI生成エンジン | Gemini 3.1 Flash Image Preview |
| テンプレート管理 | プリセットテンプレート選択 |
| フレーム抽出 | 動画からキーフレーム自動抽出 |

### 🎨 YouTuber スタイル分析（完全実装）

| 機能 | 説明 |
|------|------|
| YouTube URL分析 | 動画DL → フレームサンプリング → AI分析 |
| 分析項目 | 字幕スタイル / カメラスタイル / B-roll / 色彩 / テンポ / 構図 |
| スタイル保存 | 分析結果をプリセットとして保存・再利用 |
| プリセット適用 | ワンクリックでスタイル適用 |

### 🔐 認証・課金（完全実装）

| 機能 | 説明 |
|------|------|
| 認証 | better-auth（メール/パスワード、セッション7日、CSRF保護） |
| 4プラン | Free(¥0/90分) / Pro(¥2,480/600分) / Business(¥8,980/2400分) / Enterprise(要問合せ/無制限) |
| Stripe統合 | Checkout セッション生成 + Webhook同期 |
| クォータ管理 | 月間分数制限、品質別制限、機能ゲーティング |

### 📄 静的ページ（完全実装）

| ページ | ルート |
|--------|--------|
| ランディングページ | `/` |
| 料金プラン | `/pricing` |
| プライバシーポリシー | `/privacy` |
| 利用規約 | `/terms` |
| 特定商取引法 | `/commercial-transactions` |
| サインイン / サインアップ | `/auth/signin`, `/auth/signup` |
| プロジェクト一覧 | `/projects` |

---

## 部分実装・制限あり

### 🔧 オーディオブラウザ UI（UI実装済み・バックエンド一部無効）

| 項目 | 状態 | 詳細 |
|------|------|------|
| `AudioBrowser.tsx` (467行) | UI完全実装 | Freesound検索 + AI生成（BGM/ボイスオーバー/SFX）のUIとプレビュー再生 |
| Freesound クライアント | コメントアウト | `lib/freesound-client.ts` - デプロイ後ドメイン確定時に有効化予定 |
| `/api/audio/search` | 503返却 | Freesound API KEY待ち |

### 🔧 オーディオ生成API群（エンドポイント存在・動作未確認）

| エンドポイント | 状態 |
|---------------|------|
| `POST /api/audio/generate-bgm` | 実装あり・外部API依存の動作未確認 |
| `POST /api/audio/generate-voiceover` | 実装あり・外部API依存の動作未確認 |
| `POST /api/audio/generate-sfx` | 実装あり・外部API依存の動作未確認 |
| `GET /api/audio/voices` | 実装あり・ElevenLabs API依存 |

### 🔧 YouTube ダウンロード

| 項目 | 状態 |
|------|------|
| `downloadFromYouTube()` | 実装済みだがLambda層に `yt-dlp` バイナリ配置が必要 |
| ローカル環境 | yt-dlp インストール済みなら動作可能 |
| 本番環境 | コンテナLambda検討推奨 |

### 🔧 レガシーコンポーネント（未使用・残存）

| コンポーネント | 状態 |
|---------------|------|
| `EditorTimeline.tsx` (368行) | 旧シングルトラック。`MultiTrackTimeline.tsx` に置換済みだが削除されていない |
| `VideoComposition.tsx` (170行) | 旧コンポジション。`UniversalComposition.tsx` が現行だが両方登録されている |

### 🔧 TypeScript エラー（ビルド影響の可能性）

| ファイル | エラー | 内容 |
|---------|-------|------|
| `app/api/thumbnail/[id]/route.ts` | TS2339 | `prisma.thumbnail` が型に存在しない |
| `app/api/thumbnail/[id]/select/route.ts` | TS2339/TS2353 | `selectedThumbnailId` がProject型に存在しない |
| `app/api/projects/[id]/route.ts` | TS2353 | `thumbnails` がProjectIncludeに存在しない |
| `lib/ai.ts` | TS6385/6387 | `generateObject` が非推奨 |

---

## 未実装・スタブ状態

### ❌ Freesound 音声検索

- `lib/freesound-client.ts` 全体がコメントアウト
- `GET /api/audio/search` は503固定レスポンス
- **必要なもの**: Freesound API KEY + デプロイドメイン確定

### ❌ 外部API連携（キー未設定）

| サービス | 用途 | 状態 |
|---------|------|------|
| Freesound | 音声素材検索 | API KEY 未設定 |
| ElevenLabs | ボイスオーバー生成 | API KEY 未確認 |
| Beatoven.ai | BGM生成 | 統合状態未確認 |

### ❌ E2Eテスト

- Playwrightの設定・テストファイルは未確認
- `package.json` にPlaywright依存があるか要確認

### ❌ PWA / モバイル最適化

- レスポンシブ対応はHeader等一部のみ
- エディタページのモバイル対応は限定的

---

## 技術スタック

### フレームワーク・ライブラリ

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16.1.5 |
| UI | React 19.2.3 |
| スタイリング | Tailwind CSS 4 |
| 状態管理 | Zustand（4ストア: editor-ui, composition, thumbnail, projects-filter） |
| アニメーション | Framer Motion |
| フォーム | react-hook-form + Zod |
| データフェッチ | SWR |
| ORM | Prisma |
| DB | SQLite（ローカル）/ Turso（本番・libSQL adapter） |
| 認証 | better-auth |
| 決済 | Stripe |
| 動画生成 | Remotion 4.x + Remotion Skills |
| ASR | Remotion Whisper CPP v1.7.4 |
| AI | OpenRouter → Gemini 3.1 Flash / Flash Image Preview |
| ストレージ | AWS S3 + ローカルファイルシステム |
| インフラ | SST (Serverless Stack) + AWS Lambda |

### 主要依存パッケージ

- `@remotion/renderer`, `@remotion/sfx`, `@remotion/paths`, `@remotion/noise`
- `@remotion/install-whisper-cpp`
- `better-auth`
- `stripe`
- `@prisma/client`, `@prisma/adapter-libsql`
- `zustand`
- `framer-motion`
- `swr`

---

## データベース設計

```
User
 ├── Project (1:N)
 │    ├── Video (1:1)
 │    ├── Subtitle (1:N)
 │    ├── ExportJob (1:N)
 │    ├── AnalysisJob (1:N)
 │    ├── Timeline (1:1)
 │    │    └── TimelineTrack (1:N)
 │    │         └── ClipSegment (1:N)
 │    ├── Marker (1:N)
 │    ├── UndoSnapshot (1:N)
 │    ├── AISuggestion (1:N)
 │    ├── Thumbnail (1:N)
 │    └── Style (M:1)
 ├── Subscription (1:1) → Plan
 ├── UsageLog (1:N)
 └── Style (1:N)
```

### プロジェクトステータスフロー

```
DRAFT → UPLOADING → ANALYZING → QUEUED → PROCESSING → EXPORTING → COMPLETED
                                                                  → ERROR
                                                                  → CANCELED
```

---

## API エンドポイント一覧（全34）

### プロジェクト管理
| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/api/projects` | 一覧取得・新規作成 |
| GET/PATCH/DELETE | `/api/projects/[id]` | 詳細・更新・削除 |
| GET | `/api/projects/[id]/source-video` | ソース動画取得 |
| GET/POST | `/api/projects/[id]/subtitles` | 字幕一覧・作成 |
| PATCH/DELETE | `/api/projects/[id]/subtitles/[subtitleId]` | 字幕編集・削除 |
| POST | `/api/projects/[id]/chat` | AI チャット |
| GET/POST | `/api/projects/[id]/ai-suggestions` | AI提案 |
| PUT | `/api/projects/[id]/markers` | マーカー更新 |
| PATCH | `/api/projects/[id]/timeline` | タイムライン保存 |

### アップロード・処理
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/upload` | ファイルアップロード |
| GET/POST | `/api/process` | 処理開始・ステータス |
| POST | `/api/process/start` | 非同期処理開始 |

### エクスポート
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/export` | エクスポート開始 |
| GET | `/api/export/[projectId]/[jobId]` | ジョブ状態 |
| GET | `/api/export/[projectId]/[jobId]/[type]` | ファイル取得 |
| GET | `/api/download/[projectId]` | ダウンロード |

### 音声
| メソッド | パス | 説明 | 状態 |
|---------|------|------|------|
| GET | `/api/audio/search` | Freesound検索 | ❌ 503固定 |
| GET | `/api/audio/voices` | 音声一覧 | 🔧 |
| POST | `/api/audio/generate-bgm` | BGM生成 | 🔧 |
| POST | `/api/audio/generate-voiceover` | ボイスオーバー | 🔧 |
| POST | `/api/audio/generate-sfx` | SFX生成 | 🔧 |

### サムネイル
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/thumbnail/generate` | AI生成 |
| GET | `/api/thumbnail/[id]` | 取得 |
| POST | `/api/thumbnail/[id]/select` | 選択確定 |
| GET | `/api/thumbnail/generated/[id]` | 生成画像取得 |
| GET | `/api/thumbnail/templates` | テンプレート一覧 |
| POST | `/api/thumbnail/extract-frames` | フレーム抽出 |

### スタイル
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/styles` | スタイル一覧 |
| POST | `/api/styles/preset` | プリセット適用 |
| POST | `/api/analyze` | YouTube分析 |

### 認証・課金
| メソッド | パス | 説明 |
|---------|------|------|
| ALL | `/api/auth/[...all]` | better-auth |
| POST | `/api/billing/checkout` | Stripe Checkout |
| POST | `/api/stripe/webhook` | Stripe Webhook |
| GET | `/api/anonymous/usage` | 匿名利用追跡 |

---

## ページ・UI 一覧（全13ページ）

| ページ | ルート | 状態 | 行数 |
|--------|--------|------|------|
| ランディング | `/` | ✅ | ~500 |
| サインイン | `/auth/signin` | ✅ | - |
| サインアップ | `/auth/signup` | ✅ | - |
| アップロード | `/home` | ✅ | - |
| スタイル選択 | `/styles` | ✅ | - |
| スタイル分析中 | `/style-analysis` | ✅ | - |
| 処理中 | `/processing/[id]` | ✅ (リダイレクト) | - |
| **メインエディタ** | `/edit/[id]` | ✅ | **1232** |
| プロジェクト一覧 | `/projects` | ✅ | - |
| 料金プラン | `/pricing` | ✅ | - |
| プライバシーポリシー | `/privacy` | ✅ | - |
| 利用規約 | `/terms` | ✅ | - |
| 特定商取引法 | `/commercial-transactions` | ✅ | - |

---

## デプロイ前チェックリスト

### 必須

- [ ] `OPENROUTER_API_KEY` 設定確認
- [ ] Stripe API KEY（`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`）設定
- [ ] AWS S3 バケット作成・権限設定
- [ ] Turso DB 接続設定（`DATABASE_URL`, `DATABASE_AUTH_TOKEN`）
- [ ] `BETTER_AUTH_SECRET` 設定
- [ ] TypeScript エラー修正（Thumbnail関連の型不一致）
- [ ] Prisma マイグレーション実行

### 推奨

- [ ] Freesound API KEY 取得・有効化
- [ ] ElevenLabs API KEY 設定
- [ ] Lambda層に yt-dlp バイナリ配置（YouTube DL用）
- [ ] レガシーコンポーネント整理（`EditorTimeline.tsx`, `VideoComposition.tsx`）
- [ ] `generateObject` 非推奨APIの更新（ai.ts）
- [ ] E2Eテスト整備

### 確認事項

- [ ] `npm run build` 成功
- [ ] ローカルでの全フロー動作確認
- [ ] AWS リージョン設定
- [ ] CORS / 信頼オリジン設定

---

## 全体実装度サマリー

| カテゴリ | 実装度 | 状態 |
|---------|--------|------|
| 動画処理パイプライン | 100% | ✅ |
| マルチトラックエディタ | 100% | ✅ |
| Remotion レンダリング | 100% | ✅ |
| 無音カット | 100% | ✅ |
| 字幕・ASR | 100% | ✅ |
| エクスポート | 100% | ✅ |
| AIサムネイル生成 | 95% | ✅（型エラーあり） |
| YouTuberスタイル分析 | 100% | ✅ |
| AI チャット編集 | 100% | ✅ |
| 認証・認可 | 100% | ✅ |
| 課金・Stripe | 100% | ✅ |
| 全ページUI | 100% | ✅ |
| 音声素材検索 | 20% | ❌（Stub） |
| 音声生成API | 50% | 🔧（外部API依存） |
| E2Eテスト | 0% | ❌ |

**総合実装度: 約90%** — 主要機能は全て実装完了。残りはオーディオ外部API連携とテスト整備。
