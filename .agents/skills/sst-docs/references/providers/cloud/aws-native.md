# AWS Native (Cloud Control)

> Source: https://www.pulumi.com/registry/packages/aws-native/
> Package: `aws-native`
> SST Install: `sst add aws-native`

## Overview

The AWS Cloud Control provider for Pulumi manages AWS resources through the AWS Cloud Control API, which typically supports new AWS features on the day of launch. This provider offers same-day access to new AWS resources and covers all resources available in the AWS Cloud Control API. Note that some AWS resources are not yet available in AWS Cloud Control -- new projects should generally start with the primary `aws` provider unless specific Cloud Control resources are needed.

## Configuration

### Environment Variables

```bash
export AWS_ACCESS_KEY_ID=<YOUR_ACCESS_KEY_ID>
export AWS_SECRET_ACCESS_KEY=<YOUR_SECRET_ACCESS_KEY>
export AWS_REGION=us-east-1
```

### Pulumi Config

```bash
pulumi config set aws-native:region us-east-1
pulumi config set aws-native:accessKey <YOUR_ACCESS_KEY_ID> --secret
pulumi config set aws-native:secretKey <YOUR_SECRET_ACCESS_KEY> --secret
```

### Shared Credentials File

Uses the same `~/.aws/credentials` file as the standard AWS provider. Supports named profiles via `AWS_PROFILE` or `aws-native:profile` config.

### Key Configuration Options

| Option | Description |
|--------|-------------|
| `region` | AWS region (required) |
| `accessKey` | AWS access key ID |
| `secretKey` | AWS secret access key |
| `profile` | Named AWS credential profile |
| `assumeRole` | Cross-account IAM role assumption |
| `defaultTags` | Tags applied to all resources |

Credentials remain local and are never transmitted to pulumi.com -- authentication occurs directly with AWS.

## Key Resources

- **S3**: `awsnative.s3.Bucket`, `awsnative.s3.AccessPoint`
- **S3 Object Lambda**: `awsnative.s3objectlambda.AccessPoint`
- **CloudFormation Extensions**: `awsnative.ExtensionResource` (access resources not yet in the SDK)
- Hundreds of additional AWS resources available via Cloud Control API

## Example

```typescript
import * as awsnative from "@pulumi/aws-native";

// Create an S3 bucket
const bucket = new awsnative.s3.Bucket("source");

// Create an S3 Access Point
const accessPoint = new awsnative.s3.AccessPoint("ap", {
  bucket: bucket.id,
});

// Create an S3 Object Lambda Access Point
const objectlambda = new awsnative.s3objectlambda.AccessPoint("objectlambda-ap", {
  objectLambdaConfiguration: {
    supportingAccessPoint: accessPoint.arn,
    transformationConfigurations: [{
      actions: ["GetObject"],
      contentTransformation: {
        AwsLambda: {
          FunctionArn: fn.arn,
        },
      },
    }],
  },
});

export const bucketName = bucket.id;
```
