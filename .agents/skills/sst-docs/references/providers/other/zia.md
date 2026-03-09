# Zscaler Internet Access (ZIA)

> Source: https://www.pulumi.com/registry/packages/zia/
> Package: `@bdzscaler/pulumi-zia`
> SST Install: `sst add @bdzscaler/pulumi-zia`

## Overview

The ZIA provider enables provisioning of cloud resources available in Zscaler Internet Access. It allows deploying and updating resources in the ZIA Cloud for managing internet security policies, traffic forwarding, and static IP configurations.

## Configuration

The provider must be configured with credentials to deploy and update resources in the ZIA Cloud. Refer to the installation & configuration page for credential setup.

## Key Resources

- **ZIATrafficForwardingStaticIP** - Manage static IP addresses with geo-location override capabilities
- Traffic forwarding rules, URL filtering policies, and other ZIA security resources

## Example

```typescript
import * as zia from "@bdzscaler/pulumi-zia";

const staticIP = new zia.ZIATrafficForwardingStaticIP("static_ip_example", {
  comment: "Pulumi Traffic Forwarding Static IP",
  geoOverride: true,
  ipAddress: "123.234.244.245",
  latitude: -36.848461,
  longitude: 174.763336,
  routableIp: true,
});
```
