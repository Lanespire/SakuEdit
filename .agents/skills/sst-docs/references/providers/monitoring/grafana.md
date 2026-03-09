# Grafana

> Source: https://www.pulumi.com/registry/packages/grafana
> Package: `@pulumiverse/grafana`
> SST Install: `sst add @pulumiverse/grafana`

## Overview

The Grafana provider enables provisioning of cloud resources available in Grafana Cloud or self-hosted Grafana instances through Pulumi infrastructure as code. It supports managing Grafana Cloud stacks, dashboards, folders, data sources, alerting rules, service accounts, and more. This is a community-maintained provider from pulumiverse.

## Configuration

### Environment Variables

- `GRAFANA_CLOUD_ACCESS_POLICY_TOKEN` - Grafana Cloud access policy token
- `GRAFANA_URL` - The URL of your Grafana instance
- `GRAFANA_AUTH` - Authentication credentials (service account token or basic auth)

### Pulumi Config

```bash
pulumi config set grafana:url <your-grafana-url>
pulumi config set grafana:auth <your-auth-token> --secret
pulumi config set grafana:cloudAccessPolicyToken <your-token> --secret
```

## Key Resources

- **grafana.cloud.Stack** - Create and manage Grafana Cloud stacks
- **grafana.cloud.StackServiceAccount** - Manage service accounts for stacks
- **grafana.cloud.StackServiceAccountToken** - Generate authentication tokens
- **grafana.oss.Folder** - Create folders for organizing content
- **grafana.oss.Dashboard** - Manage dashboards
- **grafana.oss.DataSource** - Configure data sources
- **grafana.alerting.RuleGroup** - Alerting rule groups
- **grafana.alerting.ContactPoint** - Alert contact points
- **grafana.alerting.NotificationPolicy** - Notification routing policies
- **grafana.ServiceAccount** - General service account management

## Example

```typescript
import * as grafana from "@pulumiverse/grafana";

// Create a Grafana Cloud stack
const stack = new grafana.cloud.Stack("stack", {
  name: "my-stack",
  slug: "my-stack",
  regionSlug: "us",
});

// Create a service account for the stack
const serviceAccount = new grafana.cloud.StackServiceAccount("sa", {
  stackSlug: stack.slug,
  name: "Service account",
  role: "Admin",
});

// Create a service account token
const token = new grafana.cloud.StackServiceAccountToken("token", {
  stackSlug: stack.slug,
  serviceAccountId: serviceAccount.serviceAccountId,
  name: "Token",
});

// Create a folder using the service account provider
const folder = new grafana.oss.Folder("folder", {
  title: "My Folder",
});
```
