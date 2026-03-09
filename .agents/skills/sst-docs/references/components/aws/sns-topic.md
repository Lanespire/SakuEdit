# SnsTopic

> Source: https://sst.dev/docs/component/aws/sns-topic/

## Overview

The `SnsTopic` component integrates Amazon SNS Topics into SST applications. Unlike a `Queue`, topics enable message delivery to multiple subscribers, supporting both standard and FIFO (First-In-First-Out) configurations. Changing a standard topic to a FIFO topic or the other way around will result in the destruction and recreation of the topic.

## Constructor

```typescript
new sst.aws.SnsTopic(name, args?, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args?` (SnsTopicArgs) - Configuration options
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### Optional

#### fifo
- **Type:** `Input<boolean>`
- **Default:** `false`
- **Description:** Enables FIFO topics for strict message ordering. Changing a standard topic to a FIFO topic or vice versa will result in the destruction and recreation of the topic.

#### transform
- **Type:** `Object`
- **Description:** Customize the underlying SNS Topic resource.
  - `topic`: Accepts `TopicArgs` or transformer function

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `arn` | `Output<string>` | The ARN of the SNS Topic |
| `name` | `Output<string>` | The name of the SNS Topic |
| `nodes.topic` | SNS Topic | The underlying Amazon SNS Topic resource |

## Methods

### subscribe(name, subscriber, args?)

Subscribes a Lambda function to the topic.

- `name` (string) - Subscription identifier
- `subscriber` (string | FunctionArgs | ARN) - Handler function path, FunctionArgs object, or Lambda ARN
- `args?` (SnsTopicSubscriberArgs) - Subscription configuration

**Returns:** Subscription resource

### subscribeQueue(name, queue, args?)

Subscribes an SQS Queue to the topic.

- `name` (string) - Subscription identifier
- `queue` (string | Queue) - Queue component or queue ARN
- `args?` (SnsTopicSubscriberArgs) - Subscription configuration

**Returns:** Subscription resource

### static get(name, topicArn, opts?)

References an existing SNS topic by ARN, enabling cross-stage topic sharing without duplication.

**Returns:** `SnsTopic` instance

### static subscribe(name, topicArn, subscriber, args?)

Subscribes a Lambda function to an external SNS topic not created within the application.

**Returns:** Subscription resource

### static subscribeQueue(name, topicArn, queue, args?)

Subscribes an SQS Queue to an external SNS topic.

**Returns:** Subscription resource

## SnsTopicSubscriberArgs

### filter
- **Type:** `Input<Record<string, any>>`
- **Description:** Filters messages by attributes. Supports complex conditions like numeric ranges and negation patterns.

### transform
- **Type:** `Object`
- **Description:** Customizes the underlying resources.
  - `subscription`: Customize the TopicSubscription resource

## Links

When linked to other resources, the SnsTopic exposes:
- `arn` (string) - The SNS Topic's ARN

Access via the SST SDK:
```typescript
import { Resource } from "sst";
console.log(Resource.MyTopic.arn);
```

## Examples

### Create a basic topic
```typescript
const topic = new sst.aws.SnsTopic("MyTopic");
```

### FIFO configuration
```typescript
new sst.aws.SnsTopic("MyTopic", {
  fifo: true
});
```

### Add Lambda subscriber
```typescript
topic.subscribe("MySubscriber", "src/subscriber.handler");
```

### Add Queue subscriber
```typescript
const queue = new sst.aws.Queue("MyQueue");
topic.subscribeQueue("MySubscriber", queue);
```

### Subscribe with filter
```typescript
topic.subscribe("MySubscriber", "src/subscriber.handler", {
  filter: {
    price_usd: [{ numeric: [">=", 100] }]
  }
});
```

### Link and publish
```typescript
const topic = new sst.aws.SnsTopic("MyTopic");
new sst.aws.Nextjs("MyWeb", {
  link: [topic]
});
```

### Publish messages from app code
```typescript
import { Resource } from "sst";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({});
await sns.send(new PublishCommand({
  TopicArn: Resource.MyTopic.arn,
  Message: "Hello from Next.js!"
}));
```

### Cross-stage sharing
```typescript
const topic = $app.stage === "frank"
  ? sst.aws.SnsTopic.get("MyTopic", "arn:aws:sns:us-east-1:123456789012:MyTopic")
  : new sst.aws.SnsTopic("MyTopic");
```

### Subscribe to external topic
```typescript
sst.aws.SnsTopic.subscribe(
  "MySubscriber",
  "arn:aws:sns:us-east-1:123456789012:MyTopic",
  "src/subscriber.handler"
);
```
