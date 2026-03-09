# Gandi

> Source: https://www.pulumi.com/registry/packages/gandi
> Package: `@pulumiverse/gandi`
> SST Install: `sst add @pulumiverse/gandi`

## Overview

The Gandi provider enables management of domain and hosting services through Pulumi. It supports purchasing and management of DNS zones, LiveDNS service, Email, and SimpleHosting resources on the Gandi platform.

## Configuration

The provider requires authentication via a Personal Access Token.

**Pulumi.yaml:**
```yaml
config:
  gandi:personalAccessToken:
    value: MY_PERSONAL_ACCESS_TOKEN
```

**Environment Variable:**
```bash
export GANDI_PERSONAL_ACCESS_TOKEN="your_token"
```

**Configuration Variables:**
- `personalAccessToken` (String, required) - Personal Access Token for authentication

Note: Hard-coding credentials into Pulumi configuration is not recommended. Use environment variables or secrets management.

## Key Resources

- `gandi.domains.Domain` - Domain registration and management
- `gandi.livedns.Record` - LiveDNS record management
- `gandi.simplehosting.Instance` - SimpleHosting instances
- `gandi.email.Forwarding` - Email forwarding configuration

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as gandi from "@pulumiverse/gandi";

const exampleCom = new gandi.domains.Domain("example_com", {
  name: "example.com",
});
```
