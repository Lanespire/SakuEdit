# NS1

> Source: https://www.pulumi.com/registry/packages/ns1
> Package: `ns1`
> SST Install: `sst add ns1`

## Overview

The NS1 provider exposes resources to interact with the NS1 REST API. NS1 is a managed DNS and traffic management platform. The provider requires proper API credentials and appropriate permissions for the resources being managed.

## Configuration

**Pulumi.yaml:**
```yaml
config:
  ns1:apikey:
    value: YOUR_NS1_API_KEY
```

**Environment Variables:**
```bash
export NS1_APIKEY="your_api_key"
```

**Configuration Variables:**
- `apikey` (String, required) - NS1 API token (env: `NS1_APIKEY`)
- `retryMax` (Number, optional) - Number of retries for 50x errors (default: 3)
- `endpoint` (String, optional) - Custom API endpoint (env: `NS1_ENDPOINT`)
- `ignoreSsl` (Boolean, optional) - SSL verification setting (env: `NS1_IGNORE_SSL`)
- `rateLimitParallelism` (Number, optional) - Rate limiting strategy (recommended: 60)

## Key Resources

- `ns1.Zone` - DNS zone management
- `ns1.Record` - DNS record management
- `ns1.Team` - Team configuration
- `ns1.MonitoringJob` - Monitoring job configuration
- `ns1.DataSource` - Data source for intelligent DNS

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as ns1 from "@pulumi/ns1";

const foobar = new ns1.Zone("foobar", {
  zone: "example.com",
});
```
