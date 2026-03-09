# KinesisStream

> Source: https://sst.dev/docs/component/aws/kinesis-stream/

## Overview

The `KinesisStream` component integrates Amazon Kinesis Data Streams into SST applications, enabling real-time data streaming capabilities.

## Constructor

```typescript
new sst.aws.KinesisStream(name, args?, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args?` (KinesisStreamArgs) - Configuration options
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### transform?
- **Type:** `Object`
- Resource transformation options.
- Sub-properties:
  - `stream?` - Accepts `StreamArgs` or a function transforming `StreamArgs` to modify the underlying Kinesis stream resource

## Properties

### arn
- **Type:** `Output<string>`
- The stream's Amazon Resource Name.

### name
- **Type:** `Output<string>`
- The stream's name identifier.

### nodes
- `stream` - The underlying AWS Kinesis Stream resource

## Methods

### subscribe(name, subscriber, args?)

```typescript
subscribe(name: string, subscriber: Input<string | FunctionArgs>, args?: KinesisStreamLambdaSubscriberArgs): Output<KinesisStreamLambdaSubscriber>
```

Attaches a Lambda function to process stream events.

**KinesisStreamLambdaSubscriberArgs:**
- `filters?` (Input<Record<string, any>[]>) - Filters events using JSON matching logic (up to 5 policies, ORed together). Supports `data` property for event field filtering.
- `transform?` (Object):
  - `eventSourceMapping?` - Modifies the Lambda Event Source Mapping resource

### static subscribe(name, streamArn, subscriber, args?)

```typescript
static subscribe(name: string, streamArn: Input<string>, subscriber: Input<string | FunctionArgs>, args?: KinesisStreamLambdaSubscriberArgs): Output<KinesisStreamLambdaSubscriber>
```

Subscribes to external Kinesis streams by ARN. Useful when subscribing to streams not created within the current SST app.

## Links

When linked, the `KinesisStream` component exposes the following through the SDK `Resource` object:
- `name` (string) - The stream name identifier

## Examples

### Minimal setup
```typescript
const stream = new sst.aws.KinesisStream("MyStream");
```

### With subscription
```typescript
stream.subscribe("MySubscriber", "src/subscriber.handler");
```

### Linking to resources
```typescript
new sst.aws.Nextjs("MyWeb", {
  link: [stream]
});
```

### Writing to stream (runtime code)
```typescript
import { Resource } from "sst";
import { KinesisClient, PutRecordCommand } from "@aws-sdk/client-kinesis";

const client = new KinesisClient();

await client.send(new PutRecordCommand({
  StreamName: Resource.MyStream.name,
  Data: Buffer.from(JSON.stringify({ hello: "world" })),
  PartitionKey: "1"
}));
```

### Filtered subscription
```typescript
stream.subscribe("MySubscriber", "src/subscriber.handler", {
  filters: [
    {
      data: {
        order: {
          type: ["buy"]
        }
      }
    }
  ]
});
```

### Subscribe to external stream
```typescript
sst.aws.KinesisStream.subscribe("MySubscriber", "arn:aws:kinesis:us-east-1:123456789:stream/MyExternalStream", "src/subscriber.handler");
```

### With transform
```typescript
new sst.aws.KinesisStream("MyStream", {
  transform: {
    stream: {
      shardCount: 2,
      retentionPeriod: 48
    }
  }
});
```
