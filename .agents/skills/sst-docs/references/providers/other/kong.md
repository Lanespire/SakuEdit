# Kong

> Source: https://www.pulumi.com/registry/packages/kong
> Package: `kong`
> SST Install: `sst add kong`

## Overview

The Kong provider enables infrastructure-as-code management for Kong API Gateway. It supports Kong 2.X versions and is tested against real Kong instances. It allows management of services, routes, plugins, consumers, and other Kong resources.

## Configuration

Required:
- **kongAdminUri** - The Kong admin API endpoint (e.g., `http://localhost:8001`) (env: `KONG_ADMIN_ADDR`)

Optional:
- `kongAdminUsername` / `kongAdminPassword` - BasicAuth credentials
- `tlsSkipVerify` - Skip TLS certificate verification
- `kongApiKey` - API key for standard authentication
- `kongAdminToken` - API key for Enterprise Edition
- `kongWorkspace` - Workspace context (Enterprise)
- `strictPluginsMatch` - Strict plugin configuration matching

## Key Resources

- Services, Routes, Plugins, Consumers, Upstreams, Targets, and other Kong API Gateway resources

## Example

```yaml
# Pulumi.yaml provider configuration
config:
  kong:kongAdminUri: http://localhost:8001
  kong:kongAdminUsername: youruser
  kong:kongAdminPassword: yourpass
```

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as kong from "@pulumi/kong";

// Use kong resources to manage API Gateway configuration
```
