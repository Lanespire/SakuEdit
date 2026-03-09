# InfluxDB

> Source: https://www.pulumi.com/registry/packages/influxdb
> Package: `@komminarlabs/influxdb`
> SST Install: `sst add @komminarlabs/influxdb`

## Overview

InfluxDB プロバイダーは、InfluxDB で利用可能なリソースを Infrastructure as Code でプロビジョニングできます。Cloud Serverless (v3)、Cloud TSM (v2)、InfluxDB OSS など複数のフレーバーをサポートしています。

## Configuration

### 環境変数

```bash
export INFLUXDB_TOKEN=<your_token>
export INFLUXDB_URL=<your_influxdb_url>
```

### Pulumi Config

```bash
pulumi config set influxdb:token --secret <your_token>
pulumi config set influxdb:url <your_influxdb_url>
```

### 主な設定項目

| オプション | 環境変数 | 必須 | 説明 |
|-----------|---------|------|------|
| `token` | `INFLUXDB_TOKEN` | Yes | InfluxDB 認証トークン |
| `url` | `INFLUXDB_URL` | Yes | InfluxDB サーバー URL |

## Key Resources

- **Bucket** - 時系列データストレージバケット
- **Organization** - 組織の管理
- **Authorization** - 認証トークンの管理

## Example

```typescript
import * as influxdb from "@komminarlabs/influxdb";

export const orgId = influxdb.getOrganizationOutput({ name: "IoT" }).id;

export const bucket = new influxdb.Bucket("signals", {
  orgId: orgId,
  name: "signals",
  description: "This is a bucket to store signals",
  retentionPeriod: 604800,
});

export const bucketId = bucket.id;
```
