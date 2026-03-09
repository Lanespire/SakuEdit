# Equinix

> Source: https://www.pulumi.com/registry/packages/equinix/
> Package: `@equinix-labs/pulumi-equinix`
> SST Install: `sst add @equinix-labs/pulumi-equinix`

## Overview

The Equinix provider for Pulumi enables provisioning of Equinix resources including Metal (bare metal servers), Fabric (interconnection), and Network Edge (virtual network services). It allows infrastructure-as-code management of Equinix's cloud and networking services for hybrid and multi-cloud deployments.

## Configuration

### Environment Variables

```bash
export EQUINIX_API_TOKEN=<your-api-token>
export METAL_AUTH_TOKEN=<your-metal-auth-token>
```

### Pulumi Config

```bash
pulumi config set equinix:authToken <your-api-token> --secret
pulumi config set equinix:projectId <your-project-id>
```

### Key Configuration Options

| Option | Description |
|--------|-------------|
| `authToken` | Equinix API authentication token |
| `projectId` | Default project ID for Metal resources |
| `clientId` | OAuth client ID (for Fabric/Network Edge) |
| `clientSecret` | OAuth client secret |

## Key Resources

- **Metal**: `equinix.metal.Device`, `equinix.metal.Project`, `equinix.metal.Vlan`
- **Fabric**: `equinix.fabric.Connection`, `equinix.fabric.ServiceProfile`
- **Network Edge**: `equinix.networkedge.Device`, `equinix.networkedge.AclTemplate`
- **Metal Networking**: `equinix.metal.ReservedIpBlock`, `equinix.metal.SpotMarketRequest`

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as equinix from "@equinix-labs/pulumi-equinix";

const config = new pulumi.Config();
const projectId = config.require("projectId");

// Create a bare metal server
const web = new equinix.metal.Device("web", {
  hostname: "webserver1",
  plan: "c3.small.x86",
  operatingSystem: "ubuntu_20_04",
  metro: "sv",
  billingCycle: "hourly",
  projectId: projectId,
});

export const webPublicIp = pulumi.interpolate`http://${web.accessPublicIpv4}`;
```
