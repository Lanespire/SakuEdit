# Redis

> Source: https://sst.dev/docs/component/aws/redis/

## Overview

The `Redis` component creates an Amazon ElastiCache Redis cluster for SST applications. Supports both Redis and Valkey engines with configurable cluster modes, instance types, and VPC settings.

Uses ElastiCache with replication groups. Supports cluster mode with multiple nodes and local development connections.

**Pricing (default config):**
- Redis (t4g.micro, on-demand): ~$12/month
- Valkey (t4g.micro, on-demand): ~$9/month

## Constructor

```typescript
new sst.aws.Redis(name, args, opts?)
```

**Parameters:**
- `name` - `string` - Component identifier
- `args` - `RedisArgs` - Configuration object
- `opts?` - `ComponentResourceOptions` - Pulumi resource options

## Props

### vpc (required)

**Type:** `Vpc | Input<Object>`

The VPC to deploy the Redis cluster in. Can be an `sst.aws.Vpc` component or a custom object.

```typescript
{
  vpc: new sst.aws.Vpc("MyVpc")
}
```

### engine?

**Type:** `"redis" | "valkey"`
**Default:** `"redis"`

The cache engine. Valkey is a Redis-compatible alternative that is more cost-effective.

### instance?

**Type:** `Input<string>`
**Default:** `"t4g.micro"`

The instance type for cache nodes.

### version?

**Type:** `Input<string>`
**Default:** `"7.1"` (Redis) or `"7.2"` (Valkey)

The engine version.

### cluster?

**Type:** `Input<boolean | Object>`
**Default:** `{ nodes: 1 }`

Cluster mode settings. Set `nodes` property to configure the number of nodes.

```typescript
{
  cluster: { nodes: 3 }
}
```

### parameters?

**Type:** `Record<string, string>`

Custom parameter group key-value pairs for fine-tuning Redis/Valkey behavior.

### dev?

**Type:** `Object`

Configure how this component works in `sst dev`. Connect to a local Redis instance.

- `dev.host?` - `Input<string>` - Local Redis host
- `dev.port?` - `Input<number>` - Local Redis port
- `dev.username?` - `Input<string>` - Authentication username
- `dev.password?` - `Input<string>` - Authentication password

### transform?

**Type:** `Object`

Customize underlying AWS resources:

- `transform.cluster?` - ElastiCache ReplicationGroup
- `transform.parameterGroup?` - Parameter Group
- `transform.subnetGroup?` - Subnet Group

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `clusterId` | `Output<string>` | Redis cluster identifier |
| `host` | `Output<string>` | Connection hostname |
| `port` | `Output<number>` | Connection port |
| `username` | `Output<string>` | Authentication username |
| `password` | `Output<string> \| undefined` | Authentication password |
| `nodes` | `Object` | Underlying Pulumi resources |
| `nodes.cluster` | `ReplicationGroup` | ElastiCache ReplicationGroup resource |

## Methods

### static get(name, clusterId, opts?)

Reference an existing Redis cluster by ID. Useful for sharing clusters across stages.

```typescript
static get(name: string, clusterId: Input<string>, opts?: ComponentResourceOptions): Redis
```

## Links

When linked, the following properties are accessible via the `Resource` object in the SDK:

- `host` - `string` - Connection hostname
- `port` - `number` - Connection port
- `username` - `string` - Authentication username
- `password` - `string | undefined` - Authentication password

## Examples

### Basic creation with VPC

```typescript
const vpc = new sst.aws.Vpc("MyVpc");
const redis = new sst.aws.Redis("MyRedis", { vpc });
```

### Link to a resource

```typescript
new sst.aws.Nextjs("MyWeb", {
  link: [redis],
  vpc
});
```

### Connect in application code

```typescript
import { Resource } from "sst";
import { Cluster } from "ioredis";

const client = new Cluster(
  [{ host: Resource.MyRedis.host, port: Resource.MyRedis.port }],
  {
    redisOptions: {
      tls: { checkServerIdentity: () => undefined },
      username: Resource.MyRedis.username,
      password: Resource.MyRedis.password
    }
  }
);
```

### Local development configuration

```typescript
const redis = new sst.aws.Redis("MyRedis", {
  vpc,
  dev: {
    host: "localhost",
    port: 6379
  }
});
```

### Cross-stage sharing

```typescript
const redis = $app.stage === "frank"
  ? sst.aws.Redis.get("MyRedis", "app-dev-myredis")
  : new sst.aws.Redis("MyRedis", { vpc });
```
