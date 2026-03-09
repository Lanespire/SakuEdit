# Worker

> Source: https://sst.dev/docs/component/cloudflare/worker/

## Overview

The `Worker` component enables creation of Cloudflare Workers within SST infrastructure. It facilitates HTTP-invokable serverless functions with resource linking, custom domains, and static asset support.

## Constructor

```typescript
new Worker(name, args, opts?)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Component identifier |
| `args` | `WorkerArgs` | Yes | Configuration object |
| `opts` | `ComponentResourceOptions` | No | Pulumi resource options |

## WorkerArgs (Constructor Props)

### handler

- **Type:** `Input<string>`
- **Required:** Yes
- **Description:** Path to handler file relative to repository root or `sst.config.ts`.

```typescript
{
  handler: "packages/functions/src/worker.ts"
}
```

### url

- **Type:** `Input<boolean>`
- **Default:** `false`
- **Description:** Enables a dedicated HTTP endpoint for worker invocation.

```typescript
{
  handler: "src/worker.handler",
  url: true
}
```

### domain

- **Type:** `Input<string>`
- **Required:** No
- **Description:** Custom domain assignment for the worker. The domain must be hosted on Cloudflare.

```typescript
{
  handler: "src/worker.handler",
  domain: "api.example.com"
}
```

### link

- **Type:** `Input<any[]>`
- **Required:** No
- **Description:** Array of resources to link. Enables credential management and SDK access within the worker.

```typescript
{
  handler: "src/worker.handler",
  link: [bucket, database]
}
```

### environment

- **Type:** `Input<Record<string, Input<string>>>`
- **Required:** No
- **Description:** Key-value environment variables accessible via `env.<key>` in worker code.

```typescript
{
  handler: "src/worker.handler",
  environment: {
    API_KEY: "my-api-key",
    DEBUG: "true"
  }
}
```

### build

- **Type:** `Input<Object>`
- **Required:** No
- **Description:** Build configuration options.

| Sub-property | Type | Default | Description |
|--------------|------|---------|-------------|
| `minify` | `boolean` | `true` | Toggle code minification |
| `banner` | `string` | - | Prepend string to generated JS |
| `esbuild` | `BuildOptions` | - | Custom esbuild configuration |
| `loader` | `Record<string, Loader>` | - | File extension handlers (e.g., `.png: "file"`) |
| `install` | `string[]` | - | NPM packages to install for the build |

```typescript
{
  handler: "src/worker.handler",
  build: {
    minify: false,
    install: ["pg"],
    loader: { ".png": "file" }
  }
}
```

### assets

- **Type:** `Input<Object>`
- **Required:** No
- **Description:** Static assets configuration for Cloudflare Workers static assets binding.

| Sub-property | Type | Description |
|--------------|------|-------------|
| `directory` | `Input<string>` | Directory path containing static assets |

```typescript
{
  handler: "src/worker.handler",
  assets: {
    directory: "./public"
  }
}
```

### transform

- **Type:** `Object`
- **Required:** No
- **Description:** Customize underlying resource creation.

| Sub-property | Type | Description |
|--------------|------|-------------|
| `worker` | `WorkersScriptArgs \| (args, opts, name) => void` | Customize the underlying WorkersScript resource |

## Properties

### nodes

- **Type:** `Object`
- **Description:** The underlying Pulumi resources.

| Sub-property | Type | Description |
|--------------|------|-------------|
| `worker` | `WorkersScript` | The Cloudflare Worker script resource |

### url

- **Type:** `Output<undefined | string>`
- **Description:** The Worker URL endpoint. Only available if `url: true` is set in configuration.

## SDK Integration

### Links

Accessible through the `Resource` object from the `sst` package:

- `url` (`undefined | string`) - Worker endpoint URL

### Bindings (Service Bindings)

When linking workers to each other, automatic service bindings enable inter-worker communication without requiring public URLs:

```typescript
// In another worker that has linked to WorkerB
await Resource.WorkerB.fetch(request);
```

Service bindings allow cross-worker calls without public URLs.

## Examples

### Minimal Configuration

```typescript
new sst.cloudflare.Worker("MyWorker", {
  handler: "src/worker.handler"
});
```

### With URL Enabled

```typescript
new sst.cloudflare.Worker("MyWorker", {
  handler: "src/worker.handler",
  url: true
});
```

### With Linked Resources

```typescript
const bucket = new sst.aws.Bucket("MyBucket");

new sst.cloudflare.Worker("MyWorker", {
  handler: "src/worker.handler",
  link: [bucket]
});
```

### Custom Build Configuration

```typescript
new sst.cloudflare.Worker("MyWorker", {
  handler: "src/worker.handler",
  build: {
    install: ["pg"]
  }
});
```

### Accessing Linked Resources in Worker Code

```typescript
import { Resource } from "sst";

export default {
  async fetch(request) {
    console.log(Resource.MyBucket.name);
    // Use the linked resource...
  }
};
```

### Linking Workers Together (Service Bindings)

```typescript
const workerB = new sst.cloudflare.Worker("WorkerB", {
  handler: "src/workerB.handler"
});

new sst.cloudflare.Worker("WorkerA", {
  handler: "src/workerA.handler",
  link: [workerB]
});
```

In WorkerA's handler:

```typescript
import { Resource } from "sst";

export default {
  async fetch(request) {
    const response = await Resource.WorkerB.fetch(request);
    return response;
  }
};
```
