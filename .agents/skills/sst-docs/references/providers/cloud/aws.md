# AWS (Amazon Web Services)

> Source: https://www.pulumi.com/registry/packages/aws/
> Package: `aws`
> SST Install: `sst add aws`

## Overview

The AWS provider for Pulumi enables provisioning of cloud resources available in Amazon Web Services. It uses the AWS SDK to manage and provision resources, offering comprehensive infrastructure-as-code capabilities across all major AWS services including compute, storage, networking, databases, serverless, and more.

## Configuration

### Environment Variables

```bash
export AWS_ACCESS_KEY_ID=<YOUR_ACCESS_KEY_ID>
export AWS_SECRET_ACCESS_KEY=<YOUR_SECRET_ACCESS_KEY>
export AWS_REGION=us-east-1
```

### Pulumi Config

```bash
pulumi config set aws:region us-east-1
pulumi config set aws:accessKey <YOUR_ACCESS_KEY_ID> --secret
pulumi config set aws:secretKey <YOUR_SECRET_ACCESS_KEY> --secret
```

### Shared Credentials File

Use `~/.aws/credentials` (recommended). Generate with `aws configure` or create manually. Supports multiple profiles via `AWS_PROFILE` environment variable or `pulumi config set aws:profile <profilename>`.

### Key Configuration Options

| Option | Description |
|--------|-------------|
| `region` | AWS region (required) |
| `accessKey` | AWS access key ID |
| `secretKey` | AWS secret access key |
| `token` | Session token for temporary credentials |
| `profile` | Named AWS credentials profile |
| `assumeRole` | Cross-account IAM role assumption |
| `defaultTags` | Tags applied to all resources |

### Advanced Authentication

- **EC2 Instance Metadata**: Set `skipMetadataApiCheck: false`
- **WebIdentity/OIDC**: Configure via `assumeRoleWithWebIdentity` for GitHub Actions, GitLab CI, etc.
- **Pulumi ESC**: Centralized dynamic credential generation

## Key Resources

- **S3**: `aws.s3.Bucket`, `aws.s3.BucketObject`
- **Lambda**: `aws.lambda.Function`, `aws.lambda.LayerVersion`
- **API Gateway**: `aws.apigateway.RestApi`, `aws.apigatewayv2.Api`
- **DynamoDB**: `aws.dynamodb.Table`
- **ECS/ECR**: `aws.ecs.Cluster`, `aws.ecs.Service`, `aws.ecr.Repository`
- **EKS**: `aws.eks.Cluster`, `aws.eks.NodeGroup`
- **IAM**: `aws.iam.Role`, `aws.iam.Policy`
- **VPC**: `aws.ec2.Vpc`, `aws.ec2.Subnet`, `aws.ec2.SecurityGroup`
- **CloudFront**: `aws.cloudfront.Distribution`
- **RDS**: `aws.rds.Instance`, `aws.rds.Cluster`
- **SQS/SNS**: `aws.sqs.Queue`, `aws.sns.Topic`
- **CloudWatch**: `aws.cloudwatch.LogGroup`, `aws.cloudwatch.MetricAlarm`

## Example

```typescript
import * as aws from "@pulumi/aws";

// Create an S3 bucket
const bucket = new aws.s3.Bucket("my-bucket", {
  website: {
    indexDocument: "index.html",
  },
});

// Create a Lambda function
const lambdaRole = new aws.iam.Role("lambdaRole", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: { Service: "lambda.amazonaws.com" },
    }],
  }),
});

const fn = new aws.lambda.Function("myFunction", {
  runtime: "nodejs20.x",
  handler: "index.handler",
  role: lambdaRole.arn,
  code: new aws.s3.BucketObject("code", {
    bucket: bucket.id,
    key: "code.zip",
    source: new pulumi.asset.FileArchive("./app"),
  }),
});

export const bucketName = bucket.id;
export const functionArn = fn.arn;
```
