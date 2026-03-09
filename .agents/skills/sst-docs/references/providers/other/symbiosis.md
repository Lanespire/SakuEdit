# Symbiosis

> Source: https://www.pulumi.com/registry/packages/symbiosis
> Package: `@symbiosis-cloud/symbiosis-pulumi`
> SST Install: `sst add @symbiosis-cloud/symbiosis-pulumi`

## Overview

The Symbiosis provider enables provisioning of resources available in Symbiosis cloud accounts through Pulumi. Symbiosis is a cloud platform that provides managed Kubernetes clusters and other cloud infrastructure services.

## Configuration

The provider requires credentials to deploy and update resources in Symbiosis. Refer to the installation & configuration page for authentication setup.

## Key Resources

- **Cluster** - Create and manage compute clusters with configurable regions

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as symbiosis from "@symbiosis-cloud/symbiosis-pulumi";

const mysite = new symbiosis.Cluster("example", {
  region: "germany-1",
});
```
