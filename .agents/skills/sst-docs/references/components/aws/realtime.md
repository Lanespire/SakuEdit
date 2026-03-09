# Realtime

> Source: https://sst.dev/docs/component/aws/realtime/

## Overview

The `Realtime` component enables real-time publish-subscribe messaging using AWS IoT with WebSocket support. It uses topic-based messaging for both browser and server communication, with an SDK for client authorization and topic permissions.

**Important:** IoT resources are account-wide and shared across all apps/stages. Topics must be prefixed with app and stage names to avoid collisions.

## Constructor

```typescript
new sst.aws.Realtime(name, args, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args` (RealtimeArgs) - Configuration object (required)
- `opts?` (ComponentResourceOptions) - Pulumi options

## Props

### Required

#### authorizer
- **Type:** `Input<string | FunctionArgs>`
- **Description:** Lambda function that authorizes client connections and grants topic permissions.

### Optional

#### transform
- **Type:** `Object`
- **Description:** Transform underlying resource creation.
  - `authorizer`: Customize IoT authorizer resource via `AuthorizerArgs` or callback function

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `authorizer` | `Output<string>` | Name of the created IoT authorizer |
| `endpoint` | `Output<string>` | IoT endpoint URL for client connections |
| `nodes.authHandler` | `Output<Function>` | Authorizer Lambda function |
| `nodes.authorizer` | `Authorizer` | IoT authorizer resource |

## Methods

### subscribe(subscriber, args)

Subscribes a Lambda function to Realtime messages.

- `subscriber` - `Input<string | FunctionArgs | "arn:aws:lambda:${string}">` - Handler function or ARN
- `args` - `RealtimeSubscriberArgs` - Subscription configuration

**Returns:** `Output<RealtimeLambdaSubscriber>`

#### RealtimeSubscriberArgs

##### filter (required)
- **Type:** `Input<string>`
- **Description:** MQTT topic filter pattern for messages. Must include app and stage prefix.

##### transform
- **Type:** `Object`
- **Description:** Customize underlying resources.
  - `topicRule`: Customize IoT Topic Rule resource

## SDK: realtime.authorizer()

Creates an authorization handler for validating connections and granting permissions.

```typescript
realtime.authorizer(callback: (token: string) => Promise<AuthResult>)
```

**Returns:** `IoTCustomAuthorizerHandler`

### AuthResult Type

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `subscribe` | `string[]` | Required | Topics client can subscribe to; supports wildcards |
| `publish` | `string[]` | Required | Topics client can publish to; supports wildcards |
| `principalId?` | `string` | - | Client identifier (user ID, username, etc.); alphanumeric, 1-128 chars |
| `policyDocuments?` | `PolicyDocument[]` | - | Additional IoT Core policies (max 10, 2048 chars each) |
| `disconnectAfterInSeconds?` | `number` | `86400` | Connection duration limit (300-86400 seconds) |
| `refreshAfterInSeconds?` | `number` | - | Policy refresh interval (300-86400 seconds) |

## Links

When linked to other resources, the Realtime exposes:
- `authorizer` (string) - IoT authorizer name
- `endpoint` (string) - IoT endpoint URL

Access via the SST SDK:
```typescript
import { Resource } from "sst";
console.log(Resource.MyRealtime.endpoint);
console.log(Resource.MyRealtime.authorizer);
```

## Examples

### Basic setup with authorizer
```typescript
const server = new sst.aws.Realtime("MyRealtime", {
  authorizer: "src/authorizer.handler"
});
```

### Authorizer handler implementation
```typescript
import { realtime } from "sst/aws/realtime";
import { Resource } from "sst";

export const handler = realtime.authorizer(async (token) => {
  // Validate token
  return {
    subscribe: [`${Resource.App.name}/${Resource.App.stage}/chat/room1`],
    publish: [`${Resource.App.name}/${Resource.App.stage}/chat/room1`]
  };
});
```

### Subscribe to specific topic
```typescript
server.subscribe("src/subscriber.handler", {
  filter: `${$app.name}/${$app.stage}/chat/room1`
});
```

### Subscribe with wildcard
```typescript
server.subscribe("src/subscriber.handler", {
  filter: `${$app.name}/${$app.stage}/chat/#`
});
```

### Subscribe with custom function configuration
```typescript
server.subscribe(
  {
    handler: "src/subscriber.handler",
    timeout: "60 seconds"
  },
  {
    filter: `${$app.name}/${$app.stage}/chat/room1`
  }
);
```

### Subscribe with external Lambda ARN
```typescript
server.subscribe("arn:aws:lambda:us-east-1:123456789012:function:my-function", {
  filter: `${$app.name}/${$app.stage}/chat/room1`
});
```

### Frontend client usage
```typescript
const client = new mqtt.MqttClient();
const connection = client.new_connection(config);

connection.on("message", (topic, payload) => {
  // Handle message
});

connection.publish(topic, payload, mqtt.QoS.AtLeastOnce);
```

### Backend publication
```typescript
import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane";
import { Resource } from "sst";

const data = new IoTDataPlaneClient();
await data.send(
  new PublishCommand({
    payload: Buffer.from(JSON.stringify({ message: "Hello world" })),
    topic: `${Resource.App.name}/${Resource.App.stage}/chat/room1`
  })
);
```
