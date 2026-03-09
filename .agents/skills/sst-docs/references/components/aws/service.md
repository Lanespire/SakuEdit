# Service

> Source: https://sst.dev/docs/component/aws/service/

## Overview

The `Service` component creates containers that run continuously, similar to web or application servers. It leverages Amazon ECS on AWS Fargate for deployment. Supports load balancing (ALB/NLB), auto-scaling, service discovery, multi-container setups, and local development mode.

**Pricing (default config):**
- Fargate (0.25 vCPU, 0.5 GB): ~$12/month
- Fargate Spot equivalent: ~$6/month
- Includes 20GB ephemeral storage and public IPv4 address
- Load balancer (ALB): ~$16-20/month additional
- API Gateway: pay-per-request

## Constructor

```typescript
new sst.aws.Service(name, args, opts?)
```

**Parameters:**
- `name` - `string` - Component identifier
- `args` - `ServiceArgs` - Configuration object
- `opts?` - `ComponentResourceOptions` - Pulumi resource options

## Props

### cluster (required)

**Type:** `Cluster`

The ECS Cluster instance where the service runs.

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

```typescript
// Pre-built image
{ image: "nginxdemos/hello:plain-text" }

// Build from Dockerfile
{ image: { context: "./app", dockerfile: "Dockerfile" } }
```

### containers?

**Type:** `Array<Object>`

Array of multiple container definitions for sidecar patterns. Each container has its own image, cpu, memory, environment, command, entrypoint, and logging settings.

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

Memory allocation in GB.

### storage?

**Type:** `Input<string>`
**Default:** `"20 GB"`

Ephemeral storage in GB.

### architecture?

**Type:** `Input<"x86_64" | "arm64">`
**Default:** `"x86_64"`

CPU architecture.

### scaling?

**Type:** `Object`

Auto-scaling configuration.

- `scaling.min?` - `Input<number>` - Minimum number of tasks
- `scaling.max?` - `Input<number>` - Maximum number of tasks
- `scaling.cpuUtilization?` - `Input<number>` - Target CPU utilization percentage
- `scaling.memoryUtilization?` - `Input<number>` - Target memory utilization percentage
- `scaling.requestCount?` - `Input<number>` - Target request count per target

### capacity?

**Type:** `Input<"spot" | Object>`

Capacity provider strategy.

- `"spot"` - Use Fargate Spot for cost savings
- Object with `fargate` and `spot` weight/base allocations

### loadBalancer?

**Type:** `Object`

ALB or NLB configuration.

- `loadBalancer.domain?` - Custom domain configuration
- `loadBalancer.rules?` - Path-based or header-based routing rules
- `loadBalancer.health?` - Health check configuration
- `loadBalancer.public?` - `Input<boolean>` - Whether the load balancer is internet-facing

### serviceRegistry?

**Type:** `Object`

CloudMap service registry configuration for API Gateway integration.

- `serviceRegistry.port` - `Input<number>` - Service discovery port

### environment?

**Type:** `Input<Record<string, Input<string>>>`

Key-value environment variables for the container.

### environmentFiles?

**Type:** `Input<Input<string>[]>`

S3 paths to .env files for loading environment variables.

### ssm?

**Type:** `Input<Record<string, Input<string>>>`

AWS Parameter Store or Secrets Manager ARN mappings.

### link?

**Type:** `Input<Resource[]>`

Resources to link for SDK access and automatic IAM permissions.

### permissions?

**Type:** `Input<Object[]>`

Custom IAM permissions.

- `permissions[].actions` - `string[]` - IAM actions
- `permissions[].resources` - `string[]` - Resource ARNs
- `permissions[].effect?` - `"allow" | "deny"` - Permission effect

### taskRole?

**Type:** `Input<string>`

Custom IAM role name for the task.

### executionRole?

**Type:** `Input<string>`

Custom execution role name for ECS.

### health?

**Type:** `Object`

Container health check configuration.

- `health.command` - `Input<string[]>` - Health check command
- `health.interval?` - `Input<string>` - Check interval
- `health.timeout?` - `Input<string>` - Timeout duration
- `health.retries?` - `Input<number>` - Retry count
- `health.startPeriod?` - `Input<string>` - Grace period before checks start

### logging?

**Type:** `Object`

CloudWatch log group configuration.

- `logging.name?` - `Input<string>` - Log group name
- `logging.retention?` - `Input<string>` - Log retention duration

### volumes?

**Type:** `Array<Object>`

EFS mount points.

- `volumes[].efs` - `Efs` - EFS component
- `volumes[].path` - `string` - Mount path in container

### dev?

**Type:** `Object`

Configuration for `sst dev` local development.

- `dev.command?` - `string` - Local dev command to run
- `dev.directory?` - `string` - Working directory
- `dev.autostart?` - `boolean` - Auto-start in dev mode
- `dev.url?` - `string` - Local URL override

### wait?

**Type:** `Input<boolean>`
**Default:** `false`

Wait for service stability on deploy.

### transform?

**Type:** `Object`

Customize underlying AWS resources (service, taskDefinition, loadBalancer, target, listener, etc.).

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `service` | `Output<string>` | Cloud Map service name for service discovery |
| `url` | `Output<string>` | Service endpoint URL |
| `nodes` | `Object` | Underlying Pulumi resources |
| `nodes.executionRole` | `Role` | IAM execution role |
| `nodes.taskRole` | `Role` | IAM task role |
| `nodes.autoScalingTarget` | `Target` | App Auto Scaling target |
| `nodes.cloudmapService` | `Service` | Cloud Map service |
| `nodes.loadBalancer` | `LoadBalancer` | Load balancer instance |
| `nodes.service` | `Service` | ECS service instance |
| `nodes.taskDefinition` | `TaskDefinition` | ECS task definition |

## Methods

This component does not have static methods beyond the standard Pulumi component methods.

## Links

When linked, the following properties are accessible via the `Resource` object in the SDK:

- `service` - `string` - Cloud Map hostname for VPC-internal communication
- `url` - `string` - Endpoint URL

## Examples

### Basic service with public load balancer

```typescript
const vpc = new sst.aws.Vpc("MyVpc");
const cluster = new sst.aws.Cluster("MyCluster", { vpc });

new sst.aws.Service("MyService", {
  cluster,
  public: {
    ports: [{ listen: "80/http" }]
  }
});
```

### Link resources to a service

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
const database = new sst.aws.Postgres("MyDatabase", { vpc });

new sst.aws.Service("MyService", {
  cluster,
  link: [bucket, database],
  vpc
});
```

### Use Fargate Spot

```typescript
new sst.aws.Service("MyService", {
  cluster,
  capacity: "spot"
});
```

### Auto-scaling

```typescript
new sst.aws.Service("MyService", {
  cluster,
  scaling: {
    min: 1,
    max: 10,
    cpuUtilization: 70,
    memoryUtilization: 70
  }
});
```

### Multi-container (sidecar)

```typescript
new sst.aws.Service("MyService", {
  cluster,
  containers: [
    {
      name: "app",
      image: "nginxdemos/hello:plain-text"
    },
    {
      name: "sidecar",
      image: {
        context: "./sidecar",
        dockerfile: "Dockerfile"
      }
    }
  ]
});
```

### Mount EFS volume

```typescript
const efs = new sst.aws.Efs("MyEfs", { vpc });

new sst.aws.Service("MyService", {
  cluster,
  public: { ports: [{ listen: "80/http" }] },
  volumes: [{ efs, path: "/mnt/efs" }]
});
```

### Service discovery for Lambda communication

```typescript
// In Lambda function within the same VPC:
import { Resource } from "sst";
// Access via Resource.MyService.service hostname
```

### Local development

```typescript
new sst.aws.Service("MyService", {
  cluster,
  dev: {
    command: "npm run dev",
    directory: "./app",
    url: "http://localhost:3000"
  }
});
```
