# SakuEdit 本番リリース前チェックリスト

最終更新: 2026-03-14

---

## 1. セキュリティ (Security)

- [ ] 🔴 **APIキー・シークレットの漏洩確認** (P0 - ブロッカー)
  - `.env` ファイルに本番のAPIキー（OPENROUTER_API_KEY, DEEPGRAM_API_KEY, ELEVENLABS_API_KEY, BEATOVEN_API_KEY等）がハードコードされている。Gitに `.env` がコミットされていないことを確認し、本番環境ではSST SecretまたはAWS Parameter Storeで管理すること
  - `BETTER_AUTH_SECRET` が `.env` でデフォルト値 `"sakuedit-secret-key-change-in-production"` のまま → 本番では必ず強力なランダム値に変更

- [ ] 🔴 **Next.js middleware（認証ガード）の不在** (P0 - ブロッカー)
  - プロジェクトルートに `middleware.ts` が存在しない。`/home`, `/projects`, `/edit`, `/api/*` 等の保護ルートに対して認証チェックが行われていない可能性がある
  - 最低限、認証必須ページへの未ログインアクセスをリダイレクトするmiddlewareを追加すること

- [ ] 🔴 **Stripe Secretキーのデフォルト値** (P0 - ブロッカー)
  - `sst.config.ts` で `StripePublishableKey`, `StripeSecretKey`, `StripeWebhookSecret` が `"pk_test_replace_me"`, `"sk_test_replace_me"`, `"whsec_replace_me"` のままデフォルト設定されている
  - 本番デプロイ前に `sst secret set` で本番用Stripeキーを設定すること

- [ ] 🟡 **CSP (Content Security Policy) の設定** (P1 - 推奨)
  - `next.config.ts` にセキュリティヘッダー（CSP, X-Frame-Options, X-Content-Type-Options等）の設定がない
  - `headers()` 関数でセキュリティヘッダーを追加すること

- [ ] 🟡 **APIルートの認証チェック** (P1 - 推奨)
  - `/api/billing/checkout`, `/api/upload`, `/api/process`, `/api/export` 等のAPIルートで認証チェックが一貫して行われているか確認
  - 匿名APIのレート制限が適切に設定されているか確認

- [ ] 🟡 **Stripe Webhook署名検証** (P1 - 推奨)
  - `/api/stripe/webhook` でWebhookの署名検証（`stripe.webhooks.constructEvent`）が正しく実装されていることを確認

- [ ] 🔵 **CORS設定の確認** (P2 - あると良い)
  - VideoProcessor Lambda Function URLのCORS設定を確認し、本番ドメインのみ許可するよう設定

---

## 2. 環境設定 (Environment)

- [ ] 🔴 **本番用環境変数の設定** (P0 - ブロッカー)
  - `.env.example` には以下が記載されているが、本番で追加で必要な変数を確認:
    - `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` → 本番DBインスタンス
    - `BETTER_AUTH_URL` → 本番URL（`https://sakuedit.com` 等）に変更
    - `BETTER_AUTH_SECRET` → 強力なランダム値
    - `DEEPGRAM_API_KEY` → 本番用キー（.env.exampleに未記載だが.envで使用）
    - `ELEVENLABS_API_KEY` → 本番用キー（.env.exampleに未記載だが.envで使用）
    - `BEATOVEN_API_KEY` → 本番用キー（.env.exampleに未記載だが.envで使用）

- [ ] 🔴 **.env.example の更新** (P0 - ブロッカー)
  - `.env.example` と実際の `.env` に乖離がある。以下の変数が `.env.example` に不足:
    - `AI_API_KEY` / `AI_ENDPOINT`
    - `DEEPGRAM_API_KEY`
    - `BEATOVEN_API_KEY`
    - `ELEVENLABS_API_KEY`
    - `UPLOAD_DIR`
    - `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` / `NEXT_PUBLIC_POSTHOG_ENABLED`
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    - `STRIPE_PRO_PRICE_ID` / `STRIPE_BUSINESS_PRICE_ID`

- [ ] 🟡 **Turso本番データベースの準備** (P1 - 推奨)
  - 本番用Tursoデータベースの作成
  - マイグレーション適用手順の確認（`turso db shell` でSQL適用）
  - シードデータ（Planテーブル等）の本番投入

- [ ] 🟡 **AWS プロファイルの確認** (P1 - 推奨)
  - `sst.config.ts` で `profile: "sakuedit"` が設定されている → 本番デプロイ用AWSプロファイルが正しく設定されていることを確認

---

## 3. テンプレート・画像アセット

- [ ] 🟡 **デフォルトスタイル画像の追加** (P1 - 推奨)
  - Style モデルにプリセットスタイル（youtuber, minimal, bold等）のサムネイル画像がない
  - `/public` 配下にスタイルプレビュー画像を配置し、シードデータでプリセットスタイルを登録すること

- [ ] 🟡 **サムネイルテンプレートの設定** (P1 - 推奨)
  - `Thumbnail` モデルに `templateId` フィールドがあるが、テンプレートマスタデータが未確認
  - サムネイルテンプレートのプリセットを用意すること

- [ ] 🟡 **OGP画像の作成** (P1 - 推奨)
  - `/public` に OGP画像 (`og-image.png` 等) が存在しない
  - LP用、料金ページ用の OGP画像を1200x630pxで作成すること

- [ ] 🔵 **ファビコンの確認** (P2 - あると良い)
  - メインアプリ (`/app`) にファビコンが `favicon.ico` のみ。Apple Touch Icon や各種サイズのPNG、`manifest.json` が未設定
  - 現在のファビコンがSakuEditブランドに合っているか確認

---

## 4. SEO / OGP

- [ ] 🟡 **OGPメタタグの設定** (P1 - 推奨)
  - `app/layout.tsx` の `metadata` に `title` と `description` はあるが、以下が未設定:
    - `openGraph` (title, description, images, url, siteName, type)
    - `twitter` (card, title, description, images)
    - `metadataBase` (URL解決のベースURL)

- [ ] 🟡 **robots.txt の作成** (P1 - 推奨)
  - `app/robots.ts` が存在しない。検索エンジンへの適切なクロール指示が必要
  - `/api/*`, `/auth/*`, `/edit/*`, `/processing/*` 等はDisallowに設定すること

- [ ] 🟡 **sitemap.xml の作成** (P1 - 推奨)
  - `app/sitemap.ts` が存在しない
  - LP、料金ページ、利用規約、プライバシーポリシー、特商法ページを含むサイトマップを生成すること

- [ ] 🔵 **構造化データ（JSON-LD）の追加** (P2 - あると良い)
  - SaaSサービスとしての構造化データ（Organization, WebApplication, FAQ等）を追加するとSEO改善に有効

---

## 5. エラーハンドリング

- [ ] 🔴 **global-error.tsx の追加** (P0 - ブロッカー)
  - メインアプリ (`/app`) に `global-error.tsx` が存在しない（エディタ例 `/docs/editor-example` にのみ存在）
  - 本番でキャッチされないエラーが発生した際の表示が未定義

- [ ] 🔴 **not-found.tsx（404ページ）の追加** (P0 - ブロッカー)
  - `app/not-found.tsx` が存在しない
  - ユーザーが存在しないURLにアクセスした際のカスタム404ページを作成すること

- [ ] 🟡 **エラーバウンダリの配置** (P1 - 推奨)
  - 各重要ルート（`/edit`, `/projects`, `/home` 等）に `error.tsx` を配置し、部分的なエラーリカバリーを実現すること

---

## 6. 決済 (Stripe)

- [ ] 🔴 **Stripe本番モードへの切り替え** (P0 - ブロッカー)
  - 現在テストキー (`pk_test_*`, `sk_test_*`) がデフォルト設定
  - 本番用StripeキーをSST Secretで設定: `sst secret set StripePublishableKey pk_live_...`
  - StripeダッシュボードでWebhookエンドポイントが本番URLに設定されていることを確認

- [ ] 🔴 **決済フローのE2Eテスト** (P0 - ブロッカー)
  - Stripe Checkoutフロー（`/api/billing/checkout`）が正常に動作するか確認
  - Webhook処理（`checkout.session.completed`, `customer.subscription.*`）が正常にDB更新するか確認
  - 解約フローの動作確認

- [ ] 🟡 **Stripeカスタマーポータルの設定** (P1 - 推奨)
  - ユーザーがサブスクリプション管理（カード変更、解約等）をセルフサービスで行えるPortalの設定
  - Stripeダッシュボードでカスタマーポータルを有効化し、アプリからリダイレクトするAPI作成

- [ ] 🟡 **Stripe Webhook URLの本番設定** (P1 - 推奨)
  - `sst.config.ts` の `STRIPE_WEBHOOK_URL` 環境変数を本番URL（例: `https://sakuedit.com/api/stripe/webhook`）に設定

---

## 7. パフォーマンス

- [ ] 🟡 **画像最適化** (P1 - 推奨)
  - LP上のスクリーンショット画像 (`edit-screen-mockup.png`, `man.png`) のWebP/AVIF変換
  - `next/image` コンポーネントの使用確認

- [ ] 🟡 **Google Fontsの最適化** (P1 - 推奨)
  - `layout.tsx` で Material Symbols Outlined を外部CDNから読み込んでいる（render blocking）
  - `next/font` での最適化、または必要なアイコンのみのサブセット読み込みを検討

- [ ] 🟡 **バンドルサイズの確認** (P1 - 推奨)
  - `@remotion/*` パッケージが大量にdependenciesに含まれている（434系列で30+パッケージ）
  - エディタページ以外で不要なRemotionコードがバンドルされていないか確認
  - `next build` でバンドル分析を実施

- [ ] 🔵 **キャッシュ戦略の設定** (P2 - あると良い)
  - 静的アセット、API応答のキャッシュヘッダー設定
  - S3バケットのCloudFrontキャッシュ設定

---

## 8. デプロイ / インフラ

- [ ] 🔴 **本番ドメインの設定** (P0 - ブロッカー)
  - `sst.config.ts` の `sst.aws.Nextjs` にカスタムドメイン設定がない
  - Route53またはCloudflareでドメインを設定し、SSTの `domain` プロパティに追加
  - SSL証明書の自動プロビジョニング確認

- [ ] 🔴 **SSTの本番ステージ作成** (P0 - ブロッカー)
  - `sst deploy --stage production` で本番ステージをデプロイ
  - `removal: "retain"` と `protect: true` が production ステージで有効になることを確認済み

- [ ] 🟡 **VideoProcessor Lambdaの設定確認** (P1 - 推奨)
  - Lambda Layer（ffmpeg/whisper/yt-dlp）が本番環境で正しくデプロイされるか確認
  - メモリ3008MB、タイムアウト15分の設定が適切か確認
  - エフェメラルストレージ2048MBが動画処理に十分か確認

- [ ] 🟡 **S3バケットのアクセス制御** (P1 - 推奨)
  - `VideoBucket` のアクセス制御確認（パブリック公開されていないこと）
  - Presigned URLの有効期限設定の確認

- [ ] 🟡 **本番DBバックアップ** (P1 - 推奨)
  - Turso本番DBの自動バックアップ設定
  - マイグレーションロールバック手順の策定

- [ ] 🔵 **CloudWatch アラームの設定** (P2 - あると良い)
  - Lambda エラー率、API レスポンスタイム等のアラーム設定
  - S3 ストレージ使用量の監視

---

## 9. アナリティクス

- [ ] 🟡 **PostHogの本番設定** (P1 - 推奨)
  - PostHogプロバイダーは実装済み（`posthog-provider.tsx`）だが、以下の環境変数を本番で設定する必要あり:
    - `NEXT_PUBLIC_POSTHOG_ENABLED=true`
    - `NEXT_PUBLIC_POSTHOG_KEY=phc_xxxx`
    - `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`（または自社プロキシ）
  - PostHogプロバイダーがメインアプリのlayoutで使われているか確認（現在はエディタコンポーネント内のみ）

- [ ] 🟡 **コンバージョントラッキングの設定** (P1 - 推奨)
  - サインアップ、有料プラン契約、動画処理完了等のキーイベントトラッキング
  - Stripe Checkout完了時のコンバージョンイベント発火

- [ ] 🔵 **Google Analytics / Search Consoleの設定** (P2 - あると良い)
  - GA4の導入検討（PostHogと併用またはどちらか一方に統一）
  - Google Search Console にサイトを登録

---

## 10. 法的ページ

- [x] **利用規約** - `/terms` ページ作成済み（13条構成、最終更新: 2026年3月12日）
- [x] **プライバシーポリシー** - `/privacy` ページ作成済み（9セクション構成）
- [x] **特定商取引法に基づく表記** - `/commercial-transactions` ページ作成済み

- [ ] 🟡 **法的ページの最終レビュー** (P1 - 推奨)
  - 弁護士または法務専門家による利用規約・プライバシーポリシーの最終チェック
  - 特に AI出力の免責（第7条）、データ取扱い（第8条）の記載が最新の法令に適合しているか
  - GDPR対応が必要な場合の追加検討

- [ ] 🟡 **Cookie同意バナーの実装** (P1 - 推奨)
  - プライバシーポリシーでCookie利用に言及しているが、Cookie同意バナーが未実装
  - PostHog等のトラッキングを行う場合、初回訪問時の同意取得が必要

---

## 11. テスト

- [ ] 🔴 **E2Eテストの実行・修正** (P0 - ブロッカー)
  - Playwright E2Eテストが設定済み（`playwright.config.ts`）だが、全テストがパスするか確認
  - 主要フロー（サインアップ → 動画アップロード → 処理 → エクスポート）のE2Eテストが網羅されているか

- [ ] 🟡 **クロスブラウザテスト** (P1 - 推奨)
  - Chrome, Safari, Firefox, Edgeでの動作確認
  - 特にRemotionプレーヤーのブラウザ互換性

- [ ] 🟡 **モバイル表示テスト** (P1 - 推奨)
  - LPのレスポンシブ表示確認
  - エディタのモバイル警告表示（`SHOW_MOBILE_WARNING = true`）が適切に動作するか

---

## 12. その他

- [ ] 🟡 **BETTER_AUTH_URL の本番設定** (P1 - 推奨)
  - 現在 `http://localhost:3000` → 本番では `https://your-domain.com` に変更必須

- [ ] 🟡 **ロゴ・ブランドアセットの整備** (P1 - 推奨)
  - 現在ロゴは CSS+テキスト（`S` の文字をprimary色の角丸ボックスに配置）で実装
  - 正式なロゴ画像（SVG/PNG）をデザインし、`/public` に配置
  - favicon をブランドロゴに差し替え
  - 料金ページヘッダーで絵文字（🎬）をロゴ代わりに使用 → 正式ロゴに差し替え

- [ ] 🟡 **リリースノート・変更ログの準備** (P1 - 推奨)
  - 初期リリースバージョンのタグ付け（`v1.0.0`）

- [ ] 🔵 **ヘルプ・サポートページの作成** (P2 - あると良い)
  - FAQ、使い方ガイド、お問い合わせフォームへのリンク
  - `LEGAL_ENTITY.contactUrl` が `https://lanespire.com/#contact` に設定されているが、SakuEdit専用の問い合わせ先を検討

- [ ] 🔵 **SNSアカウントの確認** (P2 - あると良い)
  - `lib/constants.ts` に `TWITTER_URL` と `DISCORD_URL` が設定済みだが、実際のアカウントが作成・運用されているか確認
  - フッターにSNSリンクを追加する場合のUI対応

---

## 優先度サマリー

### P0 ブロッカー（リリース不可）
1. APIキー・シークレットの漏洩確認・本番用シークレット設定
2. Next.js middleware（認証ガード）の追加
3. Stripe本番モード切替・決済フローテスト
4. global-error.tsx / not-found.tsx の追加
5. 本番ドメイン・SSL設定
6. SSTの本番ステージデプロイ
7. E2Eテストのパス確認
8. .env.example の更新

### P1 推奨（リリース前に対応したい）
1. セキュリティヘッダー（CSP）の設定
2. OGP画像・メタタグの設定
3. robots.txt / sitemap.xml の作成
4. PostHog本番設定
5. 法的ページの最終レビュー
6. Cookie同意バナー
7. ロゴ・ブランドアセット整備
8. Turso本番DB準備・バックアップ設定
9. バンドルサイズ・パフォーマンス確認
10. Stripeカスタマーポータル設定

### P2 あると良い
1. 構造化データ（JSON-LD）
2. CloudWatchアラーム
3. GA4 / Search Console
4. ヘルプ・サポートページ
5. SNSアカウント運用確認
