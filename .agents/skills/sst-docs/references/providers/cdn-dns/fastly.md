# Fastly

> Source: https://www.pulumi.com/registry/packages/fastly
> Package: `fastly`
> SST Install: `sst add fastly`

## Overview

The Fastly provider enables interaction with Fastly's content delivery network (CDN). It allows infrastructure-as-code management of Fastly CDN services, VCL configurations, and edge computing resources. An active Fastly account is required.

## Configuration

Authentication is supported via static configuration or environment variables (prioritized in this order):

**Pulumi.yaml:**
```yaml
config:
  fastly:apiKey:
    value: your_api_key
```

**Environment Variable:**
```bash
export FASTLY_API_KEY="your_api_key"
```

**Configuration Variables:**
- `apiKey` (String) - Fastly API Key from account dashboard
- `baseUrl` (String) - Fastly API endpoint URL
- `forceHttp2` (Boolean) - Disable HTTP/1.x fallback (default: `false`)
- `noAuth` (Boolean) - Set `true` for unauthenticated functions

Personal API tokens: https://manage.fastly.com/account/personal/tokens

## Key Resources

- `fastly.ServiceVcl` - Manage VCL-based CDN services
- `fastly.ServiceCompute` - Manage Compute@Edge services
- `fastly.TlsCertificate` - TLS certificate management
- `fastly.TlsSubscription` - Managed TLS subscriptions

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as fastly from "@pulumi/fastly";

const myservice = new fastly.ServiceVcl("myservice", {
  name: "myawesometestservice",
});
```
