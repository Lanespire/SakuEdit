# SignalFx

> Source: https://www.pulumi.com/registry/packages/signalfx
> Package: `signalfx`
> SST Install: `sst add signalfx`

## Overview

The SignalFx provider lets you interact with the resources supported by Splunk Observability Cloud (formerly SignalFx). It enables infrastructure-as-code management of detectors, dashboards, and other monitoring resources for real-time streaming analytics and monitoring at scale.

## Configuration

### Authentication Methods

- Org token
- Session token (via email/password)
- Service account (username/password)

### Pulumi Config

```yaml
config:
  signalfx:authToken:
    value: 'YOUR_AUTH_TOKEN'
  signalfx:apiUrl:
    value: 'https://api.us1.signalfx.com'
```

### Configuration Options

| Option | Description |
|--------|-------------|
| `authToken` | Splunk Observability auth token (required) |
| `apiUrl` | API endpoint URL for your organization |
| `email` | Email for session token creation |
| `password` | Password for session token creation |
| `organizationId` | Required for multi-org accounts |
| `retryMaxAttempts` | Max retry attempts (default: 4) |
| `retryWaitMaxSeconds` | Max retry wait (default: 30) |
| `timeoutSeconds` | Request timeout (default: 120) |
| `tags` | Global tags applied to resources |
| `teams` | Team assignment at provider level |

## Key Resources

- **Detector** - Monitoring alerts and conditions with signal-based rules
- **Dashboard** - Visualization and monitoring displays
- **DashboardGroup** - Dashboard organization
- **TimeChart** / **ListChart** / **HeatmapChart** / **SingleValueChart** - Chart types
- **DataLink** - Link external resources to signals
- **EventFeedChart** - Event feed visualization
- **Team** - Team management
- **OrgToken** / **ApiToken** - Token management

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as signalfx from "@pulumi/signalfx";

// Create a detector
const cpuDetector = new signalfx.Detector("cpu-detector", {
  name: "High CPU Detector",
  programText: `
    signal = data('cpu.utilization').mean(by=['host']).publish('cpu')
    detect(when(signal > 90, lasting='5m')).publish('High CPU')
  `,
  rules: [{
    description: "High CPU usage detected",
    severity: "Critical",
    detectLabel: "High CPU",
    notifications: ["Email,ops@example.com"],
  }],
});

// Create a dashboard
const dashboard = new signalfx.Dashboard("dashboard", {
  name: "Infrastructure Overview",
  dashboardGroup: "my-group-id",
});
```
