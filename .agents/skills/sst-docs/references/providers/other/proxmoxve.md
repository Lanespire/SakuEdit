# Proxmox VE

> Source: https://www.pulumi.com/registry/packages/proxmoxve
> Package: `@muhlba91/pulumi-proxmoxve`
> SST Install: `sst add @muhlba91/pulumi-proxmoxve`

## Overview

The Proxmox VE provider enables infrastructure-as-code provisioning of virtual machines and containers within Proxmox VE environments. It supports comprehensive VM configuration including CPU, memory, disk, network, and cloud-init settings.

## Configuration

Refer to the installation & configuration page for provider setup. The provider connects to Proxmox VE API for resource management.

## Key Resources

- **vm.VirtualMachine** - Create and manage virtual machines with CPU, memory, disk, network, cloud-init, and BIOS configuration

## Example

```typescript
const proxmox = require("@muhlba91/pulumi-proxmoxve");

const virtualMachine = new proxmox.vm.VirtualMachine("vm", {
  nodeName: "pve1",
  agent: {
    enabled: false,
    trim: true,
    type: "virtio",
  },
  bios: "seabios",
  cpu: { cores: 1, sockets: 1 },
  memory: { dedicated: 1024 },
  name: "proxmox-vm",
  networkDevices: [{ bridge: "vmbr0", model: "virtio" }],
});
```
