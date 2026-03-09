# PostgreSQL

> Source: https://www.pulumi.com/registry/packages/postgresql
> Package: `@pulumi/postgresql`
> SST Install: `sst add @pulumi/postgresql`

## Overview

PostgreSQL プロバイダーは、PostgreSQL サーバー内のリソースのデプロイと構成を可能にします。データベース、スキーマ、ロール、権限など PostgreSQL オブジェクトを Infrastructure as Code で管理できます。

## Configuration

### 環境変数

```bash
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=postgres
```

### Pulumi Config

```bash
pulumi config set postgresql:host localhost
pulumi config set postgresql:port 5432
pulumi config set postgresql:username postgres
pulumi config set postgresql:password --secret postgres
```

### 主な設定項目

- `host` (必須): PostgreSQL サーバーのホスト名
- `port` (デフォルト: 5432): ポート番号
- `username` (必須): ユーザー名
- `password`: パスワード
- `database`: 接続先データベース
- `sslmode`: SSL モード (`disable`, `require`, `verify-ca`, `verify-full`)
- AWS RDS IAM 認証、GCP/Azure クラウド認証にも対応

## Key Resources

- **Database** - データベースの作成・管理
- **Schema** - スキーマの作成・管理
- **Role** - ロール（ユーザー）の作成・管理
- **Grant** - 権限の付与
- **Extension** - PostgreSQL 拡張機能の管理
- **DefaultPrivileges** - デフォルト権限の設定

## Example

```typescript
import * as postgresql from "@pulumi/postgresql";

const myDb = new postgresql.Database("my_db", {
  name: "my_db",
});

const myRole = new postgresql.Role("app_user", {
  name: "app_user",
  login: true,
  password: "secret",
});

const grant = new postgresql.Grant("app_grant", {
  database: myDb.name,
  role: myRole.name,
  objectType: "database",
  privileges: ["CONNECT", "CREATE"],
});
```
