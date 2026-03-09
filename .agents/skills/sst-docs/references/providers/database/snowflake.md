# Snowflake

> Source: https://www.pulumi.com/registry/packages/snowflake
> Package: `@pulumi/snowflake`
> SST Install: `sst add @pulumi/snowflake`

## Overview

Snowflake プロバイダーは、Snowflake アカウントのリソースを Infrastructure as Code で管理できます。データベース、スキーマ、ウェアハウス、ユーザー、アクセス制御などを構成できます。

## Configuration

3つの構成方法（優先度順）:

1. **Pulumi 構成ファイル**（最高優先度）
2. **環境変数**（推奨: 機密値向け）
3. **TOML 構成ファイル** `~/.snowflake/config`（最低優先度）

### 環境変数

```bash
export SNOWFLAKE_USER=<username>
export SNOWFLAKE_PASSWORD=<password>
export SNOWFLAKE_ACCOUNT_NAME=<account_name>
export SNOWFLAKE_ORGANIZATION_NAME=<org_name>
```

### 主な設定項目

- `organizationName` (必須): 組織名
- `accountName` (必須): アカウント名
- `user` (必須): ユーザー名
- 認証方法: パスワード、PAT トークン、秘密鍵、OAuth、ブラウザベース認証

## Key Resources

### Stable リソース
- **Database** - データベース
- **Schema** - スキーマ
- **User** - ユーザー
- **Warehouse** - ウェアハウス
- **View** - ビュー
- **Task** - タスク
- **Tag** - タグ
- **NetworkPolicy** - ネットワークポリシー
- **MaskingPolicy** - マスキングポリシー
- **RowAccessPolicy** - 行アクセスポリシー
- **Grant** 関連リソース - 権限管理

### Preview リソース
- **Table**, **Stage**, **Pipe**, **Alert**, **ExternalTable**, **DynamicTable** など

## Example

```typescript
import * as snowflake from "@pulumi/snowflake";

const testDb = new snowflake.Database("test_db", {
  name: "TEST_DATABASE",
});

const testSchema = new snowflake.Schema("test_schema", {
  name: "TEST_SCHEMA",
  database: testDb.name,
});
```
