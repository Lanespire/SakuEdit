# Vpc

> Source: https://sst.dev/docs/component/aws/vpc/

## Overview

The `Vpc` component enables adding a Virtual Private Cloud to an SST application using Amazon VPC. It is required for services like RDS, ElastiCache, and Fargate that need VPC hosting.

**Default Architecture:**
- 2 Availability Zones
- Default security group (blocks incoming internet traffic)
- Public and private subnets per AZ
- Internet Gateway for public subnet routing
- Optional NAT Gateway/instance for private subnet internet access
- Optional bastion host for VPC resource access

**Pricing:**
- Default (no NAT/bastion): Free
- Managed NAT: ~$65/month (2 AZs)
- EC2 NAT (fck-nat): ~$6/month (2 AZs, 10x cheaper)
- Bastion only: ~$3/month
- Bastion + EC2 NAT: Free (reuses NAT instance)

## Constructor

```typescript
new sst.aws.Vpc(name, args?, opts?)
```

**Parameters:**
- `name` - `string` - Component identifier
- `args?` - `VpcArgs` - Configuration object
- `opts?` - `ComponentResourceOptions` - Pulumi resource options

## Props

### az?

**Type:** `Input<number | Input<string>[]>`
**Default:** `2`

Specifies availability zones by count or explicit list.

```typescript
// By count
{ az: 3 }

// By explicit list
{ az: ["us-east-1a", "us-east-1b"] }
```

### nat?

**Type:** `Input<"ec2" | "managed" | Object>`
**Default:** Disabled

Configure NAT for private subnet internet access.

- `"managed"` - AWS NAT Gateway (~$65/month for 2 AZs)
- `"ec2"` - fck-nat EC2 instance (~$6/month for 2 AZs)

#### nat.type?

**Type:** `Input<"ec2" | "managed">`

Explicitly set NAT type.

#### nat.ec2?

**Type:** `Input<Object>`
**Default:** `{ instance: "t4g.nano" }`

EC2 NAT instance configuration.

- `nat.ec2.instance` - `Input<string>` - Default: `"t4g.nano"` - EC2 instance type
- `nat.ec2.ami?` - `Input<string>` - Default: latest fck-nat AMI - Custom AMI

#### nat.ip?

**Type:** `Input<Input<string>[]>`

List of Elastic IP allocation IDs. Count must match AZ count.

### bastion?

**Type:** `Input<boolean>`
**Default:** `false`

Provision an EC2 bastion host (t4g.nano) for VPC resource access via AWS SSM. Cost: ~$3/month. Reuses NAT instance if `nat: "ec2"` is also enabled. Automatically creates a tunnel in `sst dev`.

```typescript
{ bastion: true }
```

### transform?

**Type:** `Object`

Customize underlying AWS resources:

- `transform.vpc` - VPC resource
- `transform.securityGroup` - Security Group
- `transform.publicSubnet` - Public Subnet
- `transform.privateSubnet` - Private Subnet
- `transform.publicRouteTable` - Public Route Table
- `transform.privateRouteTable` - Private Route Table
- `transform.internetGateway` - Internet Gateway
- `transform.elasticIp` - Elastic IP (for NAT)
- `transform.natGateway` - NAT Gateway
- `transform.natInstance` - NAT EC2 Instance
- `transform.natSecurityGroup` - NAT Security Group
- `transform.bastionInstance` - Bastion EC2 Instance
- `transform.bastionSecurityGroup` - Bastion Security Group

Each transform accepts either modified args or a callback function.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `Output<string>` | VPC identifier |
| `bastion` | `Output<string>` | Bastion instance ID |
| `publicSubnets` | `Output<Output<string>[]>` | Public subnet IDs |
| `privateSubnets` | `Output<Output<string>[]>` | Private subnet IDs |
| `securityGroups` | `Output<Output<string>[]>` | VPC security group IDs |
| `nodes` | `Object` | Underlying Pulumi resources |
| `nodes.vpc` | `Vpc` | EC2 VPC resource |
| `nodes.securityGroup` | `SecurityGroup` | EC2 Security Group |
| `nodes.publicSubnets` | `Subnet[]` | Public Subnet resources |
| `nodes.privateSubnets` | `Subnet[]` | Private Subnet resources |
| `nodes.publicRouteTables` | `RouteTable[]` | Public Route Table resources |
| `nodes.privateRouteTables` | `RouteTable[]` | Private Route Table resources |
| `nodes.internetGateway` | `InternetGateway` | Internet Gateway resource |
| `nodes.natGateways` | `NatGateway[]` | NAT Gateway resources (if enabled) |
| `nodes.natInstances` | `Instance[]` | NAT EC2 instances (if enabled) |
| `nodes.elasticIps` | `Eip[]` | Elastic IP resources (for NAT) |
| `nodes.cloudmapNamespace` | `Namespace` | Service Discovery namespace |
| `nodes.bastionInstance` | `Instance` | Bastion EC2 instance (if enabled) |

## Methods

### static get(name, vpcId, opts?)

Reference an existing VPC by ID without creating a new one. Useful for sharing VPCs across stages.

```typescript
static get(name: string, vpcId: Input<string>, opts?: ComponentResourceOptions): Vpc
```

## Links

When linked, the following properties are accessible via the `Resource` object in the SDK:

- `bastion` - `undefined | string` - Bastion instance ID

## Examples

### Basic VPC

```typescript
new sst.aws.Vpc("MyVPC");
```

### With 3 Availability Zones

```typescript
new sst.aws.Vpc("MyVPC", { az: 3 });
```

### With Managed NAT

```typescript
new sst.aws.Vpc("MyVPC", { nat: "managed" });
```

### With EC2 NAT (cost-optimized)

```typescript
new sst.aws.Vpc("MyVPC", { nat: "ec2" });
```

### With Bastion Host

```typescript
new sst.aws.Vpc("MyVPC", { bastion: true });
```

### Custom EC2 NAT Instance

```typescript
new sst.aws.Vpc("MyVPC", {
  nat: {
    ec2: { instance: "t4g.large" }
  }
});
```

### Cross-stage sharing

```typescript
const vpc = $app.stage === "frank"
  ? sst.aws.Vpc.get("MyVPC", "vpc-0be8fa4de860618bb")
  : new sst.aws.Vpc("MyVPC");
```
