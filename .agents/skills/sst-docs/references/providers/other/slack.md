# Slack

> Source: https://www.pulumi.com/registry/packages/slack
> Package: `slack`
> SST Install: `sst add slack`

## Overview

The Slack provider allows interaction with Slack resources through Pulumi. It enables infrastructure-as-code management of Slack workspace elements including channels, user groups, and user lookups.

## Configuration

**Pulumi.yaml:**
```yaml
config:
  slack:token:
    value: YOUR_SLACK_TOKEN
```

**Environment Variable:**
```bash
export SLACK_TOKEN="xoxb-your-token"
```

**Configuration Variables:**
- `token` (String, required) - Slack API token (env: `SLACK_TOKEN`)

## Key Resources

- `slack.Conversation` - Create and manage Slack channels
- `slack.Usergroup` - Create and manage user groups
- `slack.GetUser` - Query existing Slack users (data source)

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as slack from "@pulumi/slack";

const testUser = slack.getUser({
  name: "contact_test-user",
});

const myGroup = new slack.Usergroup("my_group", {
  name: "TestGroup",
  handle: "test",
  description: "Test user group",
  users: [testUser.then(u => u.id)],
});

const myChannel = new slack.Conversation("my-channel", {
  name: "my-channel",
  topic: "The topic for my channel",
  permanentMembers: myGroup.users,
  isPrivate: true,
});
```
