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
│  VideoProcessor (Lambda)                            │
│  - FFmpeg Layer                                      │
│  - yt-dlp (bundled)                                   │
│  - Max 15 min timeout                                │
├─────────────────────────────────────────────────────┤
│  S3 Bucket (VideoBucket)                            │
│  - Source videos                                      │
│  - Processed videos                                   │
│  - Thumbnails                                         │
├─────────────────────────────────────────────────────┤
│  Neon PostgreSQL (External)                         │
│  - Prisma ORM                                         │
│  - Better Auth                                        │
└─────────────────────────────────────────────────────┘
```

## 無料枠内訳 (AWS 12ヶ月 + Neon永続無料)

| サービス | 無料枠 | 想定利用 |
|---------|--------|-----------|
| Lambda | 100万リクエスト/月 + 400,000 GB-秒 | 動画処理月数十本 |
| S3 | 5GB | 動画約10-20本（処理後削除） |
| CloudFront | 50GB転送/月 | 小〜中規模で十分 |
| Neon | 0.5GB + 100時間 | 開発〜小規模で十分 |

---

## セットアップ手順

### 1. Neon PostgreSQL セットアップ

1. [Neon Console](https://console.neon.tech/) でアカウント作成

2. 新しいプロジェクトを作成:
   - Project名: `sakuedit`
   - Region: `US East (Ohio)` (AWSと同じリージョン)

3. 接続文字列を取得:
   ```
   postgresql://[user]:[password]@[endpoint].neon.tech/[database]?sslmode=require
   ```

4. SSTにシークレットとして設定:
   ```bash
   # 開発環境
   sst secrets set DatabaseUrlDev "postgresql://..."

   # 本番環境
   sst secrets set --stage production DatabaseUrl "postgresql://..."
   ```

### 2. 環境変数の設定

```bash
# Better Auth用シークレット
sst secrets set NextAuthSecretDev "your-secret-key-dev"
sst secrets set --stage production NextAuthSecret "your-production-secret"

# Groq API (ASR用)
sst secrets set GroqApiKeyDev "gsk_xxx..."
sst secrets set --stage production GroqApiKey "gsk_xxx..."
```

### 3. Prisma スキーマの修正

PrismaスキーマのSQLiteをPostgreSQLに変更が必要:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. デプロイ実行

```bash
# 開発環境にデプロイ
npx sst deploy --stage dev

# 本番環境にデプロイ
npx sst deploy --stage production
```

### 5. データベースマイグレーション

```bash
# マイグレーションファイルを生成
npx prisma migrate deploy

# 本番環境で実行
npx prisma migrate deploy --schema=prisma/schema.prisma
```

---

## ローカル開発

```bash
# SST dev mode で開発
npx sst dev

# または通常のNext.js dev server
npm run dev
```

---

## 注意事項

### 動画処理の制約

- Lambda のタイムアウトは最大15分
- 長時間動画は処理が中断される可能性
- 大きなファイルは S3 にアップロードしてから処理

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

- Neon コンソールで接続状態を確認
- SSL mode=require が設定されているか
- 接続文字列が正しいか

---

## 本番環境への移行チェックリスト

- [ ] Neon プロジェクト作成
- [ ] シークレット設定
- [ ] `sst deploy --stage production`
- [ ] データベースマイグレーション
- [ ] 動作確認
- [ ] ドメイン設定 (オプション)
- [ ] モニタリング設定
