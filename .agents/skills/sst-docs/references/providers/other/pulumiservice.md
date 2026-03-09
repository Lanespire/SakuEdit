# Pulumi Cloud (Pulumi Service)

> Source: https://www.pulumi.com/registry/packages/pulumiservice
> Package: `pulumiservice`
> SST Install: `sst add pulumiservice`

## Overview

The Pulumi Service provider enables provisioning of resources available in Pulumi Cloud. It allows infrastructure-as-code management of Pulumi Cloud features such as webhooks, teams, access tokens, and stack tags. The provider must be configured with credentials to deploy and update Pulumi Cloud resources. Currently in preview status.

## Configuration

Configuration details are available in the Pulumi Service provider installation and configuration section. The provider uses Pulumi Cloud credentials for authentication.

**Pulumi.yaml:**
```yaml
config:
  pulumiservice:accessToken:
    value: YOUR_PULUMI_ACCESS_TOKEN
```

## Key Resources

- `pulumiservice.Webhook` - Create webhooks for Pulumi Cloud events
- `pulumiservice.Team` - Manage teams in Pulumi Cloud organizations
- `pulumiservice.TeamStackPermission` - Stack-level team permissions
- `pulumiservice.StackTag` - Manage stack tags
- `pulumiservice.DeploymentSettings` - Configure Pulumi Deployments

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as pulumiservice from "@pulumi/pulumiservice";

const webhook = new pulumiservice.Webhook("example-webhook", {
  active: true,
  displayName: "webhook example",
  organizationName: "example",
  payloadUrl: "https://example.com/webhook",
});
```
