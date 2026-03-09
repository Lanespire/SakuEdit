# Bus

> Source: https://sst.dev/docs/component/aws/bus/

## Overview

The `Bus` component integrates Amazon EventBridge Event Bus into SST applications, enabling event-driven architectures through publish-subscribe patterns.

## Constructor

```typescript
new sst.aws.Bus(name, args?, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args?` (BusArgs) - Configuration options
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### Optional

#### transform
- **Type:** `Object`
- **Description:** Allows customization of the underlying EventBus resource.
  - `bus`: Customize EventBus resource via `EventBusArgs` or callback function

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `arn` | `Output<string>` | The ARN of the EventBus |
| `name` | `Output<string>` | The EventBus name used for publishing messages |
| `nodes.bus` | EventBus | The underlying Amazon EventBus resource |

## Methods

### subscribe(name, subscriber, args?)

Attaches a Lambda function as an event subscriber.

- `name` (string) - Subscription identifier
- `subscriber` (string | FunctionArgs | ARN) - Handler function reference
- `args?` (BusSubscriberArgs) - Subscription configuration

**Returns:** `Output<BusLambdaSubscriber>`

### subscribeQueue(name, queue, args?)

Connects an SQS queue as an event subscriber.

- `name` (string) - Subscription identifier
- `queue` (string | Queue) - Queue reference or ARN
- `args?` (BusSubscriberArgs) - Subscription configuration

**Returns:** `Output<BusQueueSubscriber>`

### static get(name, busName, opts?)

References an existing EventBus by name for cross-stage sharing.

**Returns:** `Bus` instance

### static subscribe(name, busArn, subscriber, args?)

Subscribes a Lambda function to an external EventBus.

**Returns:** `Output<BusLambdaSubscriber>`

### static subscribeQueue(name, busArn, queue, args?)

Subscribes an SQS queue to an external EventBus.

**Returns:** `Output<BusQueueSubscriber>`

## BusSubscriberArgs

### pattern
- **Type:** `Object`
- **Description:** Filters events matching specific criteria. Properties:
  - `source` - Event source filter
  - `detailType` - Event detail type filter
  - `detail` - Event detail filter with support for numeric, prefix, and other matchers

### transform
- **Type:** `Object`
- **Description:** Customizes underlying `EventRule` and `EventTarget` resources.

## Links

When linked to other resources, the Bus exposes:
- `arn` (string) - EventBus ARN
- `name` (string) - EventBus name

Access via the SST SDK:
```typescript
import { Resource } from "sst";
console.log(Resource.MyBus.name);
console.log(Resource.MyBus.arn);
```

## Examples

### Create a bus
```typescript
const bus = new sst.aws.Bus("MyBus");
```

### Subscribe with Lambda function
```typescript
bus.subscribe("MySubscriber", "src/subscriber.handler");
```

### Subscribe with SQS queue
```typescript
const queue = new sst.aws.Queue("MyQueue");
bus.subscribeQueue("MySubscription", queue);
```

### Subscribe with pattern filter
```typescript
bus.subscribe("MySubscriber", "src/subscriber.handler", {
  pattern: {
    detail: {
      price_usd: [{ numeric: [">=", 100] }]
    }
  }
});
```

### Link to Next.js app and publish events
```typescript
const bus = new sst.aws.Bus("MyBus");
new sst.aws.Nextjs("MyWeb", {
  link: [bus]
});
```

### Publish events from app code
```typescript
import { Resource } from "sst";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const eb = new EventBridgeClient({});
await eb.send(new PutEventsCommand({
  Entries: [{
    EventBusName: Resource.MyBus.name,
    Source: "my.source",
    DetailType: "MyEvent",
    Detail: JSON.stringify({ foo: "bar" })
  }]
}));
```

### Cross-stage bus sharing
```typescript
const bus = $app.stage === "frank"
  ? sst.aws.Bus.get("MyBus", "app-dev-MyBus")
  : new sst.aws.Bus("MyBus");
```

### Subscribe to external bus
```typescript
sst.aws.Bus.subscribe(
  "MySubscriber",
  "arn:aws:events:us-east-1:123456789012:event-bus/MyBus",
  "src/subscriber.handler"
);
```
