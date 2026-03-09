# OVHcloud

> Source: https://www.pulumi.com/registry/packages/ovh/
> Package: `@ovh-devrelteam/pulumi-ovh`
> SST Install: `sst add @ovh-devrelteam/pulumi-ovh`

## Overview

The OVH provider enables provisioning of resources available through OVHcloud's infrastructure platform using Pulumi's infrastructure-as-code approach. It supports management of Kubernetes clusters, cloud instances, databases, DNS, networking, and other OVHcloud services. This is the official provider, replacing the previous community version.

## Configuration

### Environment Variables

```bash
export OVH_ENDPOINT=ovh-eu
export OVH_APPLICATION_KEY=<your-application-key>
export OVH_APPLICATION_SECRET=<your-application-secret>
export OVH_CONSUMER_KEY=<your-consumer-key>
```

### Pulumi Config

```bash
pulumi config set ovh:endpoint ovh-eu
pulumi config set ovh:applicationKey <your-application-key> --secret
pulumi config set ovh:applicationSecret <your-application-secret> --secret
pulumi config set ovh:consumerKey <your-consumer-key> --secret
```

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `endpoint` | `OVH_ENDPOINT` | API endpoint (`ovh-eu`, `ovh-ca`, `ovh-us`) |
| `applicationKey` | `OVH_APPLICATION_KEY` | Application key |
| `applicationSecret` | `OVH_APPLICATION_SECRET` | Application secret |
| `consumerKey` | `OVH_CONSUMER_KEY` | Consumer key |

### Obtaining Credentials

Generate API credentials at https://api.ovh.com/createToken/ (EU) or the equivalent for your region.

## Key Resources

- **Kubernetes**: `ovh.cloudproject.Kube`, `ovh.cloudproject.KubeNodePool`
- **Cloud Instances**: `ovh.cloudproject.Instance`
- **Databases**: `ovh.cloudproject.Database`
- **Networking**: `ovh.cloudproject.Network`, `ovh.cloudproject.NetworkSubnet`
- **DNS**: `ovh.domain.Zone`, `ovh.domain.ZoneRecord`
- **Storage**: `ovh.cloudproject.ContainerRegistry`
- **IP**: `ovh.ip.IpService`, `ovh.ip.Reverse`

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as ovh from "@ovhcloud/pulumi-ovh";

const config = new pulumi.Config();
const serviceName = config.require("serviceName");

// Get an existing Kubernetes cluster
const cluster = ovh.cloudproject.getKube({
  serviceName: serviceName,
  kubeId: "xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx",
});

// Create a Kubernetes cluster
const newCluster = new ovh.cloudproject.Kube("myCluster", {
  serviceName: serviceName,
  region: "GRA7",
  name: "my-k8s-cluster",
});

// Create a node pool
const nodePool = new ovh.cloudproject.KubeNodePool("myNodePool", {
  serviceName: serviceName,
  kubeId: newCluster.id,
  name: "my-pool",
  flavorName: "b2-7",
  desiredNodes: 3,
  minNodes: 1,
  maxNodes: 5,
});

export const clusterVersion = cluster.then(c => c.version);
```
