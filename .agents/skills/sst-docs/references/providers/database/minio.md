# MinIO

> Source: https://www.pulumi.com/registry/packages/minio
> Package: `@pulumi/minio`
> SST Install: `sst add @pulumi/minio`

## Overview

MinIO プロバイダーは、MinIO S3 バケットと IAM ユーザーを Infrastructure as Code で管理できます。MinIO はオブジェクトストレージシステムであり、S3 互換の API を提供します。

## Configuration

### 環境変数

```bash
export MINIO_ENDPOINT=<endpoint>
export MINIO_USER=<username>
export MINIO_PASSWORD=<password>
export MINIO_ENABLE_HTTPS=true  # オプション
```

### Pulumi Config

```bash
pulumi config set minio:minioServer <endpoint>
pulumi config set minio:minioUser <username>
pulumi config set minio:minioPassword --secret <password>
```

### 主な設定項目

- `minioServer`: MinIO サーバーエンドポイント
- `minioUser`: ユーザー名
- `minioPassword`: パスワード
- `minioRegion`: リージョン（デフォルト: `us-east-1`）
- `minioApiVersion`: API バージョン（`v2` または `v4`）
- `minioSsl`: SSL 有効化

## Key Resources

- **S3Bucket** - S3 バケットの作成・管理
- **S3Object** - オブジェクトのアップロード・管理
- **S3BucketPolicy** - バケットポリシー
- **IamUser** - IAM ユーザー
- **IamPolicy** - IAM ポリシー
- **IamGroup** - IAM グループ

## Example

```typescript
import * as minio from "@pulumi/minio";

const bucket = new minio.S3Bucket("my-bucket", {
  bucket: "my-bucket",
  acl: "private",
});
```
