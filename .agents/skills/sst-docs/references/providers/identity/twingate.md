# Twingate

> Source: https://www.pulumi.com/registry/packages/twingate
> Package: `@twingate/pulumi-twingate`
> SST Install: `sst add @twingate/pulumi-twingate`

## Overview

The Twingate provider for Pulumi can be used to provision any of the cloud resources available in Twingate. Twingate is a zero-trust network access (ZTNA) solution that replaces legacy VPNs with modern, identity-first networking. The provider must be configured with credentials to deploy and update resources. Version: v3.8.0.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TWINGATE_API_TOKEN` | API token for authentication |
| `TWINGATE_NETWORK` | Twingate network name |
| `TWINGATE_URL` | Twingate API URL |

### Pulumi Config

```yaml
config:
  twingate:apiToken:
    value: <api-token>
  twingate:network:
    value: <network-name>
```

## Key Resources

- **TwingateRemoteNetwork** - Remote network infrastructure
- **TwingateConnector** / **TwingateConnectorTokens** - Connectors within remote networks
- **TwingateResource** - Protected resources with access controls and protocol policies
- **TwingateGroup** - User and access group management
- **TwingateServiceAccount** - Service account provisioning
- **TwingateServiceAccountKey** - Credential keys for service accounts
- **TwingateUser** - User management

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as tg from "@twingate/pulumi-twingate";

// Create a Remote Network
const remoteNetwork = new tg.TwingateRemoteNetwork("office-network", {
  name: "Office",
});

// Create a Connector in the network
const connector = new tg.TwingateConnector("office-connector", {
  remoteNetworkId: remoteNetwork.id,
});

// Create a Service Account
const serviceAccount = new tg.TwingateServiceAccount("ci-cd", {
  name: "CI/CD Service",
});

// Create an Access Group
const devGroup = new tg.TwingateGroup("dev-team", {
  name: "Development Team",
});

// Create a Protected Resource
const internalApp = new tg.TwingateResource("internal-app", {
  name: "Internal Application",
  address: "internal.example.com",
  remoteNetworkId: remoteNetwork.id,
  accessGroups: [{
    groupId: devGroup.id,
  }],
  protocols: {
    allowIcmp: true,
    tcp: { policy: "RESTRICTED", ports: ["443", "8080"] },
    udp: { policy: "DENY_ALL" },
  },
});
```
