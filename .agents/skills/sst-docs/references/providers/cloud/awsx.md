# AWSx (Pulumi Crosswalk for AWS)

> Source: https://www.pulumi.com/registry/packages/awsx
> Package: `awsx`
> SST Install: `sst add awsx`

## Overview

AWSx (Pulumi Crosswalk for AWS) is a library that leverages automatic well-architected best practices to make common infrastructure-as-code tasks in AWS easier and more secure. It utilizes the AWS SDK for managing and provisioning resources across Amazon Web Services.

- **Current Version:** v3.1.0
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-awsx](https://github.com/pulumi/pulumi-awsx)
- **Languages:** TypeScript/JavaScript, Python, Go, C#, Java, YAML

## Configuration

AWS credentials must be configured before deployment. The package supports standard AWS credential configuration methods (environment variables, AWS profiles, etc.). Detailed instructions are available in the Installation & Configuration section of the documentation.

## Key Resources

### EC2 / Networking

- **Vpc** - Provision Virtual Private Clouds with default security settings and best-practice subnet configurations
- Automatic public/private subnet creation
- NAT Gateway management
- Security group defaults

### ECS (Elastic Container Service)

- **FargateService** - Deploy containerized applications on AWS Fargate
- **EC2Service** - Deploy containers on EC2 instances

### CloudWatch

- Simplified log group and metric alarm creation

### Load Balancing

- Application Load Balancer (ALB) abstractions
- Target group management

## Example

```typescript
import * as awsx from "@pulumi/awsx";

// Create a VPC with best-practice defaults
const vpc = new awsx.ec2.Vpc("custom");
export const vpcId = vpc.vpcId;
```

```python
import pulumi_awsx as awsx

vpc = awsx.ec2.Vpc("custom")
pulumi.export("vpcId", vpc.vpc_id)
```

```yaml
resources:
  vpc:
    type: awsx:ec2:Vpc
    properties: {}
outputs:
  vpcId: ${vpc.vpcId}
```
