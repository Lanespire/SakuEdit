# OpenControl

> Source: https://sst.dev/docs/component/aws/opencontrol/

## Overview

The `OpenControl` component deploys an OpenControl server to AWS Lambda, enabling AI-powered agent functionality. Currently in **beta**.

## Constructor

```typescript
new sst.aws.OpenControl(name, args, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args` (OpenControlArgs) - Configuration object (required)
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### server
- **Type:** `Input<string | FunctionArgs>`
- **Required**
- Specifies the function running your OpenControl server.
- Can be a simple string path or full `FunctionArgs` object with additional configuration (like linking resources, setting policies, etc.).

## Properties

### url
- **Type:** `Output<string>`
- The endpoint URL for the OpenControl server.

### password
- **Type:** `Output<string>`
- Authentication password for the OpenControl server.

### nodes
- `server` (Output<Function>) - The underlying Function component

## Methods

No additional public methods. The component primarily provides an OpenControl server endpoint.

## SDK Tools

The `sst/opencontrol` package provides SST-specific OpenControl tools:
- Resource listing capability
- AWS account access tools

Import and add to your server configuration for SST resource integration.

## Links

When linked, the `OpenControl` component exposes the following through the SDK `Resource` object:
- `url` (string) - The OpenControl server endpoint URL
- `password` (string) - Authentication password

## Examples

### Basic setup
```typescript
const server = new sst.aws.OpenControl("MyServer", {
  server: "src/server.handler"
});
```

### With linked resources
```typescript
const bucket = new sst.aws.Bucket("MyBucket");

new sst.aws.OpenControl("MyServer", {
  server: {
    handler: "src/server.handler",
    link: [bucket]
  }
});
```

### With AWS permissions
```typescript
new sst.aws.OpenControl("OpenControl", {
  server: {
    handler: "src/server.handler",
    policies: $dev
      ? ["arn:aws:iam::aws:policy/AdministratorAccess"]
      : ["arn:aws:iam::aws:policy/ReadOnlyAccess"]
  }
});
```

### Server implementation example
```typescript
import { handle } from "hono/aws-lambda";
import { Hono } from "hono";
import { opencontrol } from "sst/opencontrol";

const app = new Hono();

// Configure OpenControl with custom tools
app.route("/", opencontrol({
  tools: [
    // Add your custom tools here
  ]
}));

export const handler = handle(app);
```
