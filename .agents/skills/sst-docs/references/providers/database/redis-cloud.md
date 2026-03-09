# Redis Cloud

> Source: https://www.pulumi.com/registry/packages/rediscloud
> Package: `@rediscloud/pulumi-rediscloud`
> SST Install: `sst add @rediscloud/pulumi-rediscloud`

## Overview

Redis Cloud プロバイダーは、Redis Enterprise Cloud のリソースを Infrastructure as Code で管理できます。サブスクリプション、データベース、ネットワーキングなどを構成できます。Flexible または Annual サブスクリプションでのみ動作し、Fixed/Free サブスクリプションには対応していません。

## Configuration

### 環境変数

```bash
export REDISCLOUD_ACCESS_KEY=<your_key>
export REDISCLOUD_SECRET_KEY=<your_secret>
```

### Pulumi Config

```bash
pulumi config set rediscloud:apiKey --secret <your_key>
pulumi config set rediscloud:secretKey --secret <your_secret>
```

### 主な設定項目

| オプション | 環境変数 | 必須 | 説明 |
|-----------|---------|------|------|
| `apiKey` | `REDISCLOUD_ACCESS_KEY` | Yes | Redis Cloud アクセスキー |
| `secretKey` | `REDISCLOUD_SECRET_KEY` | Yes | Redis Cloud シークレットキー |

## Key Resources

- **Subscription** - Redis Cloud サブスクリプションの作成・管理
- **SubscriptionDatabase** - サブスクリプション内のデータベース構成
- **SubscriptionPeering** - VPC ピアリング
- **CloudAccount** - クラウドアカウント管理

## Example

```typescript
import * as rediscloud from "@rediscloud/pulumi-rediscloud";

const subscription = new rediscloud.Subscription("example", {
  name: "my-subscription",
  cloudProvider: [{
    regions: [{
      region: "us-east-1",
      multipleAvailabilityZones: false,
      networkingDeploymentCidr: "10.0.0.0/24",
    }],
  }],
  creationPlan: [{
    memoryLimitInGb: 1,
    quantity: 1,
    replication: false,
    modules: ["RedisJSON"],
  }],
});

const db = new rediscloud.SubscriptionDatabase("example-db", {
  subscriptionId: subscription.id,
  name: "my-db",
  memoryLimitInGb: 1,
  dataPersistence: "aof-every-1-second",
  replication: false,
});
```
