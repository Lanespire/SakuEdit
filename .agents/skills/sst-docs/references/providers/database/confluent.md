# Confluent Cloud

> Source: https://www.pulumi.com/registry/packages/confluentcloud/
> Package: `@pulumi/confluentcloud`
> SST Install: `sst add @pulumi/confluentcloud`

## Overview

Confluent Cloud プロバイダーは、Confluent Cloud インフラストラクチャのデプロイと管理を可能にします。Apache Kafka のデプロイを簡素化し、環境、クラスター、トピック、ACL、サービスアカウントなどを管理できます。

## Configuration

### 環境変数

```bash
export CONFLUENT_CLOUD_API_KEY=<your_api_key>
export CONFLUENT_CLOUD_API_SECRET=<your_api_secret>
```

### Pulumi Config

```bash
pulumi config set confluentcloud:cloudApiKey --secret <your_api_key>
pulumi config set confluentcloud:cloudApiSecret --secret <your_api_secret>
```

### 認証方法

1. **環境変数**: `CONFLUENT_CLOUD_API_KEY` と `CONFLUENT_CLOUD_API_SECRET`
2. **Static Credentials**: `Pulumi.yaml` で構成
3. **OAuth**: 外部 IdP（Okta、Azure Entra ID）を使用した OAuth 認証

## Key Resources

- **Environment** - 環境の管理
- **KafkaCluster** - Kafka クラスターの管理
- **KafkaTopic** - Kafka トピック
- **KafkaAcl** - Kafka ACL
- **ServiceAccount** - サービスアカウント
- **ApiKey** - API キー
- **SchemaRegistry** - スキーマレジストリ

## Example

```typescript
import * as confluentcloud from "@pulumi/confluentcloud";

const env = new confluentcloud.Environment("staging", {
  displayName: "staging",
});

const cluster = new confluentcloud.KafkaCluster("basic", {
  displayName: "basic-cluster",
  availability: "SINGLE_ZONE",
  cloud: "AWS",
  region: "us-east-2",
  environment: {
    id: env.id,
  },
  basic: {},
});
```
