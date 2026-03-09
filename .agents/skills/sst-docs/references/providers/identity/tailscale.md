# Tailscale

> Source: https://www.pulumi.com/registry/packages/tailscale
> Package: `tailscale`
> SST Install: `sst add tailscale`

## Overview

The Tailscale provider enables interaction with resources supported by the Tailscale API, allowing infrastructure-as-code management of Tailscale networking resources. Tailscale is a mesh VPN built on WireGuard that provides secure networking between devices, servers, and cloud instances. Version: v0.26.0.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TAILSCALE_API_KEY` | API key authentication |
| `TAILSCALE_OAUTH_CLIENT_ID` | OAuth client identifier |
| `TAILSCALE_OAUTH_CLIENT_SECRET` | OAuth client secret |
| `TAILSCALE_IDENTITY_TOKEN` | Federated identity JWT |
| `TAILSCALE_BASE_URL` | API endpoint (default: https://api.tailscale.com) |
| `TAILSCALE_TAILNET` | Tailnet identifier |

### Authentication Methods

1. **OAuth Clients** (recommended) - Set `oauthClientId` and `oauthClientSecret` with granular access scopes
2. **Federated Identities** - Configure `oauthClientId` and `identityToken` for workload identity federation
3. **API Keys** - Use `apiKey` parameter (less granular)

### Pulumi Config

```yaml
config:
  tailscale:oauthClientId:
    value: <client-id>
  tailscale:oauthClientSecret:
    value: <client-secret>
  tailscale:tailnet:
    value: example.com
```

## Key Resources

### Access and Authentication
- **Acl** - Access control list management
- **DeviceAuthorization** - Device authorization handling
- **DeviceKey** - Device key management
- **TailnetKey** - Tailnet key management
- **FederatedIdentity** - Federated identity configuration

### Network Configuration
- **DeviceSubnetRoutes** - Subnet route configuration
- **DeviceTags** - Device tagging
- **DnsConfiguration** - DNS configuration
- **DnsNameservers** / **DnsSplitNameservers** - DNS nameserver management
- **DnsPreferences** - DNS preference settings
- **DnsSearchPaths** - DNS search path management

### Account and Settings
- **TailnetSettings** - Tailnet-wide settings
- **Contacts** - Contact information management

### Integrations
- **OauthClient** - OAuth client configuration
- **PostureIntegration** - Device posture integrations
- **LogstreamConfiguration** - Log streaming setup
- **Webhook** - Webhook management

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as tailscale from "@pulumi/tailscale";

// Create a Tailnet Key for device enrollment
const key = new tailscale.TailnetKey("server-key", {
  reusable: true,
  ephemeral: false,
  preauthorized: true,
  tags: ["tag:server"],
});

// Configure DNS
const dns = new tailscale.DnsNameservers("dns", {
  nameservers: ["8.8.8.8", "8.8.4.4"],
});

// Configure DNS search paths
const searchPaths = new tailscale.DnsSearchPaths("search", {
  searchPaths: ["example.com"],
});

// Set up ACL
const acl = new tailscale.Acl("acl", {
  acl: JSON.stringify({
    acls: [
      {
        action: "accept",
        src: ["group:engineering"],
        dst: ["tag:server:*"],
      },
    ],
    groups: {
      "group:engineering": ["user@example.com"],
    },
    tagOwners: {
      "tag:server": ["group:engineering"],
    },
  }),
});
```
