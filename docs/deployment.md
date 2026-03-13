# SakuEdit デプロイガイド

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                   CloudFront                         │
├─────────────────────────────────────────────────────┤
│  Next.js (Lambda + S3)                              │
│  - App Router                                       │
│  - API Routes                                        │
│  - Server Actions                                    │
├─────────────────────────────────────────────────────┤
│  VideoProcessor (Lambda / SST live function)        │
│  - FFmpeg + whisper-cpp worker                      │
│  - Function URL async invoke                        │
│  - Max 15 min timeout                               │
├─────────────────────────────────────────────────────┤
│  S3 Bucket (VideoBucket)                            │
│  - Source videos                                      │
│  - Processed videos                                   │
│  - Thumbnails                                         │
├─────────────────────────────────────────────────────┤
│  Turso / libSQL                                     │
│  - Prisma runtime adapter                           │
│  - Better Auth                                      │
└─────────────────────────────────────────────────────┘
```

## 無料構成

| サービス | 無料枠 | 想定利用 |
|---------|--------|-----------|
| Lambda | 100万リクエスト/月 + 400,000 GB-秒 | 動画処理月数十本 |
| S3 | 5GB | 動画約10-20本（処理後削除） |
| CloudFront | 50GB転送/月 | 小〜中規模で十分 |
| Turso | Starter / Free | 開発〜小規模で十分 |

---

## セットアップ手順

### 1. Turso セットアップ

1. Turso で `sakuedit` 用 DB を作成
2. `libsql://...` URL と auth token を取得
3. `.env` に設定

### 2. 環境変数の設定

```bash
# Better Auth用シークレット
sst secrets set NextAuthSecretDev "your-secret-key-dev"
sst secrets set --stage production NextAuthSecret "your-production-secret"

# OpenRouter API
sst secrets set OpenRouterApiKeyDev "sk-or-v1-xxx..."
sst secrets set --stage production OpenRouterApiKey "sk-or-v1-xxx..."

# Stripe Sandbox
sst secret set StripePublishableKey "pk_test_xxx"
sst secret set StripeSecretKey "sk_test_xxx"
sst secret set StripeWebhookSecret "whsec_xxx"
```

### 3. Prisma / Turso 設定

現在は Prisma schema の provider は `sqlite` のまま維持し、runtime では
`@prisma/adapter-libsql` を使って Turso / libSQL に接続します。

`.env` には以下を設定します。

```env
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your_turso_auth_token"
TURSO_DATABASE_NAME="your-database"
```

アプリ runtime はローカルでも本番でも Turso を使います。  
`DATABASE_URL=file:...` は Prisma CLI の sqlite schema 検証用です。

```env
DATABASE_URL="file:./dev.db"
```

### 4. デプロイ実行

```bash
# ローカル開発
npx sst dev --stage dev

# デプロイ
npx sst deploy --stage dev
npx sst deploy --stage production
```

### 5. データベース反映

```bash
# Prisma Client 再生成
npx prisma generate

# Prisma Migrate はローカル SQLite に対して実行
npx prisma migrate dev --name <migration-name>

# 生成された migration.sql を Turso CLI で適用
export MIGRATION_SQL_PATH="prisma/migrations/<timestamp>_<migration-name>/migration.sql"
npm run db:migrate:apply
```

`npm run db:migrate:apply` は公式手順の `turso db shell "$TURSO_DATABASE_NAME" < "$MIGRATION_SQL_PATH"` を薄く包んだものです。  
`_prisma_migrations` を独自更新するカスタムスクリプトは使いません。

---

## ローカル開発

```bash
brew install cmake ffmpeg
```

`whisper-cpp` は `cmake` が無いと build できません。`sst dev` の worker でも同じ前提です。

`VideoProcessor` は prebuilt runtime 前提です。`sst dev` ではローカル固定パス、`sst deploy` では Lambda Layer か container image で runtime を供給します。

```env
# 任意: layer や独自 runtime を使う場合
PROCESSING_RUNTIME_ROOT=/opt
WHISPER_ROOT=/opt/whisper
WHISPER_MODEL=base
WHISPER_MODEL_PATH=/opt/whisper/models/ggml-base.bin

# 任意: deploy 時に Lambda Layer ARN を付与する場合
VIDEO_PROCESSOR_LAYER_ARNS=arn:aws:lambda:ap-northeast-1:123456789012:layer:sakuedit-runtime:1
```

```bash
# SST dev mode で開発
npx sst dev --stage dev
```

### Stripe Sandbox をSSTで使う

`sst.config.ts` で `pulumi-stripe` provider を使って Pro / Business の Product と Price を作成します。ローカルでは以下の流れです。

```bash
# 1. Stripe test key を SST Secret に保存
sst secret set StripePublishableKey "pk_test_xxx"
sst secret set StripeSecretKey "sk_test_xxx"

# 2. Webhook secret は stripe listen で表示された値を保存
stripe listen --forward-to localhost:3000/api/stripe/webhook
sst secret set StripeWebhookSecret "whsec_xxx"

# 3. SST dev を起動
npx sst dev

# 4. Checkout / Webhook の動作確認
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

注意:

- `payment_intent.succeeded` だけではサブスク同期は完了しません。`checkout.session.completed` と `customer.subscription.updated` を使ってください。
- ローカル webhook 転送先は `localhost:3000/api/stripe/webhook` です。
- デプロイ環境で Stripe 側に webhook endpoint を自動作成したい場合は、`STRIPE_WEBHOOK_URL` を設定して `sst deploy` します。

---

## 注意事項

### 動画処理の制約

- Lambda のタイムアウトは最大15分
- 長時間動画は処理が中断される可能性
- 大きなファイルは S3 にアップロードしてから処理
- `VideoProcessor` は起動時に `ffmpeg` `ffprobe` `Remotion CLI` `whisper` を self-check する

### ファイルサイズ制限

- アップロード: 500MB (Next.js API Route)
- Lambda一時ストレージ: 10GB最大

### コスト最適化

- 処理済み動画は S3 から削除
- 古いバージョンは定期的にクリーンアップ
- CloudFront キャッシュを活用

---

## トラブルシューティング

### Lambda タイムアウト

```bash
# CloudWatch Logs を確認
aws logs tail /aws/lambda/sakuedit-VideoProcessor

# SST Console でログ確認
# https://console.sst.dev
```

### S3 アクセスエラー

- IAMロールの確認
- バケットポリシーの確認
- Resource linkingが正しく設定されているか

### データベース接続エラー

- Turso の URL / auth token を確認
- runtime は `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- Prisma CLI は `DATABASE_URL=file:...` も必要

---

## 本番環境への移行チェックリスト

- [ ] Turso DB 作成
- [ ] シークレット設定
- [ ] `sst deploy --stage production`
- [ ] データベースマイグレーション
- [ ] 動作確認
- [ ] ドメイン設定 (オプション)
- [ ] モニタリング設定
