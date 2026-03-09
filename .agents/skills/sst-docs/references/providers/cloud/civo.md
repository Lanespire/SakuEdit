# Civo

> Source: https://www.pulumi.com/registry/packages/civo/
> Package: `civo`
> SST Install: `sst add civo`

## Overview

The Civo provider is used to interact with the resources supported by Civo, a cloud-native infrastructure platform specializing in fast Kubernetes cluster provisioning. The provider enables management of compute instances, Kubernetes clusters, networking, and other Civo cloud resources.

## Configuration

### Environment Variables

```bash
export CIVO_TOKEN=<your-api-token>
```

### Pulumi Config

```bash
pulumi config set civo:token <your-api-token> --secret
pulumi config set civo:region LON1
```

### Credentials File

Create a credentials file (e.g., `~/.civo.json`):

```json
{
  "apikeys": {
    "my_key": "your-api-token-here"
  },
  "meta": {
    "current_apikey": "my_key"
  }
}
```

Then configure:

```bash
pulumi config set civo:credentialsFile /path/to/civo.json
```

### Credential Priority Order

1. `CIVO_TOKEN` environment variable
2. Credentials file (via `credentialsFile` config)
3. Civo CLI configuration at `~/.civo.json`

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `token` | `CIVO_TOKEN` | API token |
| `region` | - | Default region (e.g., `LON1`, `NYC1`, `FRA1`) |
| `credentialsFile` | - | Path to credentials file |
| `apiEndpoint` | - | Custom base URL for Civo API |

### Installation

```bash
pulumi package add terraform-provider civo/civo
```

## Key Resources

- **Instances**: `civo.Instance`
- **Kubernetes**: `civo.KubernetesCluster`, `civo.KubernetesNodePool`
- **Networking**: `civo.Network`, `civo.Firewall`
- **DNS**: `civo.DnsDomainName`, `civo.DnsDomainRecord`
- **Object Store**: `civo.ObjectStore`, `civo.ObjectStoreCredential`
- **Databases**: `civo.Database`
- **SSH Keys**: `civo.SshKey`

## Example

```typescript
import * as civo from "@pulumi/civo";

// Create a Kubernetes cluster
const cluster = new civo.KubernetesCluster("my-cluster", {
  region: "LON1",
  pools: {
    nodeCount: 3,
    size: "g4s.kube.medium",
  },
});

// Create a compute instance
const instance = new civo.Instance("my-instance", {
  hostname: "webserver",
  size: "g3.medium",
  region: "LON1",
});

export const clusterName = cluster.name;
export const instanceIp = instance.publicIp;
```
