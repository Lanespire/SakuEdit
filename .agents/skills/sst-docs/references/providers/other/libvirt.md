# Libvirt

> Source: https://www.pulumi.com/registry/packages/libvirt
> Package: `libvirt`
> SST Install: `sst add libvirt`

## Overview

The Libvirt provider enables interaction with libvirt to manage virtual machines, networks, storage pools, and other resources. It follows the libvirt XML schemas closely, providing fine-grained control over all libvirt features.

## Configuration

- **uri** (String) - Libvirt connection URI. Defaults to `qemu:///system` if not specified. See libvirt URI documentation for supported connection types.

Installation:
```bash
pulumi package add terraform-provider dmacvicar/libvirt
```

## Key Resources

- Virtual machines
- Networks
- Storage pools and volumes
- Domains

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as libvirt from "@pulumi/libvirt";

// Configure the provider with a libvirt connection URI
// Default: qemu:///system
```
