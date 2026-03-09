# Databricks

> Source: https://www.pulumi.com/registry/packages/databricks
> Package: `@pulumi/databricks`
> SST Install: `sst add @pulumi/databricks`

## Overview

Databricks プロバイダーは、Databricks のほぼすべてのリソースと Infrastructure as Code でインタラクションできます。AWS、Azure、GCP 上の Databricks ワークスペースとアカウントレベルのリソースを管理できます。

## Configuration

### 環境変数

```bash
export DATABRICKS_HOST=https://<workspace>.cloud.databricks.com
export DATABRICKS_TOKEN=<your_pat_token>
```

### Pulumi Config

```bash
pulumi config set databricks:host https://<workspace>.cloud.databricks.com
pulumi config set databricks:token --secret <your_pat_token>
```

### 認証方法

1. **OpenID Connect**（推奨: CI/CD 向け）
2. **Databricks CLI** キャッシュ済み OAuth トークン
3. **Service Principal**（`clientId` + `clientSecret`）
4. **PAT トークン**（`DATABRICKS_TOKEN`）
5. **Azure MSI / Azure CLI / Azure Service Principal**
6. **GCP サービスアカウント**

### 主な設定項目

- `host` (必須): ワークスペースまたはアカウントエンドポイント
- `accountId`: アカウントレベル操作に必須
- `profile`: CLI 接続プロファイル名
- `httpTimeoutSeconds`: リクエストタイムアウト（デフォルト: 60）
- `rateLimit`: 最大リクエスト/秒（デフォルト: 15）

## Key Resources

- **Notebook** - ノートブック
- **Job** - ジョブ
- **Cluster** - クラスター
- **User** / **Group** - ユーザー・グループ
- **ServicePrincipal** - サービスプリンシパル
- **Metastore** - Unity Catalog メタストア
- **StorageCredential** - ストレージ認証情報
- **Schema** / **Catalog** - Unity Catalog リソース
- **SqlWarehouse** - SQL ウェアハウス
- **Pipeline** - Delta Live Tables パイプライン

## Example

```typescript
import * as databricks from "@pulumi/databricks";

const me = databricks.getCurrentUserOutput();

const notebook = new databricks.Notebook("my-notebook", {
  path: `${me.home}/Pulumi`,
  language: "PYTHON",
  contentBase64: Buffer.from("print('Hello from Pulumi!')").toString("base64"),
});

const job = new databricks.Job("my-job", {
  name: `Pulumi Demo (${me.alphanumeric})`,
  tasks: [{
    taskKey: "task1",
    notebookTask: {
      notebookPath: notebook.path,
    },
  }],
});
```
