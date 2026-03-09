# Koyeb

> Source: https://www.pulumi.com/registry/packages/koyeb
> Package: `@koyeb/pulumi-koyeb`
> SST Install: `sst add @koyeb/pulumi-koyeb`

## Overview

The Koyeb provider allows provisioning cloud resources available in Koyeb through Pulumi. Koyeb is a serverless platform for deploying apps globally. The provider enables infrastructure-as-code management of Koyeb applications, services, domains, and secrets.

## Configuration

Obtain a Koyeb API access token from the Koyeb Control Panel at `app.koyeb.com/account/api`.

**Pulumi.yaml:**
```yaml
config:
  koyeb:token:
    value: YOUR_KOYEB_API_TOKEN
```

**Environment Variable:**
```bash
export KOYEB_TOKEN="your_api_token"
```

## Key Resources

- `koyeb.App` - Create Koyeb applications
- `koyeb.Service` - Define deployable services with region, git, instance, routing, and scaling configuration
- `koyeb.Domain` - Custom domain management
- `koyeb.Secret` - Secrets management

## Example

```typescript
import * as koyeb from "@koyeb/pulumi-koyeb";

const koyebApp = new koyeb.App("sample-app", {
  name: "sample-app",
});

const koyebService = new koyeb.Service("sample-service", {
  appName: koyebApp.name,
  definition: {
    name: "sample-service",
    regions: ["fra"],
    git: {
      repository: "github.com/koyeb/example-golang",
      branch: "main",
    },
    instanceTypes: { type: "micro" },
    routes: [{ path: "/", port: 8080 }],
    ports: [{ port: 8080, protocol: "http" }],
    scalings: { min: 1, max: 1 },
  },
});
```
