# Astra DB (DataStax)

> Source: https://www.pulumi.com/registry/packages/astra
> Package: `@pulumiverse/astra`
> SST Install: `sst add @pulumiverse/astra`

## Overview

Astra DB プロバイダーは、DataStax Astra DB で利用可能なクラウドリソースを Infrastructure as Code でプロビジョニングできます。Astra DB は Apache Cassandra ベースのサーバーレスデータベースサービスで、AWS、Azure、GCP 上で利用できます。Pulumiverse コミュニティメンテナンスのパッケージです。

## Configuration

### Pulumi Config

```bash
pulumi config set astra:token --secret <your_astra_token>
```

Astra DB トークンは DataStax のアカウント管理インターフェースから生成できます。

### 主な設定項目

| オプション | 必須 | 説明 |
|-----------|------|------|
| `token` | Yes | Astra アクセストークン |

## Key Resources

- **Database** - Astra DB データベースの作成・管理
- **Keyspace** - キースペースの管理
- **Table** - テーブルの管理
- **Role** - ロールの管理
- **AccessList** - アクセスリスト
- **PrivateLink** - プライベートリンク

## Example

```typescript
import * as astra from "@pulumiverse/astra";

const db = new astra.Database("example", {
  cloudProvider: "azure",
  keyspace: "default",
  regions: ["westus2"],
  name: "example-db",
});
```
