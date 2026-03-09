# Pinecone

> Source: https://www.pulumi.com/registry/packages/pinecone
> Package: `@pinecone-database/pulumi`
> SST Install: `sst add @pinecone-database/pulumi`

## Overview

Pinecone プロバイダーは、Pinecone のコレクションとインデックスを Infrastructure as Code で管理できます。Pinecone はベクトルデータベースサービスで、AI/ML アプリケーションにおけるベクトル検索に使用されます。

## Configuration

### 環境変数

```bash
export PINECONE_API_KEY=<your_api_key>
```

### Pulumi Config

```bash
pulumi config set pinecone:APIKey --secret <your_api_key>
```

### 主な設定項目

| オプション | 環境変数 | 必須 | 説明 |
|-----------|---------|------|------|
| `APIKey` | `PINECONE_API_KEY` | Yes | Pinecone API キー |

## Key Resources

- **Index** - Pinecone インデックスの作成・管理
- **Collection** - コレクションの管理

## Example

```typescript
import * as pinecone from "@pinecone-database/pulumi";

const myPineconeIndex = new pinecone.Index("myPineconeIndex", {
  name: "example-index",
  dimension: 10,
  spec: {
    serverless: {
      cloud: "aws",
      region: "us-east-1",
    },
  },
});

export const name = myPineconeIndex.name;
export const host = myPineconeIndex.host;
```
