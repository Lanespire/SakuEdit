# PagerDuty

> Source: https://www.pulumi.com/registry/packages/pagerduty
> Package: `pagerduty`
> SST Install: `sst add pagerduty`

## Overview

The PagerDuty provider enables infrastructure-as-code management of PagerDuty resources. PagerDuty is an incident management platform that provides reliable notifications, automatic escalations, on-call scheduling, and other functionality to help teams detect and address unplanned work in real-time.

## Configuration

### Environment Variables

- `PAGERDUTY_TOKEN` - v2 authorization token (required)
- `PAGERDUTY_USER_TOKEN` - v2 user-level authorization token
- `PAGERDUTY_SERVICE_REGION` - Service region (empty for US, or `eu`)
- `PAGERDUTY_CLIENT_ID` - OAuth client identifier
- `PAGERDUTY_CLIENT_SECRET` - OAuth client secret
- `PAGERDUTY_SUBDOMAIN` - PagerDuty account subdomain

### Pulumi Config

```yaml
config:
  pagerduty:token:
    value: 'your-api-token'
  pagerduty:serviceRegion:
    value: 'us'
```

### Additional Options

- `useAppOauthScopedToken` - App OAuth configuration
- `skipCredentialsValidation` - Skip token validation
- `apiUrlOverride` - Custom proxy endpoint
- `insecureTls` - Disable TLS certificate checking

## Key Resources

- **Team** - Team management
- **User** - User provisioning
- **TeamMembership** - Team-user associations
- **Service** - Service definitions
- **EscalationPolicy** - Escalation policies
- **Schedule** - On-call schedules
- **RulesetRule** / **EventRule** - Event routing rules
- **BusinessService** - Business service definitions
- **ServiceIntegration** - Service integrations
- **MaintenanceWindow** - Maintenance windows
- **ResponsePlay** - Automated incident response

## Example

```typescript
import * as pagerduty from "@pulumi/pagerduty";

// Create a team
const engineering = new pagerduty.Team("engineering", {
  name: "Engineering",
  description: "All engineering",
});

// Create a user
const earline = new pagerduty.User("earline", {
  name: "Earline Greenholt",
  email: "earline@example.com",
});

// Assign user to team
const membership = new pagerduty.TeamMembership("earline_engineering", {
  userId: earline.id,
  teamId: engineering.id,
  role: "manager",
});

// Create an escalation policy
const escalation = new pagerduty.EscalationPolicy("default", {
  name: "Default Escalation",
  numLoops: 2,
  rules: [{
    escalationDelayInMinutes: 10,
    targets: [{
      type: "user_reference",
      id: earline.id,
    }],
  }],
});

// Create a service
const service = new pagerduty.Service("my-service", {
  name: "My Application",
  escalationPolicy: escalation.id,
  alertCreation: "create_alerts_and_incidents",
});
```
