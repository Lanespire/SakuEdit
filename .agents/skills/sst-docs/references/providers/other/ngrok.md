# ngrok

> Source: https://www.pulumi.com/registry/packages/ngrok
> Package: `@pierskarsenbarg/ngrok`
> SST Install: `sst add @pierskarsenbarg/ngrok`

## Overview

The ngrok provider for Pulumi can be used to provision any of the cloud resources available in ngrok. It enables infrastructure-as-code management of ngrok tunnels, API keys, domains, and other cloud services through Pulumi.

## Configuration

The provider requires ngrok API credentials. Configuration details are available in the installation and configuration section of the Pulumi registry.

**Pulumi.yaml:**
```yaml
config:
  ngrok:apiKey:
    value: YOUR_NGROK_API_KEY
```

## Key Resources

- `ngrok.ApiKey` - Manage ngrok API keys
- `ngrok.ReservedDomain` - Reserve custom domains
- `ngrok.ReservedAddr` - Reserve TCP addresses
- `ngrok.TlsCertificate` - TLS certificate management
- `ngrok.EventSubscription` - Event subscription configuration

## Example

```typescript
import * as ngrok from "@pierskarsenbarg/ngrok";

const apikey = new ngrok.ApiKey("apikey", {
  description: "My API key managed by Pulumi",
});
```
