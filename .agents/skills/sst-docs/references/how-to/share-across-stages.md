# Share Across Stages

> Source: https://sst.dev/docs/share-across-stages/

## Overview

SST applications define all resources in `sst.config.ts`, which are created for each deployment stage. However, certain resources may be shared across stages rather than recreated.

## Why Share Resources

Sharing resources across stages is recommended for:

- **Expensive infrastructure**: Resources with non-pay-per-use pricing models, such as Postgres clusters
- **Shared data**: Resources containing data that multiple stages need to access, like staging environments for PR testing

The documentation advises against over-sharing, recommending this approach only for the above scenarios.

## How to Share Resources

Several SST components include a `static get` method, enabling resource sharing:

- `Vpc`
- `Email`
- `Bucket`
- `Postgres`
- `CognitoUserPool`
- `CognitoIdentityPool`

Complex components like `Nextjs` and `StaticSite` are not supported for sharing due to their numerous dependencies.

## Implementation Example

Using the Bucket component's `get` method:

```typescript
const bucket = $app.stage === "frank"
  ? sst.aws.Bucket.get("MyBucket", "app-dev-mybucket-12345678")
  : new sst.aws.Bucket("MyBucket");
```

This example uses `$app.stage` to conditionally reference an existing bucket from the `dev` stage when deploying to the `frank` stage.

To locate the bucket name, output it during the `dev` deployment:

```typescript
return { bucket: bucket.name };
```

The output displays the auto-generated name (e.g., `app-dev-mybucket-12345678`).

## Additional Examples

### Sharing a VPC

```typescript
const vpc = $app.stage === "dev"
  ? new sst.aws.Vpc("MyVpc")
  : sst.aws.Vpc.get("MyVpc", "vpc-0be8fa4de860618bb");
```

### Sharing a Postgres Cluster

```typescript
const db = $app.stage === "dev"
  ? new sst.aws.Postgres("MyDB", { vpc })
  : sst.aws.Postgres.get("MyDB", {
      clusterArn: "arn:aws:rds:...",
      secretArn: "arn:aws:secretsmanager:...",
      database: "mydb"
    });
```

## Best Practices

- Only share resources when there is a clear cost or data-sharing benefit
- Always output resource identifiers from the owning stage for reference
- Use `$app.stage` conditionals to determine when to create vs. reference
- Avoid sharing complex components with many sub-resources
