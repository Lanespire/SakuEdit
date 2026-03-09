# Linode (Akamai Cloud)

> Source: https://www.pulumi.com/registry/packages/linode/
> Package: `linode`
> SST Install: `sst add linode`

## Overview

The Linode provider exposes resources and functions to interact with Linode (now Akamai Cloud Computing) services through Pulumi. It enables provisioning of compute instances, object storage, Kubernetes clusters, databases, networking, and other Linode cloud resources.

## Configuration

### Environment Variables

```bash
export LINODE_TOKEN=<your-api-token>
```

### Pulumi Config

```bash
pulumi config set linode:token <your-api-token> --secret
```

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `token` | `LINODE_TOKEN` | APIv4 token (required) |
| `configPath` | - | Path to Linode config file (default: `~/.config/linode`) |
| `configProfile` | - | Named profile from config file (default: `default`) |
| `url` | `LINODE_URL` | Custom API endpoint |
| `apiVersion` | - | API version (default: `v4`, supports `v4beta`) |
| `objAccessKey` | - | Object storage access key |
| `objSecretKey` | - | Object storage secret key |
| `objUseTempKeys` | - | Auto-generate temporary object storage credentials |
| `objBucketForceDelete` | - | Purge bucket contents before deletion |

## Key Resources

- **Compute**: `linode.Instance`
- **Kubernetes**: `linode.LkeCluster`
- **Object Storage**: `linode.ObjectStorageBucket`, `linode.ObjectStorageObject`
- **Databases**: `linode.DatabaseMysql`, `linode.DatabasePostgresql`
- **Networking**: `linode.Firewall`, `linode.NodeBalancer`
- **DNS**: `linode.Domain`, `linode.DomainRecord`
- **Volumes**: `linode.Volume`
- **Images**: `linode.Image`

## Example

```typescript
import * as linode from "@pulumi/linode";

// Create a Linode instance
const instance = new linode.Instance("my-instance", {
  type: "g6-nanode-1",
  region: "us-east",
  image: "linode/ubuntu22.04",
  rootPass: "securePassword123!",
  label: "my-web-server",
});

// Create an LKE cluster
const cluster = new linode.LkeCluster("my-cluster", {
  label: "my-k8s-cluster",
  region: "us-east",
  k8sVersion: "1.28",
  pools: [{
    type: "g6-standard-2",
    count: 3,
  }],
});

export const instanceIp = instance.ipAddress;
export const kubeconfig = cluster.kubeconfig;
```
