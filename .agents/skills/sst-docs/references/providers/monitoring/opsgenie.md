# OpsGenie

> Source: https://www.pulumi.com/registry/packages/opsgenie
> Package: `opsgenie`
> SST Install: `sst add opsgenie`

## Overview

The OpsGenie provider enables interaction with the many resources supported by OpsGenie (an Atlassian product). OpsGenie is an incident management and alerting platform that ensures critical alerts are never missed, enabling teams to respond to incidents efficiently. This provider supports managing teams, users, integrations, routing rules, escalation policies, and more.

## Configuration

### Environment Variables

- `OPSGENIE_API_KEY` - OpsGenie API key (required)

### Pulumi Config

```yaml
config:
  opsgenie:apiKey:
    value: 'your-api-key'
  opsgenie:apiUrl:
    value: 'api.eu.opsgenie.com'
```

### Configuration Options

| Option | Description |
|--------|-------------|
| `apiKey` | API key for OpsGenie (required). Generate via API Integration with Read/Write permissions |
| `apiUrl` | API endpoint URL. Use `api.eu.opsgenie.com` for EU region |

## Key Resources

- **User** - User management
- **Team** - Team creation and configuration
- **TeamRoutingRule** - Alert routing rules for teams
- **EscalationPolicy** / **Escalation** - Escalation policies
- **Schedule** / **ScheduleRotation** - On-call schedules
- **Integration** / **ApiIntegration** / **EmailIntegration** - Integrations
- **NotificationPolicy** / **NotificationRule** - Notification rules
- **Heartbeat** - Service heartbeat monitoring
- **MaintenanceWindow** - Maintenance windows
- **AlertPolicy** - Alert policies

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as opsgenie from "@pulumi/opsgenie";

// Create a team
const engineeringTeam = new opsgenie.Team("engineering", {
  name: "Engineering",
  description: "Engineering on-call team",
});

// Create a user
const user = new opsgenie.User("oncall-user", {
  username: "oncall@example.com",
  fullName: "On-Call Engineer",
  role: "User",
});

// Create an escalation policy
const escalation = new opsgenie.Escalation("default-escalation", {
  name: "Default Escalation",
  ownerTeamId: engineeringTeam.id,
  rules: [{
    condition: "if-not-acked",
    notifyType: "default",
    delay: 5,
    recipients: [{
      type: "user",
      id: user.id,
    }],
  }],
});
```
