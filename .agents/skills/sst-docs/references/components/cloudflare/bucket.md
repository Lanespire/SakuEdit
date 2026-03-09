# Bucket

> Source: https://sst.dev/docs/component/cloudflare/bucket/

## Overview

The `Bucket` component integrates Cloudflare R2 object storage into SST applications, providing S3-compatible object storage capabilities through Cloudflare's infrastructure. R2 offers zero egress fees for stored data.

## Constructor

```typescript
new Bucket(name, args?, opts?)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Component identifier |
| `args` | `BucketArgs` | No | Configuration options |
| `opts` | `ComponentResourceOptions` | No | Pulumi resource options |

## BucketArgs (Constructor Props)

### transform

- **Type:** `Object`
- **Required:** No
- **Description:** Customizes resource creation behavior.

| Sub-property | Type | Description |
|--------------|------|-------------|
| `bucket` | `R2BucketArgs \| (args, opts, name) => void` | Customize the R2 Bucket resource creation |

```typescript
const bucket = new sst.cloudflare.Bucket("MyBucket", {
  transform: {
    bucket: {
      // Custom R2 bucket args
    }
  }
});
```

## Properties

### name

- **Type:** `Output<string>`
- **Description:** The generated name of the R2 Bucket.

### nodes

- **Type:** `Object`
- **Description:** The underlying Pulumi resources.

| Sub-property | Type | Description |
|--------------|------|-------------|
| `bucket` | `R2Bucket` | The Cloudflare R2 Bucket resource |

## SDK Integration

### Links

Accessible through the `Resource` object from the `sst` package:

- `name` (`string`) - The generated R2 Bucket name

### Bindings

When linked to a worker, the bucket becomes accessible through the Cloudflare R2 runtime API. You can perform operations like `put`, `get`, `delete`, `list`, and `head` on objects.

```typescript
import { Resource } from "sst";

// List objects
const objects = await Resource.MyBucket.list();

// Put an object
await Resource.MyBucket.put("my-file.txt", "file contents");

// Get an object
const object = await Resource.MyBucket.get("my-file.txt");

// Delete an object
await Resource.MyBucket.delete("my-file.txt");

// Head (metadata only)
const head = await Resource.MyBucket.head("my-file.txt");
```

## Examples

### Basic Setup

```typescript
const bucket = new sst.cloudflare.Bucket("MyBucket");
```

### Link to a Worker

```typescript
const bucket = new sst.cloudflare.Bucket("MyBucket");

new sst.cloudflare.Worker("MyWorker", {
  handler: "./index.ts",
  link: [bucket],
  url: true
});
```

### Accessing R2 Bucket in Worker Code

```typescript
import { Resource } from "sst";

export default {
  async fetch(request) {
    // List all objects in the bucket
    const objects = await Resource.MyBucket.list();

    return new Response(JSON.stringify(objects));
  }
};
```

### Uploading and Retrieving Objects

```typescript
import { Resource } from "sst";

export default {
  async fetch(request) {
    // Upload an object
    await Resource.MyBucket.put("hello.txt", "Hello, World!");

    // Retrieve the object
    const object = await Resource.MyBucket.get("hello.txt");
    const text = await object.text();

    return new Response(text);
  }
};
```
