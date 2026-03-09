# Supabase

> Source: https://github.com/sst/pulumi-supabase
> Package: `@sst-provider/supabase`
> SST Install: `sst add @sst-provider/supabase`

## Overview

Supabase プロバイダーは、Supabase のリソースを Infrastructure as Code で管理できます。Terraform Supabase プロバイダーのブリッジ実装で、Supabase プロジェクト、データベース、認証設定などを構成できます。Supabase はオープンソースの Firebase 代替で、PostgreSQL データベース、認証、リアルタイムサブスクリプション、ストレージ、Edge Functions を提供します。

## Configuration

### 環境変数

```bash
export SUPABASE_ACCESS_TOKEN=<your_access_token>
```

### Pulumi Config

```bash
pulumi config set supabase:accessToken --secret <your_access_token>
```

Supabase アクセストークンは Supabase ダッシュボードの Account Settings > Access Tokens から生成できます。

## Key Resources

- **Project** - Supabase プロジェクトの作成・管理
- **Branch** - データベースブランチ（プレビュー環境）
- **Settings** - プロジェクト設定
- **Organization** - 組織管理

## Example

```typescript
import * as supabase from "@sst-provider/supabase";

const project = new supabase.Project("my-project", {
  name: "my-project",
  organizationId: "my-org-id",
  region: "us-east-1",
  databasePassword: "secure-password",
});
```
