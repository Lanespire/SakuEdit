# dbt Cloud

> Source: https://www.pulumi.com/registry/packages/dbtcloud/
> Package: `@pulumi/dbtcloud`
> SST Install: `sst add @pulumi/dbtcloud`

## Overview

dbt Cloud プロバイダーは、dbt Cloud のリソースを Infrastructure as Code で管理できます。dbt Cloud のプロジェクト、ジョブ、環境、接続、リポジトリなどをプログラマティックにプロビジョニング・構成できます。

## Configuration

### 環境変数

```bash
export DBT_CLOUD_TOKEN=<your_token>
export DBT_CLOUD_ACCOUNT_ID=<your_account_id>
export DBT_CLOUD_HOST_URL=https://cloud.getdbt.com/api  # オプション
```

### Pulumi Config

```bash
pulumi config set dbtcloud:token --secret <your_token>
pulumi config set dbtcloud:accountId <your_account_id>
pulumi config set dbtcloud:hostUrl https://cloud.getdbt.com/api  # オプション
```

### 主な設定項目

| オプション | 環境変数 | 必須 | 説明 |
|-----------|---------|------|------|
| `token` | `DBT_CLOUD_TOKEN` | Yes | API 認証トークン |
| `accountId` | `DBT_CLOUD_ACCOUNT_ID` | Yes | dbt Cloud アカウント ID |
| `hostUrl` | `DBT_CLOUD_HOST_URL` | No | デプロイ URL（デフォルト: `https://cloud.getdbt.com/api`） |
| `timeoutSeconds` | - | No | HTTP タイムアウト（デフォルト: 30） |
| `maxRetries` | - | No | レート制限リトライ回数（デフォルト: 3） |

## Key Resources

- **Project** - dbt プロジェクト
- **Environment** - 環境設定
- **Job** - ジョブ定義
- **Repository** - リポジトリ接続
- **Connection** - データウェアハウス接続
- **Group** - ユーザーグループ
- **BigQueryConnection** / **SnowflakeCredential** - DB 固有接続

## Example

```typescript
import * as dbtcloud from "@pulumi/dbtcloud";

const project = new dbtcloud.Project("my-project", {
  name: "my-dbt-project",
});

const environment = new dbtcloud.Environment("prod", {
  projectId: project.id,
  name: "Production",
  type: "deployment",
  dbtVersion: "1.7.0-latest",
});

const job = new dbtcloud.Job("daily-run", {
  projectId: project.id,
  environmentId: environment.environmentId,
  name: "Daily Run",
  executeSteps: ["dbt run", "dbt test"],
  triggers: {
    schedule: true,
  },
  scheduleCron: "0 8 * * *",
});
```
