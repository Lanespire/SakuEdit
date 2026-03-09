# Matchbox

> Source: https://www.pulumi.com/registry/packages/matchbox
> Package: `@pulumiverse/matchbox`
> SST Install: `sst add @pulumiverse/matchbox`

## Overview

The Matchbox provider enables provisioning of the Matchbox iPXE server. It facilitates network boot configuration and OS deployment through PXE (Preboot eXecution Environment), commonly used for bare-metal provisioning of Linux systems like Fedora CoreOS.

## Configuration

Required:
- **endpoint** - The Matchbox server URL (via stack config as `matchbox:endpoint`)
- **Certificates** - Certificate-based authentication for secure connection to the server

## Key Resources

- **Profile** - Defines boot parameters, kernel images, initrds, and Ignition data for OS installation
- **Group** - Associates profiles with specific machines using selectors (MAC addresses, metadata)

## Example

```typescript
import * as matchbox from "@pulumiverse/matchbox";

const pxeProfile = new matchbox.Profile("pxeProfile", {
  initrds: [`https://builds.coreos.fedoraproject.org/...`],
  args: ["ip=dhcp", "rd.neednet=1"],
  rawIgnition: ignitionData,
});

const pxeGroup = new matchbox.Group("node1", {
  profile: pxeProfile.id,
  selector: { mac: "52:54:00:a1:9c:ae" },
  metadata: { customVariable: "value" },
});
```
