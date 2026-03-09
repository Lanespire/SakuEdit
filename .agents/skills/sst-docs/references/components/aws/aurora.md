# Aurora

> Source: https://sst.dev/docs/component/aws/aurora/

## Overview

The `Aurora` component enables AWS Aurora Serverless v2 database clusters (Postgres or MySQL) within SST applications. Aurora Serverless v2 automatically scales capacity based on workload, charging only for the resources consumed.

Supports both Postgres and MySQL engines, Data API for HTTP-based access, RDS Proxy, read replicas, and local development connections.

**Pricing:**
- ACU pricing: $0.12/hour each
- Storage: $0.01/GB/month
- RDS Proxy: $0.015/ACU hour (minimum 8 ACUs)
- Data API: $0.35 per million requests (first billion)

## Constructor

```typescript
new sst.aws.Aurora(name, args, opts?)
```

**Parameters:**
- `name` - `string` - Component identifier
- `args` - `AuroraArgs` - Configuration object
- `opts?` - `ComponentResourceOptions` - Pulumi resource options

## Props

### engine (required)

**Type:** `"postgres" | "mysql"`

The database engine type.

```typescript
{
  engine: "postgres"
}
```

### vpc (required)

**Type:** `Vpc | Input<Object>`

The VPC to deploy the cluster in. Can be an `sst.aws.Vpc` component or a custom object with `id`, `subnets`, and `securityGroups`.

### database?

**Type:** `Input<string>`
**Default:** App name with hyphens replaced by underscores

Name of the automatically created database.

### version?

**Type:** `Input<string>`
**Default:** `"16.4"` (Postgres) or `"3.08.0"` (MySQL)

The engine version.

### username?

**Type:** `Input<string>`
**Default:** `"postgres"` (Postgres) or `"root"` (MySQL)

Master user name.

### password?

**Type:** `Input<string>`
**Default:** Randomly generated

Master user password.

### scaling?

**Type:** `Object`
**Default:** `{ min: "0.5 ACU", max: "4 ACU" }`

Serverless scaling configuration.

- `scaling.min` - `Input<string>` - Minimum ACUs. Range: 0-256 ACU. Set to `"0 ACU"` to enable pause.
- `scaling.max` - `Input<string>` - Maximum ACUs. Range: 1-128 ACU.
- `scaling.pauseAfter?` - `Input<string>` - Time before pausing when min=0. Range: 5-60 minutes.

```typescript
{
  scaling: {
    min: "2 ACU",
    max: "128 ACU"
  }
}
```

### replicas?

**Type:** `Input<number>`
**Default:** `0`

Number of read-only replicas. Range: 0-15.

### dataApi?

**Type:** `Input<boolean>`
**Default:** `false`

Enable RDS Data API for HTTP endpoint access without persistent database connections.

```typescript
{
  dataApi: true
}
```

### proxy?

**Type:** `Input<boolean | Object>`
**Default:** `false`

Enable RDS Proxy for connection pooling.

- `proxy.credentials?` - `Input<Object[]>` - Additional proxy user credentials (array of `{username, password}` objects)

### dev?

**Type:** `Object`

Configure how this component works in `sst dev`. Connect to a local database.

- `dev.host?` - `Input<string>`
- `dev.port?` - `Input<number>`
- `dev.username?` - `Input<string>`
- `dev.password?` - `Input<string>`
- `dev.database?` - `Input<string>`

### transform?

**Type:** `Object`

Customize underlying AWS resources (cluster, instance, subnetGroup, parameterGroup, proxy).

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `Output<string>` | RDS Cluster identifier |
| `clusterArn` | `Output<string>` | Cluster ARN |
| `host` | `Output<string>` | Primary endpoint hostname |
| `reader` | `Output<string>` | Read-only endpoint hostname |
| `port` | `Output<number>` | Connection port |
| `database` | `Output<string>` | Database name |
| `username` | `Output<string>` | Master username |
| `password` | `Output<string>` | Master password |
| `secretArn` | `Output<string>` | AWS Secrets Manager ARN |
| `nodes` | `Object` | Underlying Pulumi resources |

## Methods

### static get(name, id, opts?)

Reference an existing Aurora cluster by cluster ID. Useful for sharing clusters across stages.

```typescript
static get(name: string, id: Input<string>, opts?: ComponentResourceOptions): Aurora
```

## Links

When linked, the following properties are accessible via the `Resource` object in the SDK:

- `clusterArn` - `string` - Cluster ARN
- `database` - `string` - Database name
- `host` - `string` - Primary endpoint
- `port` - `number` - Connection port
- `reader` - `string` - Read-only endpoint
- `username` - `string` - Master username
- `password` - `string` - Master password
- `secretArn` - `string` - Secrets Manager ARN

## Examples

### Create a Postgres cluster

```typescript
const vpc = new sst.aws.Vpc("MyVpc");
const database = new sst.aws.Aurora("MyDatabase", {
  engine: "postgres",
  vpc
});
```

### Create a MySQL cluster

```typescript
const database = new sst.aws.Aurora("MyDatabase", {
  engine: "mysql",
  vpc
});
```

### Custom scaling

```typescript
const database = new sst.aws.Aurora("MyDatabase", {
  engine: "postgres",
  vpc,
  scaling: {
    min: "2 ACU",
    max: "128 ACU"
  }
});
```

### Enable Data API

```typescript
const database = new sst.aws.Aurora("MyDatabase", {
  engine: "postgres",
  vpc,
  dataApi: true
});
```

### Link to a Next.js app

```typescript
new sst.aws.Nextjs("MyWeb", {
  link: [database],
  vpc
});
```

### Local development configuration

```typescript
const database = new sst.aws.Aurora("MyDatabase", {
  engine: "postgres",
  vpc,
  dev: {
    username: "postgres",
    password: "password",
    database: "local",
    port: 5432
  }
});
```

### Cross-stage sharing

```typescript
const database = $app.stage === "frank"
  ? sst.aws.Aurora.get("MyDatabase", "app-dev-mydatabase")
  : new sst.aws.Aurora("MyDatabase", {
      engine: "postgres",
      vpc
    });
```
