# Hetzner Cloud

> Source: https://www.pulumi.com/registry/packages/hcloud/
> Package: `hcloud`
> SST Install: `sst add hcloud`

## Overview

The Hetzner Cloud (hcloud) provider enables interaction with resources supported by Hetzner Cloud through Pulumi. It allows provisioning of servers, networks, load balancers, volumes, firewalls, and other Hetzner Cloud infrastructure resources.

## Configuration

### Environment Variables

```bash
export HCLOUD_TOKEN=<your-api-token>
```

### Pulumi Config

```bash
pulumi config set hcloud:token <your-api-token> --secret
```

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `token` | `HCLOUD_TOKEN` | Hetzner Cloud API token (required) |
| `endpoint` | - | Override default endpoint (default: `https://api.hetzner.cloud/v1`) |
| `pollInterval` | - | Polling interval in ms (default: 500ms; increase if rate limited) |
| `pollFunction` | - | Polling strategy: `constant` or `exponential` |

## Key Resources

- **Servers**: `hcloud.Server`
- **Networks**: `hcloud.Network`, `hcloud.NetworkSubnet`
- **Load Balancers**: `hcloud.LoadBalancer`, `hcloud.LoadBalancerService`
- **Volumes**: `hcloud.Volume`, `hcloud.VolumeAttachment`
- **Firewalls**: `hcloud.Firewall`
- **Floating IPs**: `hcloud.FloatingIp`, `hcloud.FloatingIpAssignment`
- **SSH Keys**: `hcloud.SshKey`
- **Placement Groups**: `hcloud.PlacementGroup`
- **Images**: `hcloud.Snapshot`

## Example

```typescript
import * as hcloud from "@pulumi/hcloud";

// Create an SSH key
const sshKey = new hcloud.SshKey("my-key", {
  publicKey: "ssh-rsa AAAA...",
});

// Create a server
const server = new hcloud.Server("my-server", {
  serverType: "cx22",
  image: "ubuntu-22.04",
  location: "fsn1",
  sshKeys: [sshKey.id],
});

// Create a firewall
const firewall = new hcloud.Firewall("my-firewall", {
  rules: [
    {
      direction: "in",
      protocol: "tcp",
      port: "22",
      sourceIps: ["0.0.0.0/0", "::/0"],
    },
    {
      direction: "in",
      protocol: "tcp",
      port: "80",
      sourceIps: ["0.0.0.0/0", "::/0"],
    },
  ],
});

export const serverIp = server.ipv4Address;
```
