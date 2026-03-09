# MongoDB Atlas

> Source: https://www.pulumi.com/registry/packages/mongodbatlas
> Package: `@pulumi/mongodbatlas`
> SST Install: `sst add @pulumi/mongodbatlas`

## Overview

MongoDB Atlas プロバイダーは、MongoDB Atlas のクラウドデータベースサービスリソースを Infrastructure as Code で管理できます。プロジェクト、クラスター、ネットワーキング、セキュリティなどを構成できます。

## Configuration

### 認証方法

**Service Account（推奨）:**

```bash
pulumi config set mongodbatlas:clientId <client_id>
pulumi config set mongodbatlas:clientSecret --secret <client_secret>
```

**Programmatic Access Keys:**

```bash
pulumi config set mongodbatlas:publicKey <public_key>
pulumi config set mongodbatlas:privateKey --secret <private_key>
```

その他、AWS Secrets Manager 連携や MongoDB Atlas for Government (FedRAMP) 構成にも対応しています。

## Key Resources

- **Project** - 組織プロジェクトの作成
- **AdvancedCluster** - MongoDB クラスターのデプロイ・管理
- **DatabaseUser** - データベースユーザーの管理
- **ProjectIpAccessList** - IP アクセスリスト
- **NetworkPeering** - VPC ピアリング
- **PrivateEndpoint** - プライベートエンドポイント

## Example

```typescript
import * as mongodbatlas from "@pulumi/mongodbatlas";

const project = new mongodbatlas.Project("my-project", {
  name: "my-project",
  orgId: orgId,
});

const cluster = new mongodbatlas.AdvancedCluster("my-cluster", {
  projectId: project.id,
  name: "my-cluster",
  clusterType: "REPLICASET",
  replicationSpecs: [{
    regionConfigs: [{
      regionName: "US_EAST_1",
      priority: 7,
      providerName: "AWS",
      electableSpecs: {
        instanceSize: "M10",
        nodeCount: 3,
      },
    }],
  }],
});
```
