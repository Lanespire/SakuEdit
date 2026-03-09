# Checkly

> Source: https://www.pulumi.com/registry/packages/checkly
> Package: `@checkly/pulumi`
> SST Install: `sst add @checkly/pulumi`

## Overview

The Checkly provider for Pulumi can be used to provision any of the monitoring resources available in Checkly. Checkly is an active monitoring platform that provides API monitoring, browser checks, and synthetic monitoring for modern web applications. It enables you to monitor API endpoints and website flows to catch issues before your users do.

## Configuration

### Environment Variables

- `CHECKLY_ACCOUNT_ID` - Your Checkly account ID (required)
- `CHECKLY_API_KEY` - Your Checkly API key (required)
- `CHECKLY_API_URL` - Custom API endpoint (optional, for internal development)

### Pulumi Config

```bash
pulumi config set checkly:accountId YOUR_CHECKLY_ACCOUNT_ID
pulumi config set checkly:apiKey YOUR_CHECKLY_API_KEY --secret
```

### Setup

Create API keys at https://app.checklyhq.com/settings/user/api-keys. Follow the Checkly Pulumi integration guide at https://checklyhq.com/docs/integrations/pulumi/ for detailed setup.

## Key Resources

- **Check** - API and browser monitoring checks
- **CheckGroup** - Group checks with shared settings
- **AlertChannel** - Notification channels (email, Slack, webhook, SMS)
- **Snippet** - Reusable code snippets for checks
- **Dashboard** - Public status dashboards
- **MaintenanceWindow** - Scheduled maintenance windows
- **PrivateLocation** - Private locations for running checks
- **EnvironmentVariable** - Global environment variables for checks

## Example

```typescript
import * as checkly from "@checkly/pulumi";

// Create an API check
const apiCheck = new checkly.Check("api-check", {
  activated: true,
  frequency: 10,
  type: "API",
  request: {
    method: "GET",
    url: "https://api.example.com/health",
    assertions: [{
      source: "STATUS_CODE",
      comparison: "EQUALS",
      target: "200",
    }],
  },
  locations: ["us-east-1", "eu-west-1"],
});

// Create a browser check
const browserCheck = new checkly.Check("browser-check", {
  activated: true,
  frequency: 10,
  type: "BROWSER",
  script: `
    const { expect, test } = require('@playwright/test');
    test('Homepage loads', async ({ page }) => {
      await page.goto('https://example.com');
      await expect(page).toHaveTitle(/Example/);
    });
  `,
  locations: ["us-east-1"],
});

// Create an alert channel
const slackAlert = new checkly.AlertChannel("slack-alert", {
  slack: {
    channel: "#alerts",
    url: "https://hooks.slack.com/services/xxx/yyy/zzz",
  },
});
```
