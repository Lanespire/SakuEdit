# Import Resources

> Source: https://sst.dev/docs/import-resources/

## Overview

Importing brings previously created resources into an SST app for ongoing management. This proves valuable during SST migrations or when incorporating manually created resources.

## How It Works

SST maintains a state file tracking all managed resources. When resources are imported, they become part of this state. Removing imported resources from code will also remove the actual resources -- they're treated as if SST created them originally.

### When Not to Import

**Avoid importing resources managed by other teams or different infrastructure-as-code tools.** Instead, use resource referencing capabilities. See the [Reference Resources](./reference-resources.md) guide.

## Import Process

Resources require specific properties for import, varying by resource type. For SST components, use a `transform` function to pass import configuration to underlying resources.

### SST Component Example

For an existing S3 bucket named `mybucket-xnbmhcvd`:

```typescript
new sst.aws.Bucket("MyBucket", {
  transform: {
    bucket: (args, opts) => {
      args.bucket = "mybucket-xnbmhcvd";
      args.forceDestroy = undefined;
      opts.import = "mybucket-xnbmhcvd";
    }
  }
});
```

Deploy with `sst deploy`. The system indicates mismatches between desired and existing configurations. Adjust arguments accordingly, then remove the `opts.import` line after successful import.

### Pulumi Resource Example

For low-level Pulumi resources without SST components:

```typescript
new aws.s3.BucketV2("MyBucket",
  {
    objectLockEnabled: undefined
  },
  {
    import: "mybucket-xnbmhcvd"
  }
);
```

Follow the same deployment and configuration adjustment process.

## Import Properties Reference

Common resources and their required import identifiers:

| Resource | Property | Example |
|---|---|---|
| `aws.s3.BucketV2` | Bucket name | `bucket-name` |
| `aws.ec2.Vpc` | VPC ID | `vpc-a01106c2` |
| `aws.iam.Role` | Role name | `role-name` |
| `aws.sqs.Queue` | Queue URL | `https://queue.amazonaws.com/...` |
| `aws.sns.Topic` | Topic ARN | `arn:aws:sns:...` |
| `aws.lambda.Function` | Function name | `function-name` |
| `aws.dynamodb.Table` | Table name | `table-name` |
| `aws.ecs.Cluster` | Cluster name | `cluster-name` |
| `aws.ecs.Service` | Cluster/service name | `cluster-name/service-name` |
| `aws.apigatewayv2.Api` | API ID | `12345abcde` |
| `aws.cognito.UserPool` | User Pool ID | `us-east-1_abc123` |

Refer to individual resource documentation for complete import specifications.
