# DigitalOcean

> Source: https://www.pulumi.com/registry/packages/digitalocean/
> Package: `digitalocean`
> SST Install: `sst add digitalocean`

## Overview

The DigitalOcean provider enables infrastructure-as-code management of DigitalOcean cloud resources through Pulumi. It facilitates programmatic provisioning and management of Droplets, Kubernetes clusters, databases, load balancers, DNS, Spaces (object storage), and other DigitalOcean services.

## Configuration

### Environment Variables

```bash
export DIGITALOCEAN_TOKEN=<your-api-token>
```

Alternative: `DIGITALOCEAN_ACCESS_TOKEN`

### Pulumi Config

```bash
pulumi config set digitalocean:token <your-api-token> --secret
```

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `token` | `DIGITALOCEAN_TOKEN` | API token (required) |
| `spacesAccessId` | `SPACES_ACCESS_KEY_ID` | Spaces API access key |
| `spacesSecretKey` | `SPACES_SECRET_ACCESS_KEY` | Spaces API secret key |
| `apiEndpoint` | - | Override base API URL (default: `https://api.digitalocean.com`) |
| `spacesEndpoint` | - | Custom Spaces endpoint |
| `requestsPerSecond` | - | API rate limiting |

## Key Resources

- **Droplets**: `digitalocean.Droplet`
- **Kubernetes**: `digitalocean.KubernetesCluster`, `digitalocean.KubernetesNodePool`
- **Databases**: `digitalocean.DatabaseCluster`, `digitalocean.DatabaseDb`
- **Load Balancers**: `digitalocean.LoadBalancer`
- **DNS**: `digitalocean.Domain`, `digitalocean.DnsRecord`
- **Spaces**: `digitalocean.SpacesBucket`, `digitalocean.SpacesBucketObject`
- **Networking**: `digitalocean.Vpc`, `digitalocean.Firewall`
- **App Platform**: `digitalocean.App`

## Example

```typescript
import * as digitalocean from "@pulumi/digitalocean";

// Create a Droplet
const web = new digitalocean.Droplet("web", {
  image: "ubuntu-22-04-x64",
  region: "nyc3",
  size: "s-1vcpu-1gb",
});

// Create a managed database
const db = new digitalocean.DatabaseCluster("mydb", {
  engine: "pg",
  version: "15",
  size: "db-s-1vcpu-1gb",
  region: "nyc3",
  nodeCount: 1,
});

export const dropletIp = web.ipv4Address;
export const dbHost = db.host;
```
