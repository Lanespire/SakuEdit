# Datadog

> Source: https://www.pulumi.com/registry/packages/datadog
> Package: `datadog`
> SST Install: `sst add datadog`

## Overview

The Datadog provider is used to interact with the resources supported by Datadog. Datadog is a monitoring and analytics platform that provides full-stack observability, including infrastructure monitoring, APM, log management, and more. This provider enables you to manage Datadog resources such as monitors, dashboards, SLOs, and alerting configurations through infrastructure as code.

## Configuration

### Environment Variables

- `DD_API_KEY` - Datadog API key (required)
- `DD_APP_KEY` - Datadog APP key (required)
- `DD_HOST` - API endpoint URL (defaults to `https://api.datadoghq.com`)

### Pulumi Config

```yaml
config:
  datadog:apiKey:
    value: 'your-api-key'
  datadog:appKey:
    value: 'your-app-key'
  datadog:apiUrl:
    value: 'https://api.datadoghq.com'
```

### Additional Options

- `validate` - Controls API key validation during initialization
- `defaultTags` - Tags applied across resources (experimental)
- `httpClientRetryEnabled` - Enable HTTP retry
- `httpClientRetryMaxRetries` - Max retry attempts
- `httpClientRetryTimeout` - Retry timeout in seconds

## Key Resources

- **Monitor** - Create and manage Datadog monitors (metric, log, APM, etc.)
- **Dashboard** / **DashboardJson** - Build monitoring dashboards
- **ServiceLevelObjective** - Define and track SLOs
- **SyntheticsTest** - API and browser synthetic tests
- **MetricMetadata** - Manage metric metadata
- **LogsCustomPipeline** - Log processing pipelines
- **SecurityMonitoringRule** - Security monitoring rules
- **Downtime** - Schedule maintenance windows
- **IntegrationAws** / **IntegrationGcp** / **IntegrationAzure** - Cloud integrations
- **Role** / **User** - Access management

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as datadog from "@pulumi/datadog";

// Create a monitor
const cpuMonitor = new datadog.Monitor("cpu-monitor", {
  name: "High CPU Usage",
  type: "metric alert",
  message: "CPU usage is too high @pagerduty",
  query: "avg(last_5m):avg:system.cpu.user{*} > 90",
  monitorThresholds: {
    critical: "90",
    warning: "80",
  },
  tags: ["env:production", "team:infra"],
});

// Create a dashboard
const dashboard = new datadog.Dashboard("main-dashboard", {
  title: "Infrastructure Overview",
  layoutType: "ordered",
  widgets: [{
    groupDefinition: {
      title: "CPU Metrics",
      layoutType: "ordered",
    },
  }],
});
```
