# Unifi

> Source: https://www.pulumi.com/registry/packages/unifi
> Package: `@pulumiverse/unifi`
> SST Install: `sst add @pulumiverse/unifi`

## Overview

The Unifi provider enables provisioning of network resources available in a Unifi-based network controlled by a Unifi controller. It allows infrastructure-as-code management of Unifi network configurations including sites, WLANs, networks, and firewall rules.

## Configuration

The provider must be configured with credentials to deploy and update resources in Unifi. Refer to the installation & configuration page for controller connection details.

## Key Resources

- **Site** - Create and manage Unifi sites
- Networks, WLANs, firewall rules, and other Unifi network resources

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as unifi from "@pulumiverse/unifi";

const mysite = new unifi.Site("mysite", {
  description: "mysite",
});
```
