# AWS QuickStart Redshift

> Source: https://www.pulumi.com/registry/packages/aws-quickstart-redshift
> Package: `aws-quickstart-redshift`
> SST Install: `sst add aws-quickstart-redshift`

## Overview

This Pulumi package enables easy creation of AWS Redshift clusters based on the AWS QuickStart Redshift guide. It wraps AWS QuickStart best practices into a reusable component available in all Pulumi languages.

- **Current Version:** v0.0.3
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-aws-quickstart-redshift](https://github.com/pulumi/pulumi-aws-quickstart-redshift)

## Configuration

| Parameter | Description | Example |
|-----------|-------------|---------|
| `vpcID` | VPC for the cluster | `"vpc-xxx"` |
| `subnetIDs` | List of private subnet IDs | `["subnet-xxx"]` |
| `dbMasterUsername` | Master database username | `"admin"` |
| `dbMasterPassword` | Master database password (secret) | `pulumi.secret("...")` |
| `dbName` | Database name | `"mydb"` |
| `dbNodeType` | Node type | `"dc2.large"` |
| `dbClusterIdentifier` | Cluster identifier/name | `"my-cluster"` |
| `enableEventSubscription` | Enable event notifications | `true` / `false` |

## Key Resources

### Cluster

The primary resource that orchestrates creation of an AWS Redshift cluster with associated networking and configuration settings based on AWS QuickStart guidelines.

## Example

```typescript
import * as redshift from "@pulumi/aws-quickstart-redshift";
import * as pulumi from "@pulumi/pulumi";

const cluster = new redshift.Cluster("demo-cluster", {
  vpcID: "<vpcID>",
  subnetIDs: ["<privateSubnetID1>", "<privateSubnetID2>"],
  dbMasterPassword: pulumi.secret("Password1!"),
  dbMasterUsername: "test-username",
  dbName: "test_database",
  dbNodeType: "dc2.large",
  dbClusterIdentifier: "demo-cluster",
  enableEventSubscription: false,
});
```
