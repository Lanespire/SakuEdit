# Cluster

> Source: https://sst.dev/docs/component/aws/cluster/

## Overview

The `Cluster` component creates an AWS ECS (Elastic Container Service) cluster for applications. It serves as a container for `Service` (always-running containers) and `Task` (long-running asynchronous work) components.

An ECS cluster is the foundation for running containerized workloads on AWS Fargate.

## Constructor

```typescript
new sst.aws.Cluster(name, args, opts?)
```

**Parameters:**
- `name` - `string` - Component identifier
- `args` - `ClusterArgs` - Configuration object
- `opts?` - `ComponentResourceOptions` - Pulumi resource options

## Props

### vpc (required)

**Type:** `Vpc | Input<Object>`

The VPC for the cluster deployment. Can be an `sst.aws.Vpc` component or a custom object.

**VPC Object Properties:**
- `id` - `Input<string>` - VPC identifier
- `securityGroups` - `Input<Input<string>[]>` - Security group IDs
- `containerSubnets?` - `Input<Input<string>[]>` - Subnets for containers
- `loadBalancerSubnets` - `Input<Input<string>[]>` - Subnets for load balancer
- `cloudmapNamespaceId?` - `Input<string>` - Cloud Map namespace ID
- `cloudmapNamespaceName?` - `Input<string>` - Cloud Map namespace name

By default, load balancers and services deploy in public subnets.

```typescript
{
  vpc: new sst.aws.Vpc("MyVpc")
}
```

### transform?

**Type:** `Object`

Customize underlying resource creation:

- `transform.cluster?` - `ClusterArgs | function` - Transform the ECS Cluster resource

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `Output<string>` | ECS cluster identifier |
| `nodes` | `Object` | Underlying Pulumi resources |
| `nodes.cluster` | `Output<Cluster>` | Amazon ECS Cluster resource |

## Methods

### static get(name, args, opts?)

Reference an existing ECS cluster by ID/ARN. Useful for sharing clusters across stages.

```typescript
static get(name: string, args: ClusterGetArgs, opts?: ComponentResourceOptions): Cluster
```

**ClusterGetArgs:**
- `id` - `Input<string>` - Cluster ARN/ID (required)
- `vpc` - `Vpc | Input<Object>` - VPC configuration (same structure as ClusterArgs.vpc)

## Links

This component does not expose link properties via the `Resource` object. It is used as a parent for `Service` and `Task` components.

## Examples

### Basic cluster creation

```typescript
const vpc = new sst.aws.Vpc("MyVpc");
const cluster = new sst.aws.Cluster("MyCluster", { vpc });
```

### Add a Service to the cluster

```typescript
new sst.aws.Service("MyService", {
  cluster,
  // ... service configuration
});
```

### Add a Task to the cluster

```typescript
new sst.aws.Task("MyTask", {
  cluster,
  // ... task configuration
});
```

### Cross-stage sharing

```typescript
const cluster = $app.stage === "frank"
  ? sst.aws.Cluster.get("MyCluster", {
      id: "arn:aws:ecs:us-east-1:123456789012:cluster/app-dev-MyCluster",
      vpc,
    })
  : new sst.aws.Cluster("MyCluster", { vpc });
```
