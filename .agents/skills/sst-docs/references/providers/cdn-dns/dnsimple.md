# DNSimple

> Source: https://www.pulumi.com/registry/packages/dnsimple
> Package: `dnsimple`
> SST Install: `sst add dnsimple`

## Overview

The DNSimple provider allows management of DNS records, domains, certificates, and other DNSimple resources using Pulumi. It enables teams to version control and review DNS infrastructure alongside other cloud resources.

## Configuration

Two mandatory settings are required:

**Pulumi.yaml:**
```yaml
config:
  dnsimple:token:
    value: YOUR_API_TOKEN
  dnsimple:account:
    value: YOUR_ACCOUNT_ID
```

**Environment Variables:**
```bash
export DNSIMPLE_TOKEN="your_api_token"
export DNSIMPLE_ACCOUNT="your_account_id"
```

**Configuration Variables:**
- `token` (String, required) - API v2 token (Account tokens recommended over User tokens)
- `account` (String, required) - Account ID associated with token
- `sandbox` (Boolean, optional) - Enable sandbox mode for testing
- `prefetch` (Boolean, optional) - Handle API rate limits for large zone configurations

## Key Resources

- `dnsimple.Zone` - DNS zone management
- `dnsimple.ZoneRecord` - Individual DNS records (A, CNAME, MX, etc.)
- `dnsimple.Contact` - Registrant contact information
- `dnsimple.RegisteredDomain` - Domain registration and management

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as dnsimple from "@pulumi/dnsimple";

const example = new dnsimple.Zone("example", { name: "example.com" });

const www = new dnsimple.ZoneRecord("www", {
  zoneName: example.name,
  name: "www",
  value: "192.0.2.1",
  type: "A",
  ttl: 3600,
});
```
