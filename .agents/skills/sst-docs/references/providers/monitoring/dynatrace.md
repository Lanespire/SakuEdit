# Dynatrace

> Source: https://www.pulumi.com/registry/packages/dynatrace
> Package: `@pulumiverse/dynatrace`
> SST Install: `sst add @pulumiverse/dynatrace`

## Overview

The Dynatrace provider enables provisioning of cloud resources available in Dynatrace through Pulumi infrastructure as code. Dynatrace is an AI-powered, full-stack, automated performance management platform that provides application performance monitoring (APM), infrastructure monitoring, digital experience monitoring, and AIOps. This is a community-maintained provider from pulumiverse.

## Configuration

### Environment Variables

Configuration via environment variables is available but specific variable names are not yet documented in the Pulumi registry. Refer to the [GitHub repository](https://github.com/pulumiverse/pulumi-dynatrace) for the latest configuration details.

### Pulumi Config

```bash
pulumi config set dynatrace:dtEnvUrl <your-environment-url>
pulumi config set dynatrace:dtApiToken <your-api-token> --secret
```

### Common Configuration Options

| Option | Description |
|--------|-------------|
| `dtEnvUrl` | Dynatrace environment URL (e.g., `https://abc12345.live.dynatrace.com`) |
| `dtApiToken` | Dynatrace API token with appropriate scopes |

### Setup

Create an API token in your Dynatrace environment with the necessary scopes for the resources you want to manage. See the Dynatrace API token documentation for details.

## Key Resources

- **AlertingProfile** - Alerting profile configurations
- **ManagementZone** - Management zone definitions
- **Dashboard** / **DashboardSharing** - Dashboard management
- **Notification** - Notification integrations
- **AutoTag** - Automatic tagging rules
- **RequestAttribute** - Request attribute configuration
- **CustomService** - Custom service definitions
- **MaintenanceWindow** - Maintenance windows
- **SloV2** - Service Level Objectives
- **MetricEvents** - Metric event definitions
- **WebApplication** - Web application monitoring settings
- **ApplicationDetection** - Application detection rules

## Example

```typescript
import * as dynatrace from "@pulumiverse/dynatrace";

// Create a management zone
const zone = new dynatrace.ManagementZone("prod-zone", {
  name: "Production",
});

// Create an alerting profile
const alertProfile = new dynatrace.AlertingProfile("critical-alerts", {
  displayName: "Critical Alerts",
  mzId: "",
});

// Create a notification
const slackNotification = new dynatrace.Notification("slack-notify", {
  alertingProfile: alertProfile.id,
  active: true,
  name: "Slack Notification",
  config: {
    slack: {
      url: "https://hooks.slack.com/services/xxx/yyy/zzz",
      channel: "#alerts",
      title: "Dynatrace Alert",
    },
  },
});
```
