# Exoscale

> Source: https://www.pulumi.com/registry/packages/exoscale
> Package: `@pulumiverse/exoscale`
> SST Install: `sst add @pulumiverse/exoscale`

## Overview

The Exoscale provider enables provisioning of cloud resources available in the Exoscale platform, a European cloud provider offering compute, storage, and Kubernetes (SKS) services.

## Configuration

The provider must be configured with Exoscale credentials. Refer to the installation & configuration page for detailed setup.

## Key Resources

- **SKSCluster** - Exoscale's managed Kubernetes cluster offering
- Compute instances, storage, and other Exoscale cloud resources

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as exoscale from "@pulumiverse/exoscale";

const cluster = new exoscale.SKSCluster("cluster", {
  zone: "ch-gva-2",
  name: "my-sks-cluster",
});

export const endpoint = cluster.endpoint;
```
