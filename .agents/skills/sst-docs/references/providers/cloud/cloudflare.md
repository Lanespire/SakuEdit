# Cloudflare

> Source: https://www.pulumi.com/registry/packages/cloudflare/
> Package: `cloudflare`
> SST Install: `sst add cloudflare`

## Overview

The Cloudflare provider enables interaction with Cloudflare resources through Pulumi's infrastructure-as-code framework. It facilitates automation of DNS records, Workers, Pages, R2 storage, security settings, tunnels, and other Cloudflare services programmatically.

## Configuration

### Environment Variables

```bash
export CLOUDFLARE_API_TOKEN=<your-api-token>
```

Or for legacy API key authentication:

```bash
export CLOUDFLARE_API_KEY=<your-api-key>
export CLOUDFLARE_EMAIL=<your-email>
```

### Pulumi Config

```bash
pulumi config set cloudflare:apiToken <your-api-token> --secret
```

### Authentication Methods

Only one credential type is needed:

| Method | Environment Variable | Description |
|--------|---------------------|-------------|
| `apiToken` | `CLOUDFLARE_API_TOKEN` | API token (recommended) |
| `apiKey` | `CLOUDFLARE_API_KEY` | Legacy API key (requires email) |
| `apiUserServiceKey` | `CLOUDFLARE_API_USER_SERVICE_KEY` | User service key (restricted endpoints) |

### Optional Configuration

| Option | Description |
|--------|-------------|
| `baseUrl` | Override base API URL |
| `userAgentOperatorSuffix` | Custom user agent suffix |

## Key Resources

- **DNS**: `cloudflare.DnsRecord`, `cloudflare.Zone`
- **Workers**: `cloudflare.WorkerScript`, `cloudflare.WorkerRoute`
- **Pages**: `cloudflare.PagesProject`, `cloudflare.PagesDomain`
- **R2 Storage**: `cloudflare.R2Bucket`
- **Tunnels**: `cloudflare.ZeroTrustTunnelCloudflared`, `cloudflare.ZeroTrustTunnelCloudflaredConfig`
- **Access**: `cloudflare.ZeroTrustAccessApplication`, `cloudflare.ZeroTrustAccessPolicy`
- **Firewall**: `cloudflare.Ruleset`
- **SSL/TLS**: `cloudflare.CertificatePack`
- **Load Balancing**: `cloudflare.LoadBalancer`, `cloudflare.LoadBalancerPool`

## Example

```typescript
import * as cloudflare from "@pulumi/cloudflare";

// Create a DNS record
const record = new cloudflare.DnsRecord("www", {
  zoneId: "your-zone-id",
  name: "www",
  type: "A",
  content: "203.0.113.10",
  ttl: 3600,
  proxied: true,
});

// Create a Worker script
const worker = new cloudflare.WorkerScript("myWorker", {
  accountId: "your-account-id",
  name: "my-worker",
  content: `
    export default {
      async fetch(request) {
        return new Response("Hello from Cloudflare Workers!");
      }
    }
  `,
  module: true,
});

export const recordHostname = record.name;
```
