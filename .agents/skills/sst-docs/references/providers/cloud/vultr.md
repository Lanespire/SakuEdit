# Vultr

> Source: https://www.pulumi.com/registry/packages/vultr/
> Package: `@ediri/vultr`
> SST Install: `sst add @ediri/vultr`

## Overview

The Vultr Resource Provider enables management of Vultr cloud infrastructure resources through Pulumi's infrastructure-as-code framework. It facilitates programmatic provisioning of compute instances, Kubernetes clusters (VKE), block storage, load balancers, DNS, and other Vultr cloud services.

## Configuration

### Environment Variables

```bash
export VULTR_API_KEY=<your-api-key>
```

### Pulumi Config

```bash
pulumi config set vultr:apiKey <your-api-key> --secret
```

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `apiKey` | `VULTR_API_KEY` | Vultr API key (required) |
| `rateLimit` | - | API rate limit (requests per second) |
| `retryLimit` | - | Maximum number of retries |

## Key Resources

- **Compute**: `vultr.Instance`, `vultr.BareMetalServer`
- **Kubernetes**: `vultr.Kubernetes` (VKE)
- **Block Storage**: `vultr.BlockStorage`
- **Load Balancers**: `vultr.LoadBalancer`
- **DNS**: `vultr.DnsDomain`, `vultr.DnsRecord`
- **Networking**: `vultr.Vpc`, `vultr.Firewall`, `vultr.FirewallRule`
- **Object Storage**: `vultr.ObjectStorage`
- **Databases**: `vultr.Database`
- **SSH Keys**: `vultr.SshKey`

## Example

```typescript
import * as vultr from "@ediri/vultr";

// Create a Kubernetes cluster
const vke = new vultr.Kubernetes("vke", {
  region: "fra",
  version: "v1.28.0+1",
  label: "pulumi-vultr-cluster",
  nodePools: {
    nodeQuantity: 3,
    plan: "vc2-2c-4gb",
    label: "pulumi-vultr-nodepool",
  },
});

// Create a compute instance
const instance = new vultr.Instance("web", {
  region: "fra",
  plan: "vc2-1c-1gb",
  osId: 1743, // Ubuntu 22.04
  label: "web-server",
});

export const kubeconfig = vke.kubeConfig;
export const instanceIp = instance.mainIp;
```
