# HashiCorp Cloud Platform (HCP)

> Source: https://www.pulumi.com/registry/packages/hcp
> Package: `@grapl/pulumi-hcp`
> SST Install: `sst add @grapl/pulumi-hcp`

## Overview

The HCP provider enables provisioning of cloud resources available in HashiCorp Cloud Platform. HCP offers managed versions of HashiCorp products including Vault, Consul, Boundary, Packer, and Waypoint as cloud services. The provider must be configured with credentials to deploy and update resources. Version: v0.1.14, published by Grapl Security.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `HCP_CLIENT_ID` | HCP service principal client ID |
| `HCP_CLIENT_SECRET` | HCP service principal client secret |
| `HCP_PROJECT_ID` | HCP project ID |

### Pulumi Config

```yaml
config:
  hcp:clientId:
    value: <client-id>
  hcp:clientSecret:
    value: <client-secret>
  hcp:projectId:
    value: <project-id>
```

## Key Resources

- **Hvn** - HashiCorp Virtual Network (core networking infrastructure)
- **VaultCluster** - Managed Vault deployment (dev, standard, plus tiers)
- **ConsulCluster** - Managed Consul deployment
- **BoundaryCluster** - Managed Boundary deployment
- **HvnPeeringConnection** - VPC peering between HVN and cloud provider
- **HvnRoute** - Network routing configuration
- **AwsNetworkPeering** - AWS VPC peering
- **AzurePeeringConnection** - Azure VNet peering
- **PackerChannel** / **PackerRunTask** - Packer image management
- **VaultClusterAdminToken** - Vault admin token generation

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as hcp from "@grapl/pulumi-hcp";

// Create a HashiCorp Virtual Network
const hvn = new hcp.Hvn("my-hvn", {
  hvnId: "my-hvn",
  cloudProvider: "aws",
  region: "us-east-1",
});

// Deploy a managed Vault cluster
const vaultCluster = new hcp.VaultCluster("my-vault", {
  hvnId: hvn.hvnId,
  clusterId: "my-vault-cluster",
  tier: "dev",
});

// Deploy a managed Consul cluster
const consulCluster = new hcp.ConsulCluster("my-consul", {
  hvnId: hvn.hvnId,
  clusterId: "my-consul-cluster",
  tier: "development",
});
```
