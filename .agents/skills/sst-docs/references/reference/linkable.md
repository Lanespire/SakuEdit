# Linkable Component

> Source: https://sst.dev/docs/component/linkable/

## Overview

The `Linkable` component enables linking any resources in your app beyond built-in SST components, and permits modification of how SST creates links.

## Constructor

```typescript
new Linkable(name, definition)
```

**Parameters:**

- **name** (`string`) - The name of the linkable resource
- **definition** (`Definition`) - The linkable definition object

## Properties

### name

**Type:** `Output<string>`

### properties

**Type:** `Record<string, any>`

## Methods

### static wrap

```typescript
Linkable.wrap(cls, cb)
```

**Parameters:**

- **cls** (`Constructor`): The resource class to wrap
- **cb** (`(resource: Resource) => Definition`): Callback returning the linkable definition

**Returns:** `void`

This method modifies a resource class prototype to make it linkable. Behind the scenes this modifies the prototype of the given class.

## Definition Interface

### include? (Optional)

**Type:** `(sst.aws.permission | sst.cloudflare.binding)[]`

Specifies permissions or bindings for the linked resource. Examples include AWS permissions and Cloudflare bindings configuration.

### properties (Required)

**Type:** `Record<string, any>`

Defines runtime-accessible values -- outputs from other resources or constants.

## Usage Examples

### Creating a Simple Linkable

```typescript
new sst.Linkable("MyLinkable", {
  properties: { foo: "bar" }
});
```

### Combining Multiple Resources

```typescript
const storage = new sst.Linkable("MyStorage", {
  properties: {
    foo: "bar",
    bucketA: bucketA.name,
    bucketB: bucketB.name
  },
  include: [
    sst.aws.permission({
      actions: ["s3:*"],
      resources: [bucketA.arn, bucketB.arn]
    })
  ]
});
```

### Linking to a Function

```typescript
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  link: [storage]
});
```

Then access in runtime:

```typescript
import { Resource } from "sst";
console.log(Resource.MyStorage.foo);
console.log(Resource.MyStorage.bucketA);
console.log(Resource.MyStorage.bucketB);
```

### Wrapping Pulumi Resources

```typescript
sst.Linkable.wrap(aws.dynamodb.Table, (table) => ({
  properties: { tableName: table.name },
  include: [
    sst.aws.permission({
      actions: ["dynamodb:*"],
      resources: [table.arn]
    })
  ]
}));
```

After wrapping, you can use the Pulumi resource directly in `link`:

```typescript
const table = new aws.dynamodb.Table("MyTable", { ... });

new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  link: [table]
});
```

### Modifying Built-in Links

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

This overrides the default permissions SST grants when linking a bucket, restricting it to only `s3:GetObject` instead of full access.
