# MSSQL (Microsoft SQL Server)

> Source: https://www.pulumi.com/registry/packages/mssql
> Package: `@pulumiverse/mssql`
> SST Install: `sst add @pulumiverse/mssql`

## Overview

MSSQL プロバイダーは、Microsoft SQL Server および Azure SQL インスタンス内のオブジェクトを Infrastructure as Code でプロビジョニング・構成できます。Pulumiverse コミュニティメンテナンスのパッケージです。

## Configuration

### 認証方法

#### SQL 認証

```typescript
const provider = new mssql.Provider("provider-mssql", {
  hostname: "my-server.database.windows.net",
  sqlAuth: {
    username: "sa",
    password: "YourPassword123",
  },
});
```

#### Azure Active Directory 認証

**Service Principal:**

```typescript
const provider = new mssql.Provider("provider-mssql", {
  hostname: server.fullyQualifiedDomainName,
  azureAuth: {
    clientId: "<client_id>",
    clientSecret: "<client_secret>",
    tenantId: "<tenant_id>",
  },
});
```

**Default Chained Credentials（環境変数）:**

```bash
export ARM_CLIENT_ID=<client_id>      # or AZURE_CLIENT_ID
export ARM_CLIENT_SECRET=<secret>      # or AZURE_CLIENT_SECRET
export ARM_TENANT_ID=<tenant_id>       # or AZURE_TENANT_ID
```

```typescript
const provider = new mssql.Provider("provider-mssql", {
  hostname: server.fullyQualifiedDomainName,
  azureAuth: {},  // 空のオブジェクトで環境変数を使用
});
```

### 主な設定項目

- `hostname` (必須): SQL Server のホスト名
- `port`: ポート番号（デフォルト: 1433）
- `sqlAuth`: SQL 認証設定
- `azureAuth`: Azure AD 認証設定

## Key Resources

- **SqlLogin** - SQL Server ログインの作成
- **SqlUser** - SQL ユーザーの作成
- **DatabaseRoleMember** - データベースロールメンバーシップ管理
- **Database** (データソース) - 既存データベースの参照
- **DatabaseRole** (データソース) - データベースロールの参照

## Example

```typescript
import * as mssql from "@pulumiverse/mssql";

const providerMssql = new mssql.Provider("provider-mssql", {
  hostname: server.fullyQualifiedDomainName,
  azureAuth: {},
});

const dbUser = new mssql.SqlLogin("db-user", {
  name: "example",
  password: "Str0ngPa$word12",
}, { provider: providerMssql });
```
