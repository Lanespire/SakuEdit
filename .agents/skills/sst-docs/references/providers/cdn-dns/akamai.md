# Akamai

> Source: https://www.pulumi.com/registry/packages/akamai
> Package: `akamai`
> SST Install: `sst add akamai`

## Overview

The Akamai provider enables provisioning of cloud resources available through Akamai's platform. It provides infrastructure-as-code management of Akamai CDN properties, edge hostnames, DNS zones, and security configurations including application security and Bot Manager.

## Configuration

Configuration details are available in the Akamai provider installation and configuration section. The provider typically uses Akamai EdgeGrid credentials for authentication.

**Common environment variables:**
```bash
export AKAMAI_CLIENT_SECRET="your_client_secret"
export AKAMAI_HOST="your_host"
export AKAMAI_ACCESS_TOKEN="your_access_token"
export AKAMAI_CLIENT_TOKEN="your_client_token"
```

## Key Resources

- `akamai.properties.EdgeHostName` - Create and manage edge hostnames
- `akamai.Property` - CDN property configuration
- `akamai.DnsZone` - DNS zone management
- `akamai.AppSecConfiguration` - Application security configuration
- `akamai.GtmDomain` - Global Traffic Management domains

## Example

```typescript
import * as akamai from "@pulumi/akamai";

const contractId = akamai.getContract().then(x => x.id);
const groupId = akamai.getGroup().then(x => x.id);

const tsdomain = new akamai.properties.EdgeHostName("test", {
  contract: contractId,
  group: groupId,
  product: "prd_Fresca",
  edgeHostname: "test-ts.mycompany.io",
  ipv4: true,
});
```
