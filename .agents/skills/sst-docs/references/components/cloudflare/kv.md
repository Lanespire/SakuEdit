# Kv

> Source: https://sst.dev/docs/component/cloudflare/kv/

## Overview

The `Kv` component integrates Cloudflare KV storage namespaces into SST applications, providing globally distributed key-value storage capabilities through Cloudflare's infrastructure.

## Constructor

```typescript
new Kv(name, args?, opts?)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Component identifier |
| `args` | `KvArgs` | No | Configuration options |
| `opts` | `ComponentResourceOptions` | No | Pulumi resource options |

## KvArgs (Constructor Props)

### transform

- **Type:** `Object`
- **Required:** No
- **Description:** Optional transformation for underlying resources.

| Sub-property | Type | Description |
|--------------|------|-------------|
| `namespace` | `WorkersKvNamespaceArgs \| (args, opts, name) => void` | Customize the KV namespace resource creation |

```typescript
const storage = new sst.cloudflare.Kv("MyStorage", {
  transform: {
    namespace: {
      title: "my-custom-namespace"
    }
  }
});
```

## Properties

### id

- **Type:** `Output<string>`
- **Description:** The generated identifier for the KV namespace.

### nodes

- **Type:** `Object`
- **Description:** The underlying Pulumi resources.

| Sub-property | Type | Description |
|--------------|------|-------------|
| `namespace` | `WorkersKvNamespace` | The Cloudflare KV namespace resource |

## SDK Integration

### Links

Accessible through the `Resource` object from the `sst` package:

- `id` (`string`) - The KV namespace identifier

### Bindings

When linked to a worker, the KV storage becomes accessible through the Cloudflare KV runtime API. You can perform operations like `get`, `put`, `delete`, and `list` on keys.

```typescript
import { Resource } from "sst";

// Get a value
const value = await Resource.MyStorage.get("someKey");

// Put a value
await Resource.MyStorage.put("someKey", "someValue");

// Delete a value
await Resource.MyStorage.delete("someKey");

// List keys
const keys = await Resource.MyStorage.list();
```

## Examples

### Basic Setup

```typescript
const storage = new sst.cloudflare.Kv("MyStorage");
```

### Link to a Worker

```typescript
const storage = new sst.cloudflare.Kv("MyStorage");

new sst.cloudflare.Worker("MyWorker", {
  handler: "./index.ts",
  link: [storage],
  url: true
});
```

### Accessing KV in Worker Code

```typescript
import { Resource } from "sst";

export default {
  async fetch(request) {
    // Read from KV
    const value = await Resource.MyStorage.get("someKey");

    return new Response(value);
  }
};
```
