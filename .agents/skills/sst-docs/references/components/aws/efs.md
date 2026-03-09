# Efs

> Source: https://sst.dev/docs/component/aws/efs/

## Overview

The `Efs` component integrates Amazon Elastic File System into SST applications, enabling shared file storage across Lambda functions and containers. EFS provides a fully managed, elastic, shared file system.

**Pricing (default config, Regional Multi-AZ with Elastic Throughput):**
- Storage: $0.30/GB/month
- Reads: $0.03/GB/month
- Writes: $0.06/GB/month
(Approximate US-East-1 rates)

## Constructor

```typescript
new sst.aws.Efs(name, args, opts?)
```

**Parameters:**
- `name` - `string` - Component identifier
- `args` - `EfsArgs` - Configuration object
- `opts?` - `ComponentResourceOptions` - Pulumi resource options

## Props

### vpc (required)

**Type:** `Vpc | Input<Object>`

The VPC for the EFS file system. Can be an `sst.aws.Vpc` component or a custom object with `id` and `subnets` array.

```typescript
{
  vpc: new sst.aws.Vpc("MyVpc")
}
```

### performance?

**Type:** `Input<"general-purpose" | "max-io">`
**Default:** `"general-purpose"`

The performance mode. `"max-io"` supports higher throughput with slightly elevated latency.

### throughput?

**Type:** `Input<"provisioned" | "bursting" | "elastic">`
**Default:** `"elastic"`

The throughput scaling mode:
- `"elastic"` - Adjusts based on workload automatically
- `"provisioned"` - Fixed throughput
- `"bursting"` - Scales with storage size

### transform?

**Type:** `Object`

Customize underlying AWS resources:

- `transform.accessPoint?` - EFS Access Point configuration
- `transform.fileSystem?` - EFS File System configuration
- `transform.securityGroup?` - Security Group for mount targets

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `Output<string>` | EFS file system identifier |
| `accessPoint` | `Output<string>` | EFS access point identifier |
| `nodes` | `Object` | Underlying Pulumi resources |
| `nodes.fileSystem` | `Output<FileSystem>` | EFS File System resource |
| `nodes.accessPoint` | `Output<AccessPoint>` | EFS Access Point resource |

## Methods

### static get(name, fileSystemID, opts?)

Reference an existing EFS file system by ID. Useful for sharing file systems across stages.

```typescript
static get(name: string, fileSystemID: Input<string>, opts?: ComponentResourceOptions): Efs
```

## Links

This component does not expose link properties via the `Resource` object. It is used by attaching it to Lambda functions or containers via the `volume` property.

## Examples

### Basic creation with VPC

```typescript
const vpc = new sst.aws.Vpc("MyVpc");
const efs = new sst.aws.Efs("MyEfs", { vpc });
```

### Attach to a Lambda function

```typescript
new sst.aws.Function("MyFunction", {
  vpc,
  handler: "lambda.handler",
  volume: { efs, path: "/mnt/efs" }
});
```

### Attach to a container service

```typescript
const cluster = new sst.aws.Cluster("MyCluster", { vpc });

new sst.aws.Service("MyService", {
  cluster,
  public: { ports: [{ listen: "80/http" }] },
  volumes: [{ efs, path: "/mnt/efs" }]
});
```

### Cross-stage sharing

```typescript
const efs = $app.stage === "frank"
  ? sst.aws.Efs.get("MyEfs", "app-dev-myefs")
  : new sst.aws.Efs("MyEfs", { vpc });
```
