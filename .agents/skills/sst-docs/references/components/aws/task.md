# Task

> Source: https://sst.dev/docs/component/aws/task/

## Overview

The `Task` component creates containers for long-running asynchronous work using Amazon ECS on AWS Fargate. It enables data processing and similar workloads without managing servers directly. Unlike `Service` (always-running), Tasks are invoked on-demand and stop when work completes.

**Pricing (default config):**
- ~$0.02 per hour per task execution (0.25 vCPU, 0.5 GB memory, 20GB storage, public IPv4)

## Constructor

```typescript
new sst.aws.Task(name, args, opts?)
```

**Parameters:**
- `name` - `string` - Component identifier
- `args` - `TaskArgs` - Configuration object
- `opts?` - `ComponentResourceOptions` - Pulumi resource options

## Props

### cluster (required)

**Type:** `Cluster`

The ECS Cluster where the task runs.

```typescript
{
  cluster: new sst.aws.Cluster("MyCluster", { vpc })
}
```

### image?

**Type:** `Input<string | Object>`

Docker image configuration. Can be a string (pre-built image) or an object for building from Dockerfile.

- `image.context?` - `Input<string>` - Build directory (default: `"."`)
- `image.dockerfile?` - `Input<string>` - Path to Dockerfile (default: `"Dockerfile"`)
- `image.args?` - `Input<Record<string, string>>` - Build arguments
- `image.target?` - `Input<string>` - Multi-stage build target
- `image.tags?` - `Input<string[]>` - Image tags

### containers?

**Type:** `Array<Object>`

Array of container definitions for multi-container tasks. Each container has:

- `name` - `string` - Container name
- `image` - `string | Object` - Docker image
- `command?` - `string[]` - Override command
- `entrypoint?` - `string[]` - Override entrypoint
- `environment?` - `Record<string, string>` - Environment variables
- `memory?` - `string` - Memory allocation
- `cpu?` - `string` - CPU allocation
- `logging?` - `Object` - Logging configuration
- `volumes?` - `Object[]` - Volume mounts

### command?

**Type:** `Input<string[]>`

Override the default container command.

### entrypoint?

**Type:** `Input<string[]>`

Override the default container entrypoint.

### cpu?

**Type:** `Input<string>`
**Default:** `"0.25 vCPU"`

CPU allocation. Options: `"0.25 vCPU"`, `"0.5 vCPU"`, `"1 vCPU"`, `"2 vCPU"`, `"4 vCPU"`, `"8 vCPU"`, `"16 vCPU"`.

### memory?

**Type:** `Input<string>`
**Default:** `"0.5 GB"`

Memory allocation.

### storage?

**Type:** `Input<string>`
**Default:** `"20 GB"`

Ephemeral storage.

### architecture?

**Type:** `Input<"x86_64" | "arm64">`
**Default:** `"x86_64"`

CPU architecture.

### environment?

**Type:** `Input<Record<string, Input<string>>>`

Container environment variables.

### environmentFiles?

**Type:** `Input<Input<string>[]>`

S3 ARNs for .env files to load.

### ssm?

**Type:** `Input<Record<string, Input<string>>>`

AWS Secrets Manager or Parameter Store ARN mappings.

### link?

**Type:** `Input<Resource[]>`

Resources to link for SDK access and automatic IAM permissions.

### permissions?

**Type:** `Input<Object[]>`

Custom IAM permissions.

- `permissions[].actions` - `string[]` - IAM actions
- `permissions[].resources` - `string[]` - Resource ARNs
- `permissions[].effect?` - `"allow" | "deny"` - Permission effect

### publicIp?

**Type:** `Input<boolean>`

Assign a public IP to the task.

### taskRole?

**Type:** `Input<string>`

Custom IAM role name for the task. Creates a new role if omitted.

### executionRole?

**Type:** `Input<string>`

Custom execution role name for ECS to launch containers.

### logging?

**Type:** `Object`

CloudWatch logging configuration.

- `logging.name?` - `Input<string>` - Log group name
- `logging.retention?` - `Input<string>` - Retention duration (1 day to forever)

### volumes?

**Type:** `Array<Object>`

EFS mount configuration.

- `volumes[].efs` - `Efs | Object` - EFS component or `{fileSystem, accessPoint}` object
- `volumes[].path` - `string` - Mount path in container

### dev?

**Type:** `Object`

Development mode configuration.

- `dev.command?` - `string` - Local dev command
- `dev.directory?` - `string` - Working directory for dev command

### transform?

**Type:** `Object`

Customize underlying AWS resources (taskDefinition, taskRole, executionRole, logGroup).

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `taskDefinition` | `Output<string>` | Task Definition ARN |
| `nodes` | `Object` | Underlying Pulumi resources |
| `nodes.executionRole` | `Role` | IAM execution role |
| `nodes.taskDefinition` | `TaskDefinition` | ECS Task Definition |
| `nodes.taskRole` | `Role` | IAM task role |

## Methods

### SDK Methods (runtime)

#### task.run(resource, environment?, options?)

Execute a task instance.

```typescript
import { Resource } from "sst";
import { task } from "sst/aws/task";

const result = await task.run(Resource.MyTask);
```

**Parameters:**
- `resource` - The Task resource from SST SDK
- `environment?` - `Record<string, string>` - Additional environment variables
- `options?` - `{ capacity?: "fargate" | "spot" }` - Capacity provider

**Returns:** `Promise<{ arn: string, status: string, response: object }>` - Contains raw AWS SDK response with `tasks[].taskArn`

#### task.describe(resource, taskArn, options?)

Retrieve task details. Tasks stopped over an hour ago are not returned.

```typescript
const details = await task.describe(Resource.MyTask, taskArn);
```

**Returns:** `Promise<{ arn: string, status: string, response: object }>`

#### task.stop(resource, taskArn, options?)

Stop a running task asynchronously. Task may take minutes to fully stop.

```typescript
await task.stop(Resource.MyTask, taskArn);
```

**Returns:** `Promise<{ arn: string, status: string, response: object }>`

## Links

When linked, the following properties are accessible via the `Resource` object in the SDK:

- `taskDefinition` - `string` - Task Definition ARN
- `cluster` - `string` - Cluster ARN
- `subnets` - `string[]` - Subnet IDs
- `securityGroups` - `string[]` - Security Group IDs
- `containers` - `string[]` - Container names
- `assignPublicIp` - `boolean` - Whether public IP is assigned

## Examples

### Basic task creation

```typescript
const vpc = new sst.aws.Vpc("MyVpc");
const cluster = new sst.aws.Cluster("MyCluster", { vpc });

new sst.aws.Task("MyTask", { cluster });
```

### Multiple containers

```typescript
new sst.aws.Task("MyTask", {
  cluster,
  containers: [
    {
      name: "app",
      image: "nginxdemos/hello:plain-text"
    },
    {
      name: "admin",
      image: {
        context: "./admin",
        dockerfile: "Dockerfile"
      }
    }
  ]
});
```

### Run a task from application code

```typescript
import { Resource } from "sst";
import { task } from "sst/aws/task";

// Run the task
const runResult = await task.run(Resource.MyTask);
const taskArn = runResult.tasks[0].taskArn;

// Check task status
const details = await task.describe(Resource.MyTask, taskArn);

// Stop the task
await task.stop(Resource.MyTask, taskArn);
```

### With linked resources

```typescript
const bucket = new sst.aws.Bucket("MyBucket");

new sst.aws.Task("MyTask", {
  cluster,
  link: [bucket]
});
```

### With EFS volume

```typescript
const efs = new sst.aws.Efs("MyEfs", { vpc });

new sst.aws.Task("MyTask", {
  cluster,
  volumes: [{ efs, path: "/mnt/efs" }]
});
```

### Use Fargate Spot

```typescript
import { task } from "sst/aws/task";

await task.run(Resource.MyTask, undefined, {
  capacity: "spot"
});
```
