# Azure QuickStart ACR Geo Replication

> Source: https://www.pulumi.com/registry/packages/azure-quickstart-acr-geo-replication
> Package: `azure-quickstart-acr-geo-replication`
> SST Install: `sst add azure-quickstart-acr-geo-replication`

## Overview

This Pulumi package simplifies creation of Azure Container Registry (ACR) instances with geographic replication capabilities. It provides a streamlined way to deploy replicated registries across multiple Azure regions using infrastructure as code.

- **Current Version:** v0.0.3
- **Publisher:** Ian Wahbe / Pulumi
- **Repository:** [pulumi/pulumi-azure-quickstart-acr-geo-replication](https://github.com/pulumi/pulumi-azure-quickstart-acr-geo-replication)
- **Languages:** TypeScript/JavaScript, Python, Go

## Configuration

| Parameter | Description | Example |
|-----------|-------------|---------|
| `name` | Name for the registry | `"myregistry"` |
| `replicationLocation` | Azure region for replication | `"westus"` |
| `resourceGroupName` | Target Azure resource group | `"my-rg"` |

## Key Resources

### ReplicatedRegistry

The primary component that creates:

- Azure Container Registry (ACR) with geo-replication support
- Replication configuration to the specified region

### Outputs

- `loginServer` - Credentials for registry access
- `registry.id` - Underlying registry identifier

## Example

```typescript
import * as acr from "@pulumi/azure-quickstart-acr-geo-replication";

const registry = new acr.ReplicatedRegistry("my-registry", {
  name: "myregistry",
  replicationLocation: "westus",
  resourceGroupName: "my-resource-group",
});

export const loginServer = registry.loginServer;
export const registryId = registry.registry.id;
```
