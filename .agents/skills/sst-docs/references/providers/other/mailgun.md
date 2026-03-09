# Mailgun

> Source: https://www.pulumi.com/registry/packages/mailgun
> Package: `mailgun`
> SST Install: `sst add mailgun`

## Overview

The Mailgun provider is used to interact with the resources supported by Mailgun. It enables infrastructure-as-code management of Mailgun email services, domains, routes, and credentials through Pulumi.

## Configuration

**Pulumi.yaml:**
```yaml
config:
  mailgun:apiKey:
    value: YOUR_MAILGUN_API_KEY
```

**Environment Variable:**
```bash
export MAILGUN_API_KEY="your_api_key"
```

**Configuration Variables:**
- `apiKey` (String, required) - Mailgun API key

## Key Resources

- `mailgun.Domain` - Email domain management
- `mailgun.Route` - Email routing rules
- `mailgun.DomainCredential` - SMTP credentials for domains
- `mailgun.Webhook` - Webhook configuration for events

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as mailgun from "@pulumi/mailgun";

const myDomain = new mailgun.Domain("my-domain", {
  name: "mail.example.com",
  spamAction: "disabled",
  dkimKeySize: 1024,
});
```
