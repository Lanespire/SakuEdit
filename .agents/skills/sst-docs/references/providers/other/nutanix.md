# Nutanix

> Source: https://www.pulumi.com/registry/packages/nutanix
> Package: `@pierskarsenbarg/nutanix`
> SST Install: `sst add @pierskarsenbarg/nutanix`

## Overview

The Nutanix provider enables provisioning of cloud resources available in Nutanix through Pulumi. It allows infrastructure-as-code deployment and management of Nutanix hyper-converged infrastructure resources including VPCs, subnets, and VMs.

## Configuration

The provider must be configured with credentials to deploy and update resources in Nutanix. Refer to the installation & configuration page for setup details.

## Key Resources

- **Vpc** - Virtual private clouds with DNS, external subnets, and routable prefix lists
- VMs, subnets, and other Nutanix infrastructure resources

## Example

```typescript
import * as nutanix from "@pierskarsenbarg/nutanix";

const vpc = new nutanix.Vpc("vpc", {
  commonDomainNameServerIpLists: [
    { ip: "8.8.8.8" },
    { ip: "8.8.8.9" },
  ],
  externalSubnetReferenceNames: ["test-Ext1", "test-ext2"],
  externallyRoutablePrefixLists: [
    {
      ip: "192.43.0.0",
      prefixLength: 16,
    },
  ],
});
```
