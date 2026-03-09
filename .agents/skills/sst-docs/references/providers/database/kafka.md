# Apache Kafka

> Source: https://www.pulumi.com/registry/packages/kafka
> Package: `@pulumi/kafka`
> SST Install: `sst add @pulumi/kafka`

## Overview

Kafka プロバイダーは、Apache Kafka クラスターとのインタラクションを Infrastructure as Code で管理できます。トピック、アクセス制御リスト（ACL）、クォータ、SCRAM 認証情報のプロビジョニングが可能です。TLS、SASL（plain、scram-sha256、scram-sha512）、AWS IAM、OAuth など複数の認証方式をサポートしています。

## Configuration

### Pulumi Config

```bash
pulumi config set kafka:bootstrapServers '["broker1:9092","broker2:9092"]'
```

### 主な設定項目

- `bootstrapServers` (必須): ブローカーアドレスのリスト
- `tlsEnabled`: TLS 暗号化の有効化
- `caCert` / `clientCert` / `clientKey`: TLS 証明書パス
- `saslMechanism`: SASL 認証方式（`plain`, `scram-sha256`, `scram-sha512`, `aws-iam`, `oauthbearer`）
- `saslUsername` / `saslPassword`: SASL 認証情報
- `saslAwsRegion` / `saslAwsRoleArn`: AWS MSK IAM 認証
- `skipTlsVerify`: TLS 検証スキップ（開発環境用）
- `timeout`: 接続タイムアウト

## Key Resources

- **Topic** - Kafka トピックの作成・管理
- **Acl** - アクセス制御リスト
- **Quota** - クォータ設定
- **UserScramCredential** - SCRAM 認証情報

## Example

```typescript
import * as kafka from "@pulumi/kafka";

const topic = new kafka.Topic("my-topic", {
  name: "my-topic",
  partitions: 3,
  replicationFactor: 1,
  config: {
    "retention.ms": "86400000",
    "cleanup.policy": "delete",
  },
});
```
