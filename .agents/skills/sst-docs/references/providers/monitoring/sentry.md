# Sentry

> Source: https://www.pulumi.com/registry/packages/sentry
> Package: `@pulumiverse/sentry`
> SST Install: `sst add @pulumiverse/sentry`

## Overview

The Sentry provider for Pulumi enables provisioning of Teams and Projects within Sentry's error tracking and performance monitoring platform. Sentry helps developers monitor and fix crashes in real-time, providing detailed error reports, performance insights, and release tracking. This is a community-maintained provider from pulumiverse.

## Configuration

### Pulumi Config

```bash
pulumi config set sentry:token <your-auth-token> --secret
pulumi config set sentry:baseUrl https://sentry.io/api/  # optional, for self-hosted
```

### Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `token` | Yes | Sentry auth token for API access |
| `baseUrl` | No | Custom URL for self-hosted Sentry instances (defaults to Sentry cloud) |

### Setup

Obtain a Sentry Auth token from your Sentry account settings. See Sentry's API authentication documentation for details on token creation.

## Key Resources

- **SentryProject** - Create and manage Sentry projects
- **SentryTeam** - Team management within an organization
- **SentryKey** - DSN key management for projects
- **SentryRule** - Alert rules for projects
- **SentryPlugin** - Plugin configuration for projects
- **SentryOrganization** - Organization-level settings

## Example

```typescript
import * as sentry from "@pulumiverse/sentry";

// Create a team
const team = new sentry.SentryTeam("backend-team", {
  organization: "my-organization",
  name: "Backend Team",
  slug: "backend-team",
});

// Create a project
const project = new sentry.SentryProject("api-project", {
  organization: "my-organization",
  teams: [team.slug],
  name: "API Service",
  slug: "api-service",
  platform: "node",
});

// Create an alert rule
const alertRule = new sentry.SentryRule("error-alert", {
  organization: "my-organization",
  project: project.slug,
  name: "High Error Rate",
  actionMatch: "any",
  frequency: 300,
  actions: [{
    id: "sentry.mail.actions.NotifyEmailAction",
    targetType: "Team",
    targetIdentifier: team.id,
  }],
  conditions: [{
    id: "sentry.rules.conditions.first_seen_event.FirstSeenEventCondition",
  }],
});
```
