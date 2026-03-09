# Alibaba Cloud

> Source: https://www.pulumi.com/registry/packages/alicloud/
> Package: `alicloud`
> SST Install: `sst add alicloud`

## Overview

The Alibaba Cloud provider is used to interact with the many resources supported by Alibaba Cloud. It enables provisioning of compute (ECS), networking (VPC), storage (OSS), databases (RDS), serverless functions, Kubernetes, and many other Alibaba Cloud services.

## Configuration

### Environment Variables

```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID=<your-access-key>
export ALIBABA_CLOUD_ACCESS_KEY_SECRET=<your-secret-key>
export ALIBABA_CLOUD_REGION=cn-beijing
```

### Pulumi Config

```bash
pulumi config set alicloud:accessKey <your-access-key> --secret
pulumi config set alicloud:secretKey <your-secret-key> --secret
pulumi config set alicloud:region cn-beijing
```

### Authentication Methods (Priority Order)

1. **Static Credentials**: Inline `accessKey`, `secretKey`, and `region`
2. **Environment Variables**: `ALIBABA_CLOUD_ACCESS_KEY_ID`, `ALIBABA_CLOUD_ACCESS_KEY_SECRET`, `ALIBABA_CLOUD_REGION`
3. **Shared Credentials File**: `~/.aliyun/config.json` (configurable)
4. **ECS Instance Role**: Automatic credential retrieval from instance metadata
5. **RAM Role Assumption**: Cross-account role switching
6. **OIDC Token Authentication**: For workload identity scenarios
7. **Sidecar Credentials**: External credential service integration

### Key Configuration Options

| Option | Description |
|--------|-------------|
| `accessKey` | Access key ID (required) |
| `secretKey` | Secret access key (required) |
| `region` | Target region (default: `cn-beijing`) |
| `securityToken` | STS temporary credentials |
| `accountId` | Account ID (auto-retrieved if not provided) |
| `profile` | Named profile from credentials file |
| `assumeRole` | Cross-account role assumption |
| `endpoints` | Custom service endpoint overrides |

## Key Resources

- **ECS**: `alicloud.ecs.Instance`, `alicloud.ecs.SecurityGroup`
- **VPC**: `alicloud.vpc.Network`, `alicloud.vpc.Switch`
- **OSS**: `alicloud.oss.Bucket`
- **RDS**: `alicloud.rds.Instance`, `alicloud.rds.Database`
- **SLB**: `alicloud.slb.LoadBalancer`
- **Container Service**: `alicloud.cs.ManagedKubernetes`
- **Function Compute**: `alicloud.fc.Function`, `alicloud.fc.Service`
- **DNS**: `alicloud.dns.Record`
- **KMS**: `alicloud.kms.Key`
- **RAM**: `alicloud.ram.Role`, `alicloud.ram.Policy`

## Example

```typescript
import * as alicloud from "@pulumi/alicloud";

// Get available zones
const zones = alicloud.getZones({
  availableDiskCategory: "cloud_efficiency",
  availableResourceCreation: "VSwitch",
});

// Create a VPC
const vpc = new alicloud.vpc.Network("myVpc", {
  vpcName: "my-vpc",
  cidrBlock: "172.16.0.0/16",
});

// Create a VSwitch
const vswitch = new alicloud.vpc.Switch("mySwitch", {
  vpcId: vpc.id,
  cidrBlock: "172.16.0.0/24",
  zoneId: zones.then(z => z.zones?.[0]?.id),
  vswitchName: "my-vswitch",
});

// Create a security group
const sg = new alicloud.ecs.SecurityGroup("mySg", {
  vpcId: vpc.id,
  description: "My security group",
});

// Create an ECS instance
const instance = new alicloud.ecs.Instance("myInstance", {
  availabilityZone: zones.then(z => z.zones?.[0]?.id),
  securityGroups: [sg.id],
  instanceType: "ecs.n4.large",
  systemDiskCategory: "cloud_efficiency",
  imageId: "ubuntu_22_04_x64_20G_alibase_20230208.vhd",
  vswitchId: vswitch.id,
  internetMaxBandwidthOut: 10,
});

export const instanceId = instance.id;
export const vpcId = vpc.id;
```
