# AWS QuickStart Aurora PostgreSQL

> Source: https://www.pulumi.com/registry/packages/aws-quickstart-aurora-postgres
> Package: `aws-quickstart-aurora-postgres`
> SST Install: `sst add aws-quickstart-aurora-postgres`

## Overview

This Pulumi package enables infrastructure-as-code deployment of AWS Aurora PostgreSQL clusters based on AWS QuickStart guidelines. It simplifies creating managed Aurora PostgreSQL database clusters, abstracting the complexity of manual AWS configuration.

- **Current Version:** v0.0.3
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-aws-quickstart-aurora-postgres](https://github.com/pulumi/pulumi-aws-quickstart-aurora-postgres)

## Configuration

| Parameter | Description | Example |
|-----------|-------------|---------|
| `vpcID` | VPC ID for the cluster | `"vpc-xxx"` |
| `availabilityZoneNames` | Availability zones | `["us-east-1a", "us-east-1b"]` |
| `privateSubnetID1` | First private subnet | subnet ID |
| `privateSubnetID2` | Second private subnet | subnet ID |
| `dbName` | Database name | `"mydb"` |
| `dbEngineVersion` | Engine version | `"9.6.16"` |
| `dbInstanceClass` | Instance class | `"db.r4.large"` |
| `dbNumDbClusterInstances` | Cluster size | `2` |
| `dbMasterUsername` | Master username | `"admin"` |
| `dbMasterPassword` | Master password (secret) | `pulumi.secret("...")` |
| `dbParameterGroupFamily` | Parameter group family | `"aurora-postgresql9.6"` |
| `enableEventSubscription` | Event subscription flag | `true` / `false` |

## Key Resources

### Cluster

The primary component for managing Aurora PostgreSQL deployments. Creates a fully configured Aurora PostgreSQL cluster with:

- Multi-AZ deployment
- Subnet group configuration
- Parameter group management
- Event subscription (optional)
- Secret management for credentials

## Example

```typescript
import * as aurora from "@pulumi/aws-quickstart-aurora-postgres";
import * as pulumi from "@pulumi/pulumi";

const cluster = new aurora.Cluster("demo-cluster", {
  vpcID: "<vpcID>",
  availabilityZoneNames: ["us-east-1a", "us-east-1b"],
  privateSubnetID1: "<subnetId1>",
  privateSubnetID2: "<subnetId2>",
  dbName: "test_database",
  dbEngineVersion: "9.6.16",
  dbInstanceClass: "db.r4.large",
  dbNumDbClusterInstances: 2,
  dbMasterUsername: "test-username",
  dbMasterPassword: pulumi.secret("Password1!"),
  dbParameterGroupFamily: "aurora-postgresql9.6",
  enableEventSubscription: false,
});
```
