# Queue

> Source: https://sst.dev/docs/component/aws/queue/

## Overview

The `Queue` component adds a serverless queue to applications using Amazon SQS. It supports standard and FIFO queue modes with configurable subscribers.

## Constructor

```typescript
new sst.aws.Queue(name, args?, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args?` (QueueArgs) - Configuration object
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### Optional

#### delay
- **Type:** `Input<string>` (duration)
- **Default:** `"0 seconds"`
- **Range:** 0-900 seconds
- **Description:** The period of time which the delivery of all messages in the queue is delayed.

#### fifo
- **Type:** `Input<boolean | Object>`
- **Default:** `false`
- **Description:** FIFO (first-in-first-out) queues are designed to guarantee that messages are processed exactly once.
  - When `Object`: `contentBasedDeduplication` (boolean) - enables content-based deduplication

#### visibilityTimeout
- **Type:** `Input<string>` (duration)
- **Default:** `"30 seconds"`
- **Range:** 0-12 hours
- **Description:** Visibility timeout is a period of time during which a message is temporarily invisible to other consumers.

#### dlq
- **Type:** `Input<string | Object>`
- **Description:** Dead-letter queue configuration.
  - When `string`: ARN of the DLQ
  - When `Object`:
    - `queue`: ARN string of the DLQ
    - `retry`: number (default: 3) - max receive count before sending to DLQ

#### transform
- **Type:** `Object`
- **Description:** Resource transformation.
  - `queue`: Customize underlying SQS Queue creation

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `url` | `Output<string>` | The SQS Queue URL |
| `arn` | `Output<string>` | The ARN of the SQS Queue |
| `nodes.queue` | AWS Queue resource | The Amazon SQS Queue underlying resource |

## Methods

### subscribe(subscriber, args?, opts?)

Subscribes a function to queue messages.

- `subscriber` - Function path, FunctionArgs, or Lambda ARN
- `args?` - `QueueSubscriberArgs`:
  - `batch.size` (`Input<number>`, default: 10, range: 1-10000) - Maximum events per invocation
  - `batch.window` (`Input<string>`, default: `"0 seconds"`, range: 0-300 seconds) - Maximum wait time for collecting events
  - `batch.partialResponses` (`Input<boolean>`, default: `false`) - Whether to return partial successful responses
  - `filters` (`Input<Record<string, any>>[]`, max 5) - Filter records processed by subscriber
  - `transform.eventSourceMapping` - Transform Lambda Event Source Mapping resource
- **Returns:** `Output<QueueLambdaSubscriber>`

### static get(name, queueUrl, opts?)

References existing SQS Queue by URL. Enables sharing queues across deployment stages.

**Returns:** `Queue` instance

### static subscribe(queueArn, subscriber, args?, opts?)

Subscribes to external SQS Queue by ARN.

**Returns:** `Output<QueueLambdaSubscriber>`

## Links

When linked to other resources, the Queue exposes:
- `url` (string) - The SQS Queue URL

Access via the SST SDK:
```typescript
import { Resource } from "sst";
console.log(Resource.MyQueue.url);
```

## Examples

### Create queue
```typescript
const queue = new sst.aws.Queue("MyQueue");
```

### FIFO queue
```typescript
new sst.aws.Queue("MyQueue", {
  fifo: true
});
```

### Add subscriber
```typescript
queue.subscribe("src/subscriber.handler");
```

### Link to Next.js app
```typescript
const queue = new sst.aws.Queue("MyQueue");
new sst.aws.Nextjs("MyWeb", {
  link: [queue]
});
```

### Send message from linked resource
```typescript
import { Resource } from "sst";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});
await sqs.send(new SendMessageCommand({
  QueueUrl: Resource.MyQueue.url,
  MessageBody: "Hello from Next.js!"
}));
```

### Subscribe with filters
```typescript
queue.subscribe("src/subscriber.handler", {
  filters: [
    { body: { RequestCode: ["BBBB"] } }
  ]
});
```

### Subscribe with batch configuration
```typescript
queue.subscribe("src/subscriber.handler", {
  batch: {
    size: 5,
    window: "20 seconds",
    partialResponses: true
  }
});
```

### Dead-letter queue
```typescript
const dlq = new sst.aws.Queue("MyDLQ");
new sst.aws.Queue("MyQueue", {
  dlq: {
    queue: dlq.arn,
    retry: 5
  }
});
```

### Reference existing queue
```typescript
const queue = sst.aws.Queue.get(
  "MyQueue",
  "https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue"
);
```

### Subscribe to external queue
```typescript
sst.aws.Queue.subscribe(
  "arn:aws:sqs:us-east-1:123456789012:MyQueue",
  "src/subscriber.handler"
);
```
