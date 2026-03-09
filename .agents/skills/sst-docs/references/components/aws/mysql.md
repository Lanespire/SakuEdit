# Mysql

> Source: https://sst.dev/docs/component/aws/mysql/

## Overview

The `Mysql` component enables adding a MySQL database to applications using Amazon RDS MySQL. It supports local development connections and RDS Proxy for connection pooling.

Uses Amazon RDS with gp3 storage volumes. Supports RDS Proxy, Multi-AZ deployments, and local development via `sst dev`.

**Pricing (default config):**
- Single-AZ (t4g.micro + 20GB storage): ~$14/month
- RDS Proxy: ~$22/month additional

## Constructor

```typescript
new sst.aws.Mysql(name, args, opts?)
```

**Parameters:**
- `name` - `string` - Component identifier
- `args` - `MysqlArgs` - Configuration object
- `opts?` - `ComponentResourceOptions` - Pulumi resource options

## Props

### vpc (required)

**Type:** `Vpc | Input<Object>`

The VPC to deploy the database in. Can be an `sst.aws.Vpc` component or a custom object with `id`, `subnets`, and `securityGroups`.

```typescript
{
  vpc: new sst.aws.Vpc("MyVpc")
}
```

### database?

**Type:** `Input<string>`
**Default:** App name with hyphens replaced by underscores

Name of the automatically created database. Must start with a letter and contain only lowercase letters, numbers, and underscores.

### instance?

**Type:** `Input<string>`
**Default:** `"t4g.micro"`

The DB instance type. Supports all AWS RDS instance classes.

### version?

**Type:** `Input<string>`
**Default:** `"8.0.40"`

The MySQL engine version.

### username?

**Type:** `Input<string>`
**Default:** `"root"`

Master user name for the database.

### password?

**Type:** `Input<string>`
**Default:** Randomly generated

Master user password.

### storage?

**Type:** `Input<string>`
**Default:** `"20 GB"`

Maximum storage limit for the database. Range: 20 GB to 64 TB. Uses gp3 volumes.

### multiAz?

**Type:** `Input<boolean>`
**Default:** `false`

Enable Multi-AZ deployment with standby replica for automatic failover.

### proxy?

**Type:** `Input<boolean | Object>`
**Default:** `false`

Enable RDS Proxy for connection pooling.

- `proxy.credentials?` - `Input<Object[]>` - Additional proxy user credentials (array of `{username, password}` objects)

### dev?

**Type:** `Object`

Configure how this component works in `sst dev`. Connect to a local MySQL instance instead of deploying to AWS.

- `dev.host?` - `Input<string>` - Default: `"localhost"`
- `dev.port?` - `Input<number>` - Default: `3306`
- `dev.username?` - `Input<string>` - Default: inherits top-level username
- `dev.password?` - `Input<string>` - Default: inherits top-level password
- `dev.database?` - `Input<string>` - Default: inherits top-level database

### transform?

**Type:** `Object`

Customize underlying AWS resources:

- `transform.instance?` - RDS Instance
- `transform.parameterGroup?` - DB Parameter Group
- `transform.proxy?` - RDS Proxy
- `transform.subnetGroup?` - DB Subnet Group

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `Output<string>` | MySQL instance identifier |
| `host` | `Output<string>` | Database hostname |
| `port` | `Output<number>` | Database port |
| `database` | `Output<string>` | Database name |
| `username` | `Output<string>` | Master username |
| `password` | `Output<string>` | Master user password |
| `proxyId` | `Output<string>` | Proxy name (if proxy enabled) |
| `nodes` | `Object` | Underlying Pulumi resources |
| `nodes.instance` | `Instance \| undefined` | RDS Instance resource |

## Methods

### static get(name, args, opts?)

Reference an existing MySQL database without creating a new one. Useful for sharing databases across stages.

```typescript
static get(name: string, args: MysqlGetArgs, opts?: ComponentResourceOptions): Mysql
```

**MysqlGetArgs:**
- `id` - `Input<string>` - The database instance identifier (required)
- `proxyId?` - `Input<string>` - The proxy identifier (optional)

## Links

When linked, the following properties are accessible via the `Resource` object in the SDK:

- `database` - `string` - Database name
- `host` - `string` - Database hostname
- `port` - `number` - Database port
- `username` - `string` - Master username
- `password` - `string` - Master password

## Examples

### Basic creation with VPC

```typescript
const vpc = new sst.aws.Vpc("MyVpc");
const database = new sst.aws.Mysql("MyDatabase", { vpc });
```

### Link to a Next.js app

```typescript
new sst.aws.Nextjs("MyWeb", {
  link: [database],
  vpc
});
```

### Connect in application code

```typescript
import { Resource } from "sst";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  user: Resource.MyDatabase.username,
  password: Resource.MyDatabase.password,
  database: Resource.MyDatabase.database,
  host: Resource.MyDatabase.host,
  port: Resource.MyDatabase.port,
});
```

### Local development configuration

```typescript
new sst.aws.Mysql("MyMysql", {
  vpc,
  dev: {
    username: "root",
    password: "password",
    database: "local",
    port: 3306
  }
});
```

### Cross-stage sharing

```typescript
const database = $app.stage === "frank"
  ? sst.aws.Mysql.get("MyDatabase", {
      id: "app-dev-mydatabase",
      proxyId: "app-dev-mydatabase-proxy"
    })
  : new sst.aws.Mysql("MyDatabase", { proxy: true });
```
