# Upstash

> Source: https://www.pulumi.com/registry/packages/upstash
> Package: `@upstash/pulumi`
> SST Install: `sst add @upstash/pulumi`

## Overview

Upstash プロバイダーは、Upstash のクラウドリソースを Infrastructure as Code でプロビジョニングできます。Upstash Redis、QStash、Vector サービスを管理できます。Upstash はサーバーレスの Redis、Kafka、QStash を提供するプラットフォームです。

## Configuration

### 環境変数

```bash
export UPSTASH_EMAIL=<your_email>
export UPSTASH_API_KEY=<your_api_key>
```

### Pulumi Config

```bash
pulumi config set upstash:email <your_email>
pulumi config set upstash:apiKey --secret <your_api_key>
```

API キーは [Upstash コンソール](https://console.upstash.com/account/api) から取得できます。

### 主な設定項目

| オプション | 必須 | 説明 |
|-----------|------|------|
| `email` | Yes | Upstash アカウントのメールアドレス |
| `apiKey` | Yes | Upstash API キー |

## Key Resources

- **RedisDatabase** - Redis データベースの作成・管理
- **QStashSchedule** - QStash スケジュール
- **QStashTopic** - QStash トピック
- **VectorIndex** - ベクターインデックス
- **KafkaCluster** - Kafka クラスター
- **KafkaTopic** - Kafka トピック

## Example

```typescript
import * as upstash from "@upstash/pulumi";

const createdDb = new upstash.RedisDatabase("mydb", {
  databaseName: "pulumi-ts-db",
  region: "global",
  primaryRegion: "us-east-1",
  tls: true,
  multizone: true,
});
```
