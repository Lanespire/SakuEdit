# Cisco ISE (Identity Services Engine)

> Source: https://www.pulumi.com/registry/packages/ise/
> Package: `ise`
> SST Install: `sst add ise`

## Overview

The ISE provider facilitates interaction with Cisco ISE (Identity Services Engine) instances through REST API communication. It supports both ERS and Open API endpoints and has been tested with ISE versions 3.2.0 Patch 4, 3.3.0, and 3.4.0.

## Configuration

Required settings:

- **url** - URL of the Cisco ISE instance (env: `ISE_URL`)
- **username** - Username for the ISE instance (env: `ISE_USERNAME`)
- **password** - Password for the ISE instance (env: `ISE_PASSWORD`, sensitive)

Optional:
- `insecure` - Allow insecure HTTPS (default: true)
- `retries` - REST API call retries (default: 3)

## Key Resources

- Identity management resources (users, groups, endpoints)
- Network access policies
- Device administration resources
- Refer to API Docs for the full resource list

## Example

```yaml
# Pulumi.yaml provider configuration
config:
  ise:url: https://10.1.1.1
  ise:username: admin
  ise:password:
    secure: true
```

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as ise from "@pulumi/ise";

// Use ISE resources to manage identity services
```
