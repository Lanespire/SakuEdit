# Cisco ACI

> Source: https://www.pulumi.com/registry/packages/aci
> Package: `@netascode/aci`
> SST Install: `sst add @netascode/aci`

## Overview

The Cisco ACI provider enables provisioning of network resources in ACI-based networks controlled by an APIC (Application Policy Infrastructure Controller). It leverages Cisco's Application Centric Infrastructure to simplify, optimize, and accelerate the entire application deployment lifecycle.

## Configuration

The provider must be configured with credentials to deploy and update resources on APIC. Refer to the installation & configuration page for specific credential setup.

## Key Resources

- **aci.apic.Rest** - A generic REST-based resource for managing ACI objects (tenants, EPGs, contracts, etc.)

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aci from "@netascode/aci";

const tenant = new aci.apic.Rest("TENANT1", {
  dn: "uni/tn-TENANT1",
  class_name: "fvTenant",
  content: {
    name: "TENANT1",
    descr: "Tenant created by Pulumi",
  },
});
```
