# IAM Credentials

> Source: https://sst.dev/docs/iam-credentials/

## Overview

SST deploys AWS resources using your credentials. This guide covers configuration, required permissions, and customization strategies.

## Credentials Configuration

### From a Credentials File

AWS credentials are stored locally:

- **Linux/macOS:** `~/.aws/credentials`
- **Windows:** `C:\Users\USER_NAME\.aws\credentials`

**Basic format:**

```ini
[default]
aws_access_key_id = <YOUR_ACCESS_KEY_ID>
aws_secret_access_key = <YOUR_SECRET_ACCESS_KEY>
```

**Multiple profiles:**

```ini
[default]
aws_access_key_id = <DEFAULT_ACCESS_KEY_ID>
aws_secret_access_key = <DEFAULT_SECRET_ACCESS_KEY>

[staging]
aws_access_key_id = <STAGING_ACCESS_KEY_ID>
aws_secret_access_key = <STAGING_SECRET_ACCESS_KEY>

[production]
aws_access_key_id = <PRODUCTION_ACCESS_KEY_ID>
aws_secret_access_key = <PRODUCTION_SECRET_ACCESS_KEY>
```

**Using non-default profiles:**

```typescript
// sst.config.ts
{
  providers: {
    aws: {
      profile: "staging"
    }
  }
}
```

**Stage-dependent configuration:**

```typescript
app(input) {
  return {
    providers: {
      aws: {
        profile: input?.stage === "staging" ? "staging" : "default"
      }
    }
  };
}
```

### From Environment Variables

SST can detect credentials in environment:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` (for temporary credentials)

Useful for CI/CD deployments without credential files.

## Credential Precedence

When multiple credential sources exist, SST checks in this order:

1. **Environment variables** (including `.env` files)
2. **SST config** (`sst.config.ts`)
3. **AWS config** (`~/.aws/config`)
4. **Credential files** (`~/.aws/credentials`)

## IAM Permissions

Default setup uses `AdministratorAccess`. For enterprise environments, customize permissions based on actual needs.

### Bootstrap Permissions

SST bootstraps each AWS account/region once automatically. Required permissions:

**State bucket management:**

```json
{
  "Sid": "ManageBootstrapStateBucket",
  "Effect": "Allow",
  "Action": [
    "s3:CreateBucket",
    "s3:PutBucketVersioning",
    "s3:PutBucketNotification",
    "s3:PutBucketPolicy",
    "s3:DeleteObject",
    "s3:GetObject",
    "s3:ListBucket",
    "s3:PutObject"
  ],
  "Resource": ["arn:aws:s3:::sst-state-*"]
}
```

**Asset bucket management:**

```json
{
  "Sid": "ManageBootstrapAssetBucket",
  "Effect": "Allow",
  "Action": [
    "s3:CreateBucket",
    "s3:PutBucketVersioning",
    "s3:PutBucketNotification",
    "s3:PutBucketPolicy",
    "s3:DeleteObject",
    "s3:GetObject",
    "s3:ListBucket",
    "s3:PutObject"
  ],
  "Resource": ["arn:aws:s3:::sst-asset-*"]
}
```

**ECR repository:**

```json
{
  "Sid": "ManageBootstrapECRRepo",
  "Effect": "Allow",
  "Action": [
    "ecr:CreateRepository",
    "ecr:DescribeRepositories"
  ],
  "Resource": ["arn:aws:ecr:REGION:ACCOUNT:repository/sst-asset"]
}
```

**SSM parameters:**

```json
{
  "Sid": "ManageBootstrapSSMParameter",
  "Effect": "Allow",
  "Action": [
    "ssm:GetParameters",
    "ssm:PutParameter"
  ],
  "Resource": [
    "arn:aws:ssm:REGION:ACCOUNT:parameter/sst/passphrase/*",
    "arn:aws:ssm:REGION:ACCOUNT:parameter/sst/bootstrap"
  ]
}
```

### Deployment Permissions

Customize based on specific resources in your application:

```json
{
  "Sid": "Deployments",
  "Effect": "Allow",
  "Action": ["*"],
  "Resource": ["*"]
}
```

This is a template to be refined according to your actual resource requirements.

### CLI Permissions

**Secret management:**

```json
{
  "Sid": "ManageSecrets",
  "Effect": "Allow",
  "Action": [
    "ssm:DeleteParameter",
    "ssm:GetParameter",
    "ssm:GetParameters",
    "ssm:GetParametersByPath",
    "ssm:PutParameter"
  ],
  "Resource": ["arn:aws:ssm:REGION:ACCOUNT:parameter/sst/*"]
}
```

**Live Lambda socket connections:**

```json
{
  "Sid": "LiveLambdaSocketConnection",
  "Effect": "Allow",
  "Action": [
    "appsync:EventSubscribe",
    "appsync:EventPublish",
    "appsync:EventConnect"
  ],
  "Resource": ["*"]
}
```

## Minimizing Permissions

### Sandbox Accounts Strategy

Grant `AdministratorAccess` in separate AWS accounts for developer sandboxes. Eliminates repetitive permission modifications during development.

### IAM Access Analyzer Approach

For staging environments:

1. Start with broad permissions
2. Deploy and run your application
3. Use CloudTrail events to track actual usage
4. Generate precise policy using IAM Access Analyzer
5. Apply refined policy to production accounts

This generates a policy reflecting genuine resource activity and usage patterns.
