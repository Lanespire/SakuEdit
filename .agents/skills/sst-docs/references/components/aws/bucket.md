# Bucket

> Source: https://sst.dev/docs/component/aws/bucket/

## Overview

The `Bucket` component integrates AWS S3 storage into SST applications, enabling file storage with configurable access controls, CORS, versioning, and event notifications.

## Constructor

```typescript
new sst.aws.Bucket(name, args?, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args?` (BucketArgs) - Configuration options
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### Optional

#### access
- **Type:** `"public"` | `"cloudfront"`
- **Default:** `undefined`
- **Description:** Enables public read access or CloudFront-only access to bucket files.

#### cors
- **Type:** `boolean | Object`
- **Default:** `true`
- **Description:** Controls cross-origin resource sharing. When enabled (default), includes:
  - `allowHeaders`: `["*"]`
  - `allowMethods`: `["DELETE", "GET", "HEAD", "POST", "PUT"]`
  - `allowOrigins`: `["*"]`
  - `exposeHeaders`: `[]`
  - `maxAge`: `"0 seconds"`

#### enforceHttps
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Blocks HTTP requests via bucket policy conditions.

#### versioning
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enables multiple object versions to prevent accidental deletion.

#### policy
- **Type:** `Object[]`
- **Description:** Custom IAM policy statements. Each statement supports:
  - `actions`: IAM action strings (e.g., `"s3:*"`)
  - `principals`: Wildcard (`"*"`) or principal objects with `type` and `identifiers`
  - `effect?`: `"allow"` or `"deny"`
  - `paths?`: S3 object paths (defaults to `["", "*"]`)
  - `conditions?`: Arrays with `test`, `variable`, and `values`

#### transform
- **Type:** `Object`
- **Description:** Customizes underlying Pulumi resource creation.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `arn` | `Output<string>` | S3 bucket ARN |
| `domain` | `Output<string>` | DNS name in format `${bucketName}.s3.amazonaws.com` |
| `name` | `Output<string>` | Auto-generated S3 bucket name |
| `nodes.bucket` | `Output<BucketV2>` | Underlying Pulumi S3 bucket resource |

## Methods

### notify(args)

Subscribes to S3 events and triggers notifications through Lambda functions, SQS queues, or SNS topics.

**Notification Configuration:**
- `name` (required) - Subscriber identifier
- `function?` - Handler path or ARN
- `queue?` - Queue component or ARN
- `topic?` - Topic component or ARN
- `events?` - Array of S3 event types (defaults to all)
- `filterPrefix?` - S3 key prefix filter
- `filterSuffix?` - S3 key suffix filter

**Returns:** `BucketNotification` component instance

### static get(name, bucketName, opts?)

References an existing S3 bucket by name, enabling cross-stage bucket sharing without recreating resources.

**Returns:** `Bucket` component instance

## Links

When linked to other resources, the Bucket exposes:
- `name` (string) - The generated S3 bucket name

Access via the SST SDK:
```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

## Examples

### Basic bucket creation
```typescript
const bucket = new sst.aws.Bucket("MyBucket");
```

### Public read access
```typescript
new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

### Enable versioning
```typescript
new sst.aws.Bucket("MyBucket", {
  versioning: true
});
```

### Event notification with function
```typescript
bucket.notify({
  notifications: [{
    name: "MySubscriber",
    function: "src/subscriber.handler"
  }]
});
```

### Linking to Next.js app
```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Nextjs("MyWeb", {
  link: [bucket]
});
```

### Generating pre-signed upload URL
```typescript
import { Resource } from "sst";
import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const command = new PutObjectCommand({
  Key: "file.txt",
  Bucket: Resource.MyBucket.name
});
await getSignedUrl(new S3Client({}), command);
```

### Cross-stage bucket sharing
```typescript
const bucket = $app.stage === "frank"
  ? sst.aws.Bucket.get("MyBucket", "app-dev-mybucket-12345678")
  : new sst.aws.Bucket("MyBucket");
```

### Custom policy (IP restriction)
```typescript
new sst.aws.Bucket("MyBucket", {
  policy: [{
    actions: ["s3:*"],
    principals: "*",
    conditions: [{
      test: "IpAddress",
      variable: "aws:SourceIp",
      values: ["10.0.0.0/16"]
    }]
  }]
});
```
