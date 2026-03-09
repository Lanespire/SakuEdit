# AWS QuickStart VPC

> Source: https://www.pulumi.com/registry/packages/aws-quickstart-vpc
> Package: `aws-quickstart-vpc`
> SST Install: `sst add aws-quickstart-vpc`

## Overview

The AWS QuickStart VPC is a Pulumi component that streamlines creation of AWS Virtual Private Cloud infrastructure, aligned with AWS QuickStart VPC architectural recommendations.

- **Current Version:** v0.0.2
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-aws-quickstart-vpc](https://github.com/pulumi/pulumi-aws-quickstart-vpc)

## Configuration

| Parameter | Description | Example |
|-----------|-------------|---------|
| `cidrBlock` | CIDR block for the VPC | `"10.0.0.0/16"` |
| `availabilityZoneConfig` | Array of AZ configurations | See below |

### Availability Zone Config

Each entry in `availabilityZoneConfig` specifies:

- `availabilityZone` - AZ name (e.g., `"us-west-2a"`)
- `publicSubnetCidr` - Public subnet CIDR (optional)
- `privateSubnetACidr` - Private subnet CIDR

## Key Resources

### Vpc

The primary component that generates:

- VPC instance with specified CIDR blocks
- Public subnets across availability zones
- Private subnets with customizable CIDR ranges
- NAT gateways for outbound traffic from private subnets

### Outputs

- `vpcID` - VPC identifier
- `publicSubnetIDs` - List of public subnet IDs
- `privateSubnetIDs` - List of private subnet IDs
- `natgatewayIPs` - NAT gateway IP addresses

## Example

```typescript
import * as vpc from "@pulumi/aws-quickstart-vpc";

const vpcInstance = new vpc.Vpc("demo-vpc", {
  cidrBlock: "10.0.0.0/16",
  availabilityZoneConfig: [
    {
      availabilityZone: "us-west-2a",
      publicSubnetCidr: "10.0.128.0/20",
      privateSubnetACidr: "10.0.32.0/19",
    },
    {
      availabilityZone: "us-west-2b",
      publicSubnetCidr: "10.0.144.0/20",
      privateSubnetACidr: "10.0.64.0/19",
    },
  ],
});

export const vpcID = vpcInstance.vpcID;
export const publicSubnetIDs = vpcInstance.publicSubnetIDs;
export const privateSubnetIDs = vpcInstance.privateSubnetIDs;
export const natgatewayIPs = vpcInstance.natgatewayIPs;
```
