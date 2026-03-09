# Doppler

> Source: https://www.pulumi.com/registry/packages/doppler
> Package: `@pulumiverse/doppler`
> SST Install: `sst add @pulumiverse/doppler`

## Overview

The Doppler provider enables provisioning and management of Doppler secrets management resources through Pulumi. Doppler is a universal secrets manager that centralizes secrets management across applications, environments, and infrastructure.

## Configuration

Configuration details are available in the Doppler provider installation and configuration section. The provider typically requires a Doppler API token.

**Pulumi.yaml:**
```yaml
config:
  doppler:dopplerToken:
    value: YOUR_DOPPLER_TOKEN
```

**Environment Variable:**
```bash
export DOPPLER_TOKEN="dp.st.your_token"
```

## Key Resources

- `doppler.Project` - Manage Doppler projects
- `doppler.Environment` - Manage environments within projects
- `doppler.Secret` - Manage individual secrets
- `doppler.ServiceToken` - Create service tokens for access
- `doppler.Integration` - Configure third-party integrations
- `doppler.SyncedSecret` - Sync secrets to external platforms

## Example

```typescript
import * as doppler from "@pulumiverse/doppler";

const project = new doppler.Project("my-project", {
  name: "my-app",
  description: "My application secrets",
});
```
