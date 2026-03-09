# PlanetScale

> Source: https://github.com/sst/pulumi-planetscale
> Package: `@sst-provider/planetscale`
> SST Install: `sst add @sst-provider/planetscale`

## Overview

PlanetScale プロバイダーは、PlanetScale のリソースを Infrastructure as Code で管理できます。PlanetScale はサーバーレス MySQL 互換データベースプラットフォームで、ブランチング、オンラインスキーママイグレーション、スケーラビリティを提供します。

## Configuration

### 環境変数

```bash
export PLANETSCALE_SERVICE_TOKEN=<your_service_token>
export PLANETSCALE_SERVICE_TOKEN_NAME=<your_token_name>
```

### Pulumi Config

```bash
pulumi config set planetscale:serviceToken --secret <your_service_token>
pulumi config set planetscale:serviceTokenName <your_token_name>
```

## Key Resources

- **Database** - PlanetScale データベースの作成・管理
- **Branch** - データベースブランチの管理
- **Password** - データベースパスワード・接続情報
- **Backup** - バックアップ管理

## Example

```typescript
import * as planetscale from "@sst-provider/planetscale";

const db = new planetscale.Database("my-db", {
  organization: "my-org",
  name: "my-database",
});

const branch = new planetscale.Branch("dev", {
  organization: "my-org",
  database: db.name,
  name: "dev",
  parentBranch: "main",
});

const password = new planetscale.Password("app-password", {
  organization: "my-org",
  database: db.name,
  branch: "main",
  name: "app-password",
});
```
