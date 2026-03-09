# Neon

> Source: https://github.com/kislerdm/terraform-provider-neon
> Package: `neon`
> SST Install: `sst add neon` (Terraform ブリッジプロバイダー)

## Overview

Neon プロバイダーは、Neon Postgres プロジェクトのリソースを Infrastructure as Code で管理できます。Neon はブランチング、ストレージ分離、オートスケーリング、寛大な無料枠を備えたサーバーレス PostgreSQL データベースプラットフォームです。

## Configuration

### 環境変数

```bash
export NEON_API_KEY=<your_neon_api_key>
```

### Pulumi Config

```bash
pulumi config set neon:apiKey --secret <your_neon_api_key>
```

### インストール

Terraform ブリッジプロバイダーとして利用:

```bash
pulumi package add terraform-provider kislerdm/neon
```

### 主な設定項目

| オプション | 環境変数 | 必須 | 説明 |
|-----------|---------|------|------|
| `apiKey` | `NEON_API_KEY` | Yes | Neon API アクセスキー |

## Key Resources

- **Project** - Neon プロジェクトの作成・管理
- **Branch** - データベースブランチの管理
- **Endpoint** - コンピュートエンドポイント
- **Database** - データベース
- **Role** - データベースロール

## Example

```typescript
import * as neon from "@pulumi/neon";

const project = new neon.Project("my-project", {
  name: "my-project",
});

const branch = new neon.Branch("dev-branch", {
  projectId: project.id,
  name: "dev",
});

const database = new neon.Database("my-db", {
  projectId: project.id,
  branchId: branch.id,
  name: "mydb",
  ownerName: "neondb_owner",
});
```
