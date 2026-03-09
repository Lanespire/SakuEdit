# AWS S3 Replicated Bucket

> Source: https://www.pulumi.com/registry/packages/aws-s3-replicated-bucket
> Package: `aws-s3-replicated-bucket`
> SST Install: `sst add aws-s3-replicated-bucket`

## Overview

The AWS S3 Replicated Bucket Pulumi package streamlines creation of Amazon S3 buckets with cross-region replication capabilities. It automatically configures source and destination buckets with replication settings between them.

- **Current Version:** v0.0.6
- **Publisher:** Lee Zen / Pulumi
- **Repository:** [pulumi/pulumi-aws-s3-replicated-bucket](https://github.com/pulumi/pulumi-aws-s3-replicated-bucket)
- **Languages:** TypeScript/JavaScript, Python, Go, C#

## Configuration

| Parameter | Description | Example |
|-----------|-------------|---------|
| `destinationRegion` | Target AWS region for replication | `"us-east-1"` |

## Key Resources

### ReplicatedBucket

The primary component that creates:

- **sourceBucket** - The primary S3 bucket in the default AWS region
  - `.arn` - ARN of the source bucket
- **destinationBucket** - The replicated bucket in the specified destination region
  - `.arn` - ARN of the destination bucket
- Replication configuration between the two buckets

## Example

```typescript
import * as s3 from "@pulumi/aws-s3-replicated-bucket";

const bucket = new s3.ReplicatedBucket("my-bucket", {
  destinationRegion: "us-east-1",
});

export const sourceBucketArn = bucket.sourceBucket.arn;
export const destinationBucketArn = bucket.destinationBucket.arn;
```

```python
import pulumi
import pulumi_aws_s3_replicated_bucket as s3

bucket = s3.ReplicatedBucket("my-bucket",
    destination_region="us-east-1",
)

pulumi.export("sourceBucketArn", bucket.source_bucket.arn)
pulumi.export("destinationBucketArn", bucket.destination_bucket.arn)
```
