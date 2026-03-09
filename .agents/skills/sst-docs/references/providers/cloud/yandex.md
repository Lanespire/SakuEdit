# Yandex Cloud

> Source: https://www.pulumi.com/registry/packages/yandex/
> Package: `yandex`
> SST Install: `sst add yandex`

## Overview

The Yandex Cloud provider enables provisioning of cloud resources available in Yandex Cloud through Pulumi infrastructure-as-code. It allows developers to deploy and manage cloud infrastructure on the Yandex Cloud platform including VPC networking, compute instances, managed databases, Kubernetes, and other services.

## Configuration

### Environment Variables

```bash
export YC_TOKEN=<your-oauth-token>
export YC_CLOUD_ID=<your-cloud-id>
export YC_FOLDER_ID=<your-folder-id>
export YC_ZONE=ru-central1-a
```

### Pulumi Config

```bash
pulumi config set yandex:token <your-oauth-token> --secret
pulumi config set yandex:cloudId <your-cloud-id>
pulumi config set yandex:folderId <your-folder-id>
pulumi config set yandex:zone ru-central1-a
```

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `token` | `YC_TOKEN` | OAuth token or IAM token |
| `cloudId` | `YC_CLOUD_ID` | Cloud ID |
| `folderId` | `YC_FOLDER_ID` | Folder ID (required) |
| `zone` | `YC_ZONE` | Default availability zone |
| `serviceAccountKeyFile` | `YC_SERVICE_ACCOUNT_KEY_FILE` | Path to service account key file |

## Key Resources

- **VPC**: `yandex.VpcNetwork`, `yandex.VpcSubnet`, `yandex.VpcSecurityGroup`
- **Compute**: `yandex.ComputeInstance`, `yandex.ComputeInstanceGroup`
- **Managed Databases**: `yandex.MdbPostgresqlCluster`, `yandex.MdbMysqlCluster`, `yandex.MdbClickhouseCluster`
- **Kubernetes**: `yandex.KubernetesCluster`, `yandex.KubernetesNodeGroup`
- **Object Storage**: `yandex.StorageBucket`, `yandex.StorageObject`
- **Functions**: `yandex.Function`
- **DNS**: `yandex.DnsZone`, `yandex.DnsRecordSet`
- **IAM**: `yandex.IamServiceAccount`, `yandex.ResourcemanagerFolderIamBinding`

## Example

```typescript
import * as yandex from "@pulumi/yandex";

// Create a VPC network
const network = new yandex.VpcNetwork("myNetwork", {
  name: "my-network",
});

// Create a subnet
const subnet = new yandex.VpcSubnet("mySubnet", {
  networkId: network.id,
  v4CidrBlocks: ["10.0.0.0/24"],
  zone: "ru-central1-a",
});

// Create a compute instance
const instance = new yandex.ComputeInstance("myInstance", {
  zone: "ru-central1-a",
  platformId: "standard-v3",
  resources: {
    cores: 2,
    memory: 4,
  },
  bootDisk: {
    initializeParams: {
      imageId: "fd8vmcue7aajpmeo39kk", // Ubuntu 22.04
    },
  },
  networkInterfaces: [{
    subnetId: subnet.id,
    nat: true,
  }],
});

export const instanceIp = instance.networkInterfaces.apply(
  ni => ni[0].natIpAddress
);
```
