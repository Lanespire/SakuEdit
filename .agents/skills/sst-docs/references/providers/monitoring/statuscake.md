# StatusCake

> Source: https://www.pulumi.com/registry/packages/statuscake
> Package: `@pulumiverse/statuscake`
> SST Install: `sst add @pulumiverse/statuscake`

## Overview

The StatusCake provider for Pulumi enables provisioning of resources in StatusCake. StatusCake is a website monitoring service that provides uptime monitoring, page speed monitoring, SSL monitoring, and domain monitoring. It helps teams ensure their web services are available and performing well. This is a community-maintained provider from pulumiverse.

## Configuration

### Pulumi Config

```bash
pulumi config set statuscake:apiToken <your-api-token> --secret
```

### Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `apiToken` | Yes | StatusCake API token |

### Setup

Obtain your StatusCake API token from your account settings. See the StatusCake API documentation at https://www.statuscake.com/blog/how-to-use-the-statuscake-api/ for details.

## Key Resources

- **UptimeCheck** - Monitor website availability with configurable intervals
- **PageSpeedCheck** - Page speed monitoring
- **SslCheck** - SSL certificate monitoring and expiry alerts
- **ContactGroup** - Contact group management for alert notifications
- **MaintenanceWindow** - Scheduled maintenance windows

## Example

```typescript
import * as statuscake from "@pulumiverse/statuscake";

// Create an uptime check
const uptimeCheck = new statuscake.UptimeCheck("website-monitor", {
  checkInterval: 60,
  monitoredResource: {
    address: "https://www.example.com",
  },
  contactGroups: [],
  confirmationServers: 3,
});

// Create a page speed check
const pageSpeedCheck = new statuscake.PageSpeedCheck("speed-monitor", {
  checkInterval: 300,
  monitoredResource: {
    address: "https://www.example.com",
  },
  alertBigger: 5000,
  region: "US",
});

// Create an SSL check
const sslCheck = new statuscake.SslCheck("ssl-monitor", {
  checkInterval: 86400,
  monitoredResource: {
    address: "https://www.example.com",
  },
  alertAt: [7, 14, 30],
});
```
