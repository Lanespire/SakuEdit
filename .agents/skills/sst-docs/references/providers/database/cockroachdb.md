# CockroachDB

> Source: https://www.pulumi.com/registry/packages/cockroach/
> Package: `@pulumiverse/cockroach`
> SST Install: `sst add @pulumiverse/cockroach`

## Overview

CockroachDB Cloud プロバイダーは、CockroachDB Cloud またはセルフホスト CockroachDB インスタンスで利用可能なクラウドリソースのプロビジョニングを Infrastructure as Code で管理できます。コミュニティメンテナンスのパッケージです（Pulumiverse）。

## Configuration

### 環境変数

```bash
export COCKROACH_API_KEY=<your_api_key>
```

### Pulumi Config

```bash
pulumi config set cockroach:apiKey --secret <your_api_key>
```

## Key Resources

- **Cluster** - CockroachDB クラスターのプロビジョニング
- **Database** - データベースの管理
- **SqlUser** - SQL ユーザーの管理
- **AllowList** - IP アクセスリスト
- **MetricExportDatadogConfig** - メトリクスエクスポート設定

## Example

```typescript
import * as cockroach from "@pulumiverse/cockroach";

const cluster = new cockroach.Cluster("example", {
  cloudProvider: "AWS",
  name: "cockroach-provider-ts",
  regions: [{ name: "us-west-2" }],
  serverless: { spendLimit: 0 },
});
```
