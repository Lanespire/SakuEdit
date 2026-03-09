# RabbitMQ

> Source: https://www.pulumi.com/registry/packages/rabbitmq
> Package: `@pulumi/rabbitmq`
> SST Install: `sst add @pulumi/rabbitmq`

## Overview

RabbitMQ プロバイダーは、RabbitMQ AMQP メッセージブローカーサーバーのリソース構成を Infrastructure as Code で管理できます。仮想ホスト、エクスチェンジ、キュー、バインディング、ユーザー、権限などを構成できます。

## Configuration

### 環境変数

```bash
export RABBITMQ_ENDPOINT=http://localhost:15672
export RABBITMQ_USERNAME=guest
export RABBITMQ_PASSWORD=guest
```

### Pulumi Config

```bash
pulumi config set rabbitmq:endpoint http://localhost:15672
pulumi config set rabbitmq:username guest
pulumi config set rabbitmq:password --secret guest
```

### 主な設定項目

- `endpoint` (必須): RabbitMQ Management Plugin の HTTP URL
- `username` (必須): 認証ユーザー名
- `password`: パスワード（オプション）
- `insecure`: 不安全な TLS 接続を許可
- `cacertFile` / `clientcertFile` / `clientkeyFile`: TLS 証明書
- `proxy`: プロキシ URL

## Key Resources

- **VHost** - 仮想ホスト
- **Exchange** - エクスチェンジ
- **Queue** - キュー
- **Binding** - バインディング
- **User** - ユーザー
- **Permissions** - 権限
- **Policy** - ポリシー

## Example

```typescript
import * as rabbitmq from "@pulumi/rabbitmq";

const vhost = new rabbitmq.VHost("my-vhost", {
  name: "my-vhost",
});

const exchange = new rabbitmq.Exchange("my-exchange", {
  name: "my-exchange",
  vhost: vhost.name,
  settings: {
    type: "direct",
    durable: true,
    autoDelete: false,
  },
});

const queue = new rabbitmq.Queue("my-queue", {
  name: "my-queue",
  vhost: vhost.name,
  settings: {
    durable: true,
    autoDelete: false,
  },
});
```
