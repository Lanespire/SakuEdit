# Amazon EKS

> Source: https://www.pulumi.com/registry/packages/eks
> Package: `eks`
> SST Install: `sst add eks`

## Overview

The Amazon EKS provider is a Pulumi component that simplifies creating and managing the resources necessary to run an EKS Kubernetes cluster in AWS. It streamlines cluster setup with minimal configuration, wrapping the complexity of VPCs, IAM roles, node groups, and other AWS resources into a high-level component. Part of Pulumi's Crosswalk for AWS framework.

## Configuration

### Prerequisites

Amazon EKS must be configured with AWS credentials to deploy and update resources. Standard AWS credential configuration methods apply:
- AWS CLI profile (`aws configure`)
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- IAM roles

### Pulumi Config

```bash
pulumi config set aws:region us-west-2
```

### Key Parameters (Cluster)

- `vpcId` - VPC to deploy the cluster in
- `subnetIds` - Subnets for the cluster
- `instanceType` - EC2 instance type for worker nodes
- `desiredCapacity` - Desired number of worker nodes
- `minSize` / `maxSize` - Auto-scaling group bounds
- `nodeRootVolumeSize` - Worker node root volume size
- `version` - Kubernetes version
- `enabledClusterLogTypes` - CloudWatch log types to enable

## Key Resources

- `eks.Cluster` - Primary component for creating EKS clusters (includes VPC, IAM, node groups)
- `eks.NodeGroup` - Manage additional node groups
- `eks.ManagedNodeGroup` - AWS-managed node groups
- `eks.VpcCni` - VPC CNI plugin configuration

## Example

```typescript
import * as eks from "@pulumi/eks";
import * as pulumi from "@pulumi/pulumi";

// Create an EKS cluster with minimal config
const cluster = new eks.Cluster("my-cluster", {
  instanceType: "t3.medium",
  desiredCapacity: 2,
  minSize: 1,
  maxSize: 4,
});

// Export the kubeconfig
export const kubeconfig = cluster.kubeconfig;

// Use the cluster's provider to deploy K8s resources
import * as k8s from "@pulumi/kubernetes";

const appLabels = { app: "nginx" };
const deployment = new k8s.apps.v1.Deployment("nginx", {
  spec: {
    selector: { matchLabels: appLabels },
    replicas: 2,
    template: {
      metadata: { labels: appLabels },
      spec: {
        containers: [{
          name: "nginx",
          image: "nginx",
        }],
      },
    },
  },
}, { provider: cluster.provider });
```
