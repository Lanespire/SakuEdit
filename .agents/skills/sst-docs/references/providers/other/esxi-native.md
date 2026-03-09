# ESXi Native

> Source: https://www.pulumi.com/registry/packages/esxi-native
> Package: `@pulumiverse/esxi-native`
> SST Install: `sst add @pulumiverse/esxi-native`

## Overview

The ESXi Native provider facilitates virtual machine provisioning directly on ESXi hypervisors without a need for vCenter or vSphere. It allows managing infrastructure on standalone ESXi hosts.

## Configuration

Refer to the installation & configuration page for specific credential and connection setup.

## Key Resources

- **VirtualMachine** - Create and manage VMs with disk storage, network interfaces, and OS configuration

## Example

```typescript
import * as esxi from "@pulumiverse/esxi-native";

export = async () => {
  const vm = new esxi.VirtualMachine("vm-test", {
    diskStore: "nvme-ssd-datastore",
    networkInterfaces: [
      {
        virtualNetwork: "default",
      },
    ],
  });

  return {
    id: vm.id,
    name: vm.name,
    os: vm.os,
  };
};
```
