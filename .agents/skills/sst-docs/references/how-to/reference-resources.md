# Reference Resources

> Source: https://sst.dev/docs/reference-resources/

## Overview

Referencing allows you to use externally created resources in your SST app without SST managing them. This applies to resources managed by different teams or IaC tools, typically low-level resources outside SST's built-in components.

## Lookup a Resource

### Basic Lookup

To use an existing resource, retrieve it using its identifying property. For example, to access a previously created S3 bucket:

```typescript
const bucket = aws.s3.BucketV2.get("MyBucket", "mybucket-xnbmhcvd");
```

This returns the same bucket object as if you'd created it within your app.

**Note:** Use `aws.s3.BucketV2` for resources not created through SST. For resources created in SST or another stage, use `sst.aws.Bucket.get()` instead. See the [Share Across Stages](./share-across-stages.md) guide for details.

### How Lookup Works

When creating resources in SST, two processes occur:

1. The resource is created via cloud provider API calls
2. SST retrieves the resource data and stores it in your state

Lookups skip creation and directly retrieve the resource on each deployment, returning the same object type as creation.

### Lookup Properties

Lookup properties match import properties. Most low-level resources include a `static get` method using these properties. Review the [Import Resources](./import-resources.md) documentation for commonly looked-up resources.

### Making Resources Linkable

Use the `sst.Linkable` component to link resource properties:

```typescript
const storage = new sst.Linkable("MyStorage", {
  properties: {
    domain: bucket.bucketDomainName
  }
});
```

### Linking to Functions

Link resources to functions:

```typescript
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  link: [storage]
});
```

Access linked resources at runtime using the SDK:

```typescript
import { Resource } from "sst";
console.log(Resource.MyStorage.domain);
```

## Pass In a Resource

You can provide existing resources to SST components when creating new resources that depend on them. For example, subscribe an existing function to a queue:

```typescript
const queue = new sst.aws.Queue("MyQueue");
queue.subscribe("arn:aws:lambda:us-east-1:123456789012:function:my-function");
```

### VPC Example

Create a function in an existing VPC:

```typescript
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  vpc: {
    subnets: ["subnet-0be8fa4de860618bb"],
    securityGroups: ["sg-0be8fa4de860618bb"]
  }
});
```

### Complex Resources

More intricate resources require additional configuration. For instance, a `Cluster` in an existing VPC:

```typescript
new sst.aws.Cluster("MyCluster", {
  vpc: {
    id: "vpc-0be8fa4de860618bb",
    securityGroups: ["sg-0be8fa4de860618bb"],
    containerSubnets: ["subnet-0be8fa4de860618bb"],
    loadBalancerSubnets: ["subnet-8be8fa4de850618ff"]
  }
});
```

## Attach to a Resource

Attach subscribers to externally managed resources using static methods:

```typescript
sst.aws.Queue.subscribe(
  "arn:aws:sqs:us-east-1:123456789012:MyQueue",
  "src/subscriber.handler"
);
```

### Available Components with Static Attachment Methods

The following SST components support static attachment methods:

- `Bus`
- `Dynamo`
- `SnsTopic`
- `KinesisStream`
- `Queue`

This approach allows managing root resources externally while maintaining SST integrations for attachments.
