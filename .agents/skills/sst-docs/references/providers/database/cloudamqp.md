# CloudAMQP

> Source: https://www.pulumi.com/registry/packages/cloudamqp
> Package: `@pulumi/cloudamqp`
> SST Install: `sst add @pulumi/cloudamqp`

## Overview

CloudAMQP プロバイダーは、CloudAMQP 組織リソースとのインタラクションを Infrastructure as Code で管理できます。LavinMQ または RabbitMQ インスタンスの作成、構成、デプロイを異なるクラウドプラットフォームに対して行えます。

## Configuration

### 環境変数

```bash
export CLOUDAMQP_APIKEY=<your_api_key>
```

### Pulumi Config

```bash
pulumi config set cloudamqp:apikey --secret <your_api_key>
```

API キーは CloudAMQP アカウントの API Keys セクションから取得できます。

### 主な設定項目

| オプション | 環境変数 | 必須 | 説明 |
|-----------|---------|------|------|
| `apikey` | `CLOUDAMQP_APIKEY` | Yes | CloudAMQP Customer API キー |
| `enableFasterInstanceDestroy` | `CLOUDAMQP_ENABLE_FASTER_INSTANCE_DESTROY` | No | 高速破棄の有効化（デフォルト: false） |

## Key Resources

- **Instance** - CloudAMQP インスタンスの作成・管理
- **Notification** - 通知設定
- **Alarm** - アラーム設定
- **SecurityFirewall** - セキュリティファイアウォール
- **IntegrationMetric** - メトリクス統合
- **Plugin** - プラグイン管理
- **PluginCommunity** - コミュニティプラグイン

## Example

```typescript
import * as cloudamqp from "@pulumi/cloudamqp";

const instance = new cloudamqp.Instance("instance", {
  name: "pulumi-cloudamqp-instance",
  plan: "penguin-1",
  region: "amazon-web-services::us-west-1",
  tags: ["pulumi"],
});
```
