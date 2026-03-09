# Email

> Source: https://sst.dev/docs/component/aws/email/

## Overview

The `Email` component enables sending emails through Amazon Simple Email Service (SES). It supports sending from verified email addresses or domains, with automatic DNS verification for supported adapters.

**Important:** New AWS SES accounts operate in sandbox mode, limiting sends to verified addresses only. Request production access to remove restrictions.

## Constructor

```typescript
new sst.aws.Email(name, args, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args` (EmailArgs) - Configuration object (required)
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### Required

#### sender
- **Type:** `Input<string>`
- **Description:** Email address or domain name for sending. You'll need to verify the email address or domain you are using.
  - Examples: `"john.smith@gmail.com"` or `"example.com"`

### Optional

#### dmarc
- **Type:** `Input<string>`
- **Default:** `"v=DMARC1; p=none;"`
- **Description:** DMARC policy for domain-based senders only. Creates corresponding DNS record.

#### dns
- **Type:** `Input<false | DNS adapter>`
- **Default:** `sst.aws.dns`
- **Description:** DNS adapter for automatic verification. Supports AWS, Cloudflare, or Vercel DNS adapters. Set to `false` for manual DNS configuration.

#### events
- **Type:** `Input<Object[]>`
- **Description:** Configures SES event notifications. Each event object contains:
  - `name` - Event identifier
  - `types` - Array of event types: `"send"`, `"bounce"`, `"complaint"`, `"delivery"`, `"open"`, `"click"`, etc.
  - `topic?` - SNS topic ARN
  - `bus?` - EventBridge bus ARN

#### transform
- **Type:** `Object`
- **Description:** Transform underlying resources.
  - `configurationSet`: Transform SES configuration set resource
  - `identity`: Transform SES identity resource

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `configSet` | `Output<string>` | Name of the SES configuration set |
| `sender` | `Output<string>` | The verified email address or domain name |
| `nodes.configurationSet` | ConfigurationSet | The underlying AWS ConfigurationSet resource |
| `nodes.identity` | EmailIdentity | The underlying AWS EmailIdentity resource |

## Methods

### static get(name, sender, opts?)

References existing SES identity instead of creating new one. Useful for sharing Email components across stages.

**Returns:** `Email` instance

## Links

When linked to other resources, the Email exposes:
- `configSet` (string) - Configuration set name
- `sender` (string) - Sender email/domain

Access via the SST SDK:
```typescript
import { Resource } from "sst";
console.log(Resource.MyEmail.sender);
console.log(Resource.MyEmail.configSet);
```

## Examples

### Basic email address setup
```typescript
const email = new sst.aws.Email("MyEmail", {
  sender: "spongebob@example.com"
});
```

### Domain-based sending
```typescript
new sst.aws.Email("MyEmail", {
  sender: "example.com"
});
```

### With DMARC configuration
```typescript
new sst.aws.Email("MyEmail", {
  sender: "example.com",
  dmarc: "v=DMARC1; p=quarantine; adkim=s; aspf=s;"
});
```

### Linking to a function
```typescript
const email = new sst.aws.Email("MyEmail", {
  sender: "spongebob@example.com"
});

new sst.aws.Function("MyApi", {
  handler: "sender.handler",
  link: [email]
});
```

### Sending emails via SESv2
```typescript
import { Resource } from "sst";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const client = new SESv2Client();
await client.send(new SendEmailCommand({
  FromEmailAddress: Resource.MyEmail.sender,
  Destination: {
    ToAddresses: ["patrick@example.com"]
  },
  Content: {
    Simple: {
      Subject: { Data: "Hello World!" },
      Body: { Text: { Data: "Sent from my SST app." } }
    }
  }
}));
```

### Event notification configuration
```typescript
new sst.aws.Email("MyEmail", {
  sender: "example.com",
  events: [{
    name: "OnBounce",
    types: ["bounce"],
    topic: "arn:aws:sns:us-east-1:123456789012:MyTopic"
  }]
});
```

### Cloudflare DNS integration
```typescript
new sst.aws.Email("MyEmail", {
  sender: "example.com",
  dns: sst.cloudflare.dns()
});
```

### Sharing across stages
```typescript
const email = $app.stage === "frank"
  ? sst.aws.Email.get("MyEmail", "spongebob@example.com")
  : new sst.aws.Email("MyEmail", {
      sender: "spongebob@example.com"
    });
```
