# Elastic Cloud

> Source: https://www.pulumi.com/registry/packages/ec/
> Package: `@pulumi/ec`
> SST Install: `sst add @pulumi/ec`

## Overview

Elastic Cloud プロバイダーは、Elastic Cloud 上のリソースを Infrastructure as Code で構成・管理できます。Elastic Hosted Deployments や Elastic Serverless Projects を Elastic Cloud API を通じてプロビジョニングできます。Elastic Cloud Hosted、Serverless、Enterprise、GovCloud 環境をサポートしています。

## Configuration

### 環境変数

```bash
export EC_API_KEY=<your_api_key>
```

### Pulumi Config

```bash
pulumi config set ec:apikey --secret <your_api_key>
```

### 認証方法

1. **API キー**（推奨: ESS および ECE 向け）
2. **ユーザー名/パスワード**（ECE のみ）
   - `EC_USERNAME` / `EC_USER` と `EC_PASSWORD` / `EC_PASS`

### 主な設定項目

- `endpoint`: Elastic Cloud API エンドポイント
- `timeout`: リクエストタイムアウト（デフォルト: `1m`）
- `insecure`: TLS 検証の無効化
- `verbose`: 詳細ログ出力

## Key Resources

- **Deployment** - Elasticsearch デプロイメントの作成・管理
- **DeploymentElasticsearch** - Elasticsearch リソース構成
- **DeploymentKibana** - Kibana リソース構成
- **DeploymentApm** - APM リソース構成
- **ElasticsearchProject** - Serverless Elasticsearch プロジェクト
- **ObservabilityProject** - Observability プロジェクト
- **SecurityProject** - Security プロジェクト

## Example

```typescript
import * as ec from "@pulumi/ec";

const latest = ec.getStackOutput({
  versionRegex: "latest",
  region: "us-east-1",
});

const deployment = new ec.Deployment("my-deployment", {
  region: "us-east-1",
  version: latest.then(s => s.version),
  deploymentTemplateId: "aws-io-optimized-v2",
  elasticsearch: {
    hot: {
      autoscaling: {},
    },
  },
  kibana: {},
});
```
