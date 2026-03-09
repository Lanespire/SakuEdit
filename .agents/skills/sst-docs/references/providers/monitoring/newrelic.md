# New Relic

> Source: https://www.pulumi.com/registry/packages/newrelic
> Package: `newrelic`
> SST Install: `sst add newrelic`

## Overview

The New Relic provider enables infrastructure-as-code management of monitoring and observability resources. New Relic offers tools that help you fix problems quickly, maintain complex systems, improve your code, and accelerate your digital transformation. This provider supports managing alerts, dashboards, synthetic monitors, cloud integrations, and data management rules.

## Configuration

### Environment Variables

- `NEW_RELIC_ACCOUNT_ID` - Your New Relic account ID (required)
- `NEW_RELIC_API_KEY` - Personal API key prefixed with "NRAK" (required)
- `NEW_RELIC_REGION` - Data center region: `US` or `EU` (defaults to `US`)

### Pulumi Config

```yaml
config:
  newrelic:accountId:
    value: 'your-account-id'
  newrelic:apiKey:
    value: 'NRAK-xxxxxxxxxx'
  newrelic:region:
    value: 'US'
```

### Additional Options

- `insecureSkipVerify` - Trust self-signed SSL certificates
- `insightsInsertKey` - For Insights event ingestion
- `cacertFile` - Path to PEM-encoded certificate authority

## Key Resources

- **AlertPolicy** - Alert policy grouping conditions
- **NrqlAlertCondition** - NRQL-based alert conditions
- **AlertChannel** - Notification channels (email, Slack, webhook)
- **AlertMutingRule** - Muting rules for suppressing alerts
- **OneDashboard** / **OneDashboardJson** - Dashboards
- **Monitor** / **ScriptMonitor** / **StepMonitor** - Synthetic monitoring
- **PrivateLocation** - Private locations for synthetics
- **DataPartitionRule** / **LogParsingRule** - Log data management
- **NrqlDropRule** / **ObfuscationRule** - Data retention management
- **User** / **Group** / **ApiAccessKey** - Access management

## Example

```typescript
import * as newrelic from "@pulumi/newrelic";

// Create an alert policy
const alert = new newrelic.AlertPolicy("alert", {
  name: "Your Concise Alert Name",
});

// Add NRQL-based condition
const condition = new newrelic.NrqlAlertCondition("foo", {
  policyId: alert.id.apply(id => parseInt(id)),
  type: "static",
  enabled: true,
  nrql: {
    query: "SELECT average(duration) FROM Transaction",
  },
  critical: {
    operator: "above",
    threshold: 5.5,
    thresholdDuration: 300,
    thresholdOccurrences: "ALL",
  },
});

// Create notification channel
const email = new newrelic.AlertChannel("email", {
  type: "email",
  config: {
    recipients: "user@example.com",
    includeJsonAttachment: "true",
  },
});

// Link channel to policy
const link = new newrelic.AlertPolicyChannel("alert_email", {
  policyId: alert.id.apply(id => parseInt(id)),
  channelIds: [email.id.apply(id => parseInt(id))],
});
```
