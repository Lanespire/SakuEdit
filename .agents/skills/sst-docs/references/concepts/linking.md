# Resource Linking

> Source: https://sst.dev/docs/linking/

## Overview

Resource Linking enables typesafe, secure access to infrastructure within runtime code. The process involves three core steps:

1. **Create a resource** (e.g., an S3 bucket)
2. **Link it** to functions or frontends via the `link` property
3. **Access it** at runtime using the SDK with full type safety

### Working Locally

Local development requires `sst dev`. The default multiplexer mode automatically starts your frontend and loads linked resources. Alternative basic mode requires wrapping your dev command:

```bash
sst dev next dev
sst dev remix dev
sst dev astro dev
```

## How It Works

### Three-Step Process

When linking a resource, SST:

1. Injects exposed links into the function/frontend package
2. Generates TypeScript type definitions
3. Grants necessary permissions automatically

### Injecting Links

**Functions**: Links are bundled via esbuild, encrypted, and placed in `globalThis`. The SST SDK decrypts them synchronously on load.

**Frontends**: Links inject into `process.env` with the `SST_RESOURCE_` prefix. These are server-side only and unavailable in client components.

### Generating Types

SST creates two `sst-env.d.ts` files:

- Root project file covering all linked resources
- Per-package file referencing the root file

These can be committed to version control.

## Basic Usage Example

**Configuration:**

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Nextjs("MyWeb", { link: [bucket] });
```

**Runtime Access:**

```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

The SDK supports JavaScript, TypeScript, Python, Golang, and Rust.

## Extending Linking

### Link Custom Values

Use `sst.Linkable` for custom properties:

```typescript
const myLinkable = new sst.Linkable("MyLinkable", {
  properties: { foo: "bar" }
});
```

Then link and access:

```typescript
new sst.aws.Function("MyApi", {
  handler: "src/lambda.handler",
  link: [myLinkable]
});
```

### Link External Resources

Wrap any resource class using `Linkable.wrap`:

```typescript
Linkable.wrap(aws.dynamodb.Table, (table) => ({
  properties: { tableName: table.name }
}));
```

### Override Built-In Links

Customize SST component permissions:

```typescript
sst.Linkable.wrap(sst.aws.Bucket, (bucket) => ({
  properties: { name: bucket.name },
  include: [
    sst.aws.permission({
      actions: ["s3:GetObject"],
      resources: [bucket.arn]
    })
  ]
}));
```
