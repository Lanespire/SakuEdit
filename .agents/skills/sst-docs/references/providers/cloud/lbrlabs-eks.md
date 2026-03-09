# LBr Labs EKS

> Source: https://www.pulumi.com/registry/packages/lbrlabs-eks
> Package: `@lbrlabs/pulumi-eks`
> SST Install: `sst add @lbrlabs/pulumi-eks`

## Overview

The LBr Labs EKS component is a batteries-included solution for provisioning production-ready Amazon EKS clusters through Pulumi. It bundles essential Kubernetes addons and operators, enabling users to establish functioning EKS environments quickly.

- **Current Version:** v1.6.0
- **Publisher:** lbrlabs
- **Repository:** [lbrlabs/pulumi-lbrlabs-eks](https://github.com/lbrlabs/pulumi-lbrlabs-eks)
- **Languages:** TypeScript/JavaScript, Python, C#/.NET, Go, YAML

## Configuration

### Prerequisites

- VPC with public and private subnets
- Appropriate Kubernetes tags on subnets

### Key Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clusterSubnetIds` | string[] | Yes | Private subnets for cluster control plane |
| `systemNodeSubnetIds` | string[] | Yes | Subnets for system node group |
| `systemNodeInstanceTypes` | string[] | Yes | EC2 instance types (e.g., `"t3.large"`) |
| `systemNodeDesiredCount` | number | Yes | Number of system nodes |
| `letsEncryptEmail` | string | Yes | Email for Let's Encrypt certificate registration |

## Key Resources

### Cluster

Main component orchestrating all control plane and addon deployments:

- **EKS Control Plane** with CloudTrail logging and KMS secret encryption
- **System Node Group** with taints to isolate system workloads
- **AWS Add-ons:** EBS CSI Driver (IRSA), VPC CNI Add-on (IRSA), CoreDNS
- **Kubernetes Controllers:** Internal/external NGINX ingress controllers, External DNS (Route53 via IRSA), Cert Manager (Let's Encrypt)

### AttachedNodeGroup

Create additional worker node pools with custom scaling policies.

### IamRoleMapping

Maps AWS IAM roles to Kubernetes user identities for authentication and authorization.

## Example

```typescript
import * as lbrlabs_eks from "@lbrlabs/pulumi-eks";

const cluster = new lbrlabs_eks.Cluster("cluster", {
  clusterSubnetIds: vpc.privateSubnetIds,
  systemNodeSubnetIds: vpc.publicSubnetIds,
  systemNodeInstanceTypes: ["t3.large"],
  systemNodeDesiredCount: 4,
  letsEncryptEmail: "mail@lbrlabs.com",
});

// Add a worker node group
const nodeGroup = new lbrlabs_eks.AttachedNodeGroup("workers", {
  clusterName: cluster.controlPlane.name,
  subnetIds: vpc.privateSubnetIds,
  scalingConfig: {
    desiredSize: 3,
    maxSize: 10,
    minSize: 1,
  },
});
```
