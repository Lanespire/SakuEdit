# Prodvana

> Source: https://www.pulumi.com/registry/packages/prodvana
> Package: `@prodvana/pulumi-prodvana`
> SST Install: `sst add @prodvana/pulumi-prodvana`

## Overview

The Prodvana provider allows provisioning of resources within your Prodvana organization. It enables management of Runtimes, Applications, and Release Channels through infrastructure as code for continuous delivery workflows.

## Configuration

The provider must be configured with credentials to manage the resources in your Prodvana organization. Refer to the installation & configuration page for setup details.

## Key Resources

- **Application** - Create and manage applications within Prodvana
- **Runtime** - Manage deployment runtimes
- **ReleaseChannel** - Configure release channels for deployment pipelines

## Example

```typescript
import * as prodvana from "@prodvana/pulumi-prodvana";

const app = new prodvana.Application("my-app", {
  name: "my-app",
});
```
