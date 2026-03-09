# Volcengine (ByteDance Cloud)

> Source: https://www.pulumi.com/registry/packages/volcengine/
> Package: `@volcengine/pulumi`
> SST Install: `sst add @volcengine/pulumi`

## Overview

The Volcengine provider enables provisioning of cloud resources available through Volcengine's cloud platform (ByteDance's cloud infrastructure service). It integrates with Pulumi's infrastructure-as-code framework to manage Volcengine cloud deployments including VPC networking, ECS compute, and other services.

## Configuration

### Environment Variables

```bash
export VOLCENGINE_ACCESS_KEY=<your-access-key>
export VOLCENGINE_SECRET_KEY=<your-secret-key>
export VOLCENGINE_REGION=cn-beijing
```

### Pulumi Config

```bash
pulumi config set volcengine:accessKey <your-access-key> --secret
pulumi config set volcengine:secretKey <your-secret-key> --secret
pulumi config set volcengine:region cn-beijing
```

### Plugin Installation

```bash
pulumi plugin install resource volcengine --server github://api.github.com/volcengine
```

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `accessKey` | `VOLCENGINE_ACCESS_KEY` | API access key (required) |
| `secretKey` | `VOLCENGINE_SECRET_KEY` | API secret key (required) |
| `region` | `VOLCENGINE_REGION` | Deployment region (required, e.g., `cn-beijing`) |

## Key Resources

- **VPC**: `volcengine.vpc.Vpc`, `volcengine.vpc.Subnet`
- **ECS**: `volcengine.ecs.Instance`, `volcengine.ecs.SecurityGroup`
- **EBS**: `volcengine.ebs.Volume`
- **CLB**: `volcengine.clb.Clb` (Load Balancer)
- **NAT Gateway**: `volcengine.nat.Gateway`
- **EIP**: `volcengine.eip.Address`

## Example

```typescript
import * as volcengine from "@volcengine/pulumi";

// Create a VPC
const myVpc = new volcengine.vpc.Vpc("myVpc", {
  cidrBlock: "172.16.0.0/16",
  dnsServers: [
    "8.8.8.8",
    "114.114.114.114",
  ],
  vpcName: "pulumi-vpc-demo",
});

// Create a subnet
const mySubnet = new volcengine.vpc.Subnet("mySubnet", {
  subnetName: "pulumi-subnet-demo",
  cidrBlock: "172.16.0.0/24",
  zoneId: "cn-beijing-a",
  vpcId: myVpc.id,
});

export const vpcId = myVpc.id;
export const subnetId = mySubnet.id;
```
