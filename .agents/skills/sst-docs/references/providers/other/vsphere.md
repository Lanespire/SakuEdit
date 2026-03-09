# VMware vSphere

> Source: https://www.pulumi.com/registry/packages/vsphere
> Package: `vsphere`
> SST Install: `sst add vsphere`

## Overview

The vSphere provider enables Pulumi to manage VMware vSphere environments. It can manage many aspects of a vSphere environment, including virtual machines, standard and distributed switches, datastores, content libraries, and more. Supports vSphere 7.x and 8.x (requires API write access; incompatible with the free vSphere Hypervisor version 8).

## Configuration

Required settings:

- **user** - vSphere API username (env: `VSPHERE_USER`)
- **password** - vSphere API password (env: `VSPHERE_PASSWORD`)
- **vsphereServer** - vCenter Server FQDN or IP address (env: `VSPHERE_SERVER`)

Optional:
- `allowUnverifiedSsl` - Disable SSL certificate verification (default: false)
- `apiTimeout` - Operation timeout in minutes (default: 5)
- `vimKeepAlive` - VIM session keep-alive interval (default: 10 minutes)
- `persistSession` - Save sessions to disk for reuse

## Key Resources

- **VirtualMachine** - Create and manage virtual machines
- **Datacenter** - Query datacenter information
- **Datastore** - Access storage resources
- **ComputeCluster** - Manage compute clusters
- **Network** - Configure networking resources

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as vsphere from "@pulumi/vsphere";

const datacenter = vsphere.getDatacenter({ name: "dc-01" });

const datastore = datacenter.then((dc) =>
  vsphere.getDatastore({ name: "datastore-01", datacenterId: dc.id })
);

const cluster = datacenter.then((dc) =>
  vsphere.getComputeCluster({ name: "cluster-01", datacenterId: dc.id })
);

const network = datacenter.then((dc) =>
  vsphere.getNetwork({ name: "VM Network", datacenterId: dc.id })
);

const vm = new vsphere.VirtualMachine("vm", {
  name: "foo",
  resourcePoolId: cluster.then((c) => c.resourcePoolId),
  datastoreId: datastore.then((ds) => ds.id),
  numCpus: 1,
  memory: 1024,
  guestId: "otherLinux64Guest",
  networkInterfaces: [
    {
      networkId: network.then((n) => n.id),
    },
  ],
  disks: [
    {
      label: "disk0",
      size: 20,
    },
  ],
});
```
