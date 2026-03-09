# Aiven

> Source: https://www.pulumi.com/registry/packages/aiven
> Package: `@pulumi/aiven`
> SST Install: `sst add @pulumi/aiven`

## Overview

Aiven プロバイダーは、Aiven の AI 対応オープンソースデータプラットフォームのリソースを Infrastructure as Code で管理できます。PostgreSQL、MySQL、Redis、Kafka、Elasticsearch、ClickHouse など、さまざまなデータサービスをプログラマティックにプロビジョニング・管理できます。

## Configuration

### 環境変数

```bash
export AIVEN_TOKEN=<your_token>
```

### Pulumi Config

```bash
pulumi config set aiven:apiToken --secret <your_token>
```

### その他の環境変数

- `PROVIDER_AIVEN_ENABLE_BETA` - ベータリソースの有効化
- `AIVEN_ALLOW_IP_FILTER_PURGE` - IP フィルター削除の許可

### 認証

- Aiven プラットフォームでパーソナルトークンを作成
- または、アプリケーションユーザートークンを使用

## Key Resources

- **Project** - Aiven プロジェクト
- **Pg** - PostgreSQL サービス
- **Mysql** - MySQL サービス
- **Redis** - Redis サービス
- **Kafka** - Apache Kafka サービス
- **Opensearch** - OpenSearch サービス
- **Clickhouse** - ClickHouse サービス
- **Grafana** - Grafana サービス
- **ServiceIntegration** - サービス間統合
- **KafkaTopic** - Kafka トピック
- **KafkaSchema** - Kafka スキーマ

## Example

```typescript
import * as aiven from "@pulumi/aiven";

const project = new aiven.Project("my-project", {
  project: "my-project",
});

const pg = new aiven.Pg("my-pg", {
  project: project.project,
  cloudName: "google-europe-west1",
  plan: "hobbyist",
  serviceName: "my-pg",
});
```
