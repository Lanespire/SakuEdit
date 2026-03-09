# Scaleway

> Source: https://www.pulumi.com/registry/packages/scaleway
> Package: `@pulumiverse/scaleway`
> SST Install: `sst add @pulumiverse/scaleway`

## Overview

The Scaleway provider enables provisioning of cloud resources available on the Scaleway platform, a European cloud provider. It supports compute instances, managed Kubernetes, object storage, databases, and other Scaleway services.

## Configuration

The provider must be configured with Scaleway credentials. Refer to the installation & configuration page for detailed setup.

## Key Resources

- **InstanceIp** - Public IP addresses
- **InstanceServer** - Cloud compute instances with configurable type, image, and tags

## Example

```typescript
import * as scaleway from "@pulumiverse/scaleway";

const publicIp = new scaleway.InstanceIp("example");

const server = new scaleway.InstanceServer("example", {
  type: "DEV1-S",
  image: "ubuntu_focal",
  ipId: publicIp.id,
  tags: ["typescript"],
});
```
