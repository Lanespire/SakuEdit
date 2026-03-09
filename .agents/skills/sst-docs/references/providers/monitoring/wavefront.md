# Wavefront

> Source: https://www.pulumi.com/registry/packages/wavefront
> Package: `wavefront`
> SST Install: `sst add wavefront`

## Overview

The Wavefront provider is used to interact with the Wavefront monitoring service (now VMware Aria Operations for Applications). Wavefront is a high-performance streaming analytics platform for monitoring and observability that enables real-time metrics analysis, alerting, and dashboarding at scale.

## Configuration

### Environment Variables

- `WAVEFRONT_ADDRESS` - URL of your Wavefront cluster (without leading `https://` or trailing `/`)
- `WAVEFRONT_TOKEN` - User Account or Service Account token with necessary permissions

### Pulumi Config

```yaml
config:
  wavefront:address:
    value: 'cluster.wavefront.com'
  wavefront:token:
    value: 'your-wf-token-secret'
```

### Additional Options

- `httpProxy` - Optional proxy configuration (supports `http`, `https`, and `socks5` schemes)

## Key Resources

- **Alert** - Alert rules with condition evaluation and severity levels
- **Dashboard** / **DashboardJson** - Monitoring dashboards
- **DerivedMetric** - Computed metrics from existing data
- **MaintenanceWindow** - Scheduled maintenance windows
- **AlertTarget** - Notification targets for alerts
- **CloudIntegrationAwsExternalId** / **CloudIntegrationGcpBilling** - Cloud integrations
- **User** / **UserGroup** - User management
- **ServiceAccount** - Service account management
- **IngestionPolicy** - Data ingestion policies

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as wavefront from "@pulumi/wavefront";

// Create an alert
const testAlert = new wavefront.Alert("test_alert", {
  name: "High CPU Alert",
  condition: "100-ts(\"cpu.usage_idle\", environment=preprod and cpu=cpu-total ) > 80",
  additionalInformation: "This is an Alert",
  displayExpression: "100-ts(\"cpu.usage_idle\", environment=preprod and cpu=cpu-total )",
  minutes: 5,
  severity: "WARN",
  tags: [
    "env.preprod",
    "cpu.total",
  ],
});
```
