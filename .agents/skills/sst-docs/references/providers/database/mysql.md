# MySQL

> Source: https://www.pulumi.com/registry/packages/mysql
> Package: `@pulumi/mysql`
> SST Install: `sst add @pulumi/mysql`

## Overview

MySQL プロバイダーは、MySQL サーバーのリソース構成を Infrastructure as Code で管理できます。AWS RDS を含む任意の場所でホストされた MySQL データベースに対応しています。

## Configuration

### Pulumi Config

```bash
pulumi config set mysql:endpoint "localhost:3306"
pulumi config set mysql:username root
pulumi config set mysql:password --secret secret
```

### 主な設定項目

- `endpoint` (必須): MySQL サーバーアドレス（`hostname:port` または Unix ソケットパス）
- `username` (必須): 認証ユーザー名
- `password`: パスワード（サーバーが要求しない場合はオプション）
- `tls`: TLS 設定（`true`, `false`, `skip-verify`）
- `proxy`: SOCKS5 プロキシ URL
- `maxOpenConns`: 最大オープン接続数
- `maxConnLifetimeSec`: 接続の最大ライフタイム（秒）
- `authenticationPlugin`: 認証プラグイン

## Key Resources

- **Database** - データベースの作成・管理
- **User** - ユーザーの作成・管理
- **Grant** - 権限の付与
- **Role** - ロールの管理

## Example

```typescript
import * as mysql from "@pulumi/mysql";

const app = new mysql.Database("app", {
  name: "my_awesome_app",
});
```
