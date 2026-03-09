# Cisco Catalyst SD-WAN

> Source: https://www.pulumi.com/registry/packages/sdwan
> Package: `sdwan`
> SST Install: `sst add sdwan`

## Overview

The SD-WAN provider enables interaction with Cisco Catalyst SD-WAN environments through REST API communication with the SD-WAN Manager. It supports Catalyst SD-WAN versions 20.09 and 20.15 for managing SD-WAN configurations as code.

## Configuration

Required settings:

- **url** - URL of the Cisco SD-WAN Manager device (env: `SDWAN_URL`)
- **username** - SD-WAN Manager account username (env: `SDWAN_USERNAME`)
- **password** - SD-WAN Manager account password (env: `SDWAN_PASSWORD`)

Optional:
- `insecure` - Allow insecure HTTPS (default: true, env: `SDWAN_INSECURE`)
- `retries` - REST API call retry count (default: 3, env: `SDWAN_RETRIES`)
- `taskTimeout` - Async task timeout in seconds (default: 1500, env: `SDWAN_TASK_TIMEOUT`)

## Key Resources

- SD-WAN policy resources (UX 2.0 resources for version 20.15)
- Device templates, feature profiles, and other Catalyst SD-WAN configurations

## Example

```yaml
# Pulumi.yaml provider configuration
config:
  sdwan:url: https://sdwan-manager.example.com
  sdwan:username: admin
  sdwan:password:
    secure: true
```

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as sdwan from "@pulumi/sdwan";

// Use sdwan resources to manage Catalyst SD-WAN configurations
```
