# FortiOS

> Source: https://www.pulumi.com/registry/packages/fortios
> Package: `@pulumiverse/fortios`
> SST Install: `sst add @pulumiverse/fortios`

## Overview

The FortiOS provider enables interaction with resources supported by FortiOS and FortiManager products (FortiGate and FortiManager). It allows infrastructure-as-code management of Fortinet security appliance configurations.

## Configuration

Required settings:

- **cabundlefile** - Path to your CA certificate file
- **hostname** - FortiOS device IP address or hostname
- **insecure** - Boolean flag for SSL verification (false recommended)
- **token** - API authentication token from your FortiOS device

## Key Resources

- **networking.RouteStatic** - Static routing entries
- Firewall policies, VPN configurations, and other FortiOS resources

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as fortios from "@pulumiverse/fortios";

const config = new pulumi.Config();
const fortiosProvider = new fortios.Provider("fortios-provider", {
  cabundlefile: config.require("fortios:cabundlefile"),
  hostname: config.require("fortios:hostname"),
  insecure: config.require("fortios:insecure"),
  token: config.require("fortios:token"),
});

const test1 = new fortios.networking.RouteStatic(
  "test1",
  {
    dst: "110.2.2.122/32",
    gateway: "2.2.2.2",
    device: "device",
  },
  { provider: fortiosProvider }
);
```
