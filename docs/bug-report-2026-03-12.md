# SakuEdit バグレポート (2026-03-12)

テスト環境: localhost:3000 / Demo User (Free プラン) / vlog.mp4 (219MB)

---

## 修正済みバグ ✅

### ~~BUG-001: 書き出し (Export) が完了しない~~ → 仕様通り
- **結論**: Export機能は正常に動作していた。219MBの動画のFFmpegエンコード（720p, libx264）に約4分かかるため、タイムアウトしたように見えていた
- **改善案**: 非同期Export + プログレスバー/WebSocket通知の実装を推奨
- **対応ログ**: `app/api/export/route.ts` に `[export]` ログを追加して進捗確認可能に

### ~~BUG-002: スタイル分析 API が 500 エラー~~ → 修正済み ✅
- **根本原因**: OpenRouterの無料モデル `google/gemini-2.0-flash-exp:free` が廃止されており、`No endpoints found` エラーが発生していた
- **修正内容**: `lib/ai.ts` のモデル設定を Gemini 3.1 世代に更新
  - `geminiFlash`: `google/gemini-2.0-flash-exp:free` → `google/gemini-3.1-flash-lite-preview`
  - `geminiFlashPaid`: `google/gemini-2.0-flash-001` → `google/gemini-3-flash-preview`
  - `geminiPro`: `google/gemini-2.0-pro-exp-02-05:free` → `google/gemini-3.1-pro-preview`
- **確認結果**: curl テストで全5ステップ（YTダウンロード→音声抽出→whisper-cpp ASR→ビジュアル分析→スタイル分析）が正常完了
- **パイプライン性能**: ダウンロード13秒 + 音声抽出0.2秒 + ASR 3秒 + フレーム抽出1秒 + ビジュアル分析12秒 + スタイル分析6秒 = 計約35秒

### ~~BUG-003: プロジェクトステータス表示が不正~~ → 修正済み (Codex)
- **修正内容**: `components/projects/ProjectsDashboardClient.tsx` のデータ取得ロジックを修正
- **確認結果**: プロジェクト一覧で「完了」ステータスが正しく表示される

### ~~BUG-004: /terms と /privacy ページが 404~~ → 修正済み
- **修正内容**: `app/terms/page.tsx` と `app/privacy/page.tsx` を新規作成
- **確認結果**: 両ページとも正常に表示

### ~~BUG-005: 字幕テキストに不自然な文字間スペース~~ → 修正済み
- **根本原因**: 旧ASR実装でトークンを `.join(' ')` しており、日本語の単語間に不要スペースが入っていた。現在は `lib/remotion-whisper-adapter.ts` で日本語時は空文字結合に統一
- **修正内容**: 言語に応じてセパレータを切り替え (`ja`, `zh`, `ko` は空文字、それ以外はスペース)
- **該当コード**: `lib/ai.ts` L476-483

### ~~BUG-007: /home と /style-analysis が認証保護されていない~~ → 修正済み
- **修正内容**: `proxy.ts` の `protectedPrefixes` に `/home`, `/style-analysis`, `/api/analyze`, `/api/process` を追加
- **確認結果**: 未認証でのアクセスで307リダイレクト確認

### ~~BUG-009: サーバーサイドfetchでCookieが転送されない~~ → 修正済み ✅
- **場所**: `app/api/process/start/route.ts`, `app/api/upload/route.ts`
- **根本原因**: Next.jsの`after()`コールバック内でサーバーサイドfetchを行う際、元リクエストのCookieヘッダーを転送していなかった。proxy.tsの認証チェックで401が返っていた
- **修正内容**: 両ファイルで`request.headers.get('cookie')`を取得し、fetchのヘッダーに追加
- **確認結果**: `/api/process/start`が正常にキューイング→処理開始を確認

---

## 残存課題（低優先度）

### BUG-008: 全ページに空の alert 要素 🟢
- **場所**: 全ページ共通
- **症状**: DOM内に常時空の `<div role="alert">` 要素が存在
- **優先度**: P3 - アクセシビリティ改善

### BUG-006: ランディングページの Before/After が "0分" 🟢
- **結論**: `CountUp` コンポーネントが `useInView` でスクロール時に発火する設計。値自体は正しく設定されている (10分→7分)。初期表示が0分に見えるのは仕様
- **改善案**: SSR時にも最終値が表示されるよう、noscript対応を検討
- **優先度**: P3

---

## ✅ 正常動作確認済み

| 機能 | 状態 |
|------|------|
| ランディングページ表示 | ✅ |
| 利用規約ページ | ✅ (修正済み) |
| プライバシーポリシーページ | ✅ (修正済み) |
| ユーザー登録フォーム | ✅ |
| デモユーザーログイン | ✅ |
| ログイン→プロジェクト一覧遷移 | ✅ |
| 動画アップロード (219MB) | ✅ |
| YouTube URL 入力 | ✅ |
| プリセットスタイル選択・適用 | ✅ |
| 動画処理フロー (ASR→字幕生成→無音検出) | ✅ |
| 処理中→編集画面の自動遷移 | ✅ |
| 編集画面のタイムライン表示 | ✅ |
| 書き出しモーダル (プラン制限表示) | ✅ |
| 書き出し機能 (FFmpeg 720p) | ✅ (動作確認済み、約4分) |
| 料金プランページ (4プラン+FAQ) | ✅ |
| スタイル選択ページ (6プリセット) | ✅ |
| ユーザードロップダウンメニュー | ✅ |
| プロジェクトフィルター | ✅ |
| プロジェクトステータス表示 | ✅ (修正済み) |
| 認証保護 (protected routes) | ✅ (修正済み) |
| スタイル分析 (YouTube URL) | ✅ (修正済み) |

---

## テスト済みフロー

1. ランディング → ログイン → プロジェクト一覧 ✅
2. 新規プロジェクト作成 → 動画アップロード → YouTube URL → スタイル分析 ✅ (修正後確認済み)
3. 新規プロジェクト作成 → 動画アップロード → プリセットスタイル適用 → 処理中→完了 → 編集画面 → 書き出し ✅
4. 各ページ表示確認 (全10ページ + 新規2ページ) ✅
5. 認証保護テスト (protected/public分離) ✅
