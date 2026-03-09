# Environment Variables

> Source: https://sst.dev/docs/environment-variables/

## Overview

SST provides comprehensive environment variable management through `sst.config.ts` rather than relying on traditional `.env` files. The platform discourages `.env` file dependency while still supporting them for backward compatibility.

## Recommended Approaches

### Resource Linking

Instead of storing database URLs in `.env` files, SST enables direct resource linking:

```typescript
const rds = new sst.aws.Postgres("MyPostgres");
new sst.aws.Nextjs("MyWeb", { link: [rds] });
```

Access linked resources via the JS SDK:

```typescript
import { Resource } from "sst";

export const db = drizzle(client, {
  schema,
  database: Resource.MyPostgres.database,
  secretArn: Resource.MyPostgres.secretArn,
  resourceArn: Resource.MyPostgres.clusterArn
});
```

**Key advantages:**

- No separate database deployment with credential storage
- Automatic stage management
- Team collaboration without shared credential files
- Single command deployment: `sst deploy`

### Secrets Management

SST includes built-in secret handling:

```typescript
const secret = new sst.Secret("MySecret");
new sst.aws.Nextjs("MyWeb", { link: [secret] });
```

Set secrets via CLI:

```bash
sst secret set MySecret my-secret-value
```

This prevents accidental Git commits of sensitive information.

### Stage-Specific Configuration

For non-sensitive, stage-dependent config (like monitoring URLs):

```typescript
const SENTRY_DSN = $app.stage !== "prod"
  ? "https://foo@sentry.io/bar"
  : "https://baz@sentry.io/qux";

new sst.aws.Nextjs("MyWeb", {
  environment: {
    SENTRY_DSN
  }
});
```

## Traditional Approach

### Runtime Environment Variables

Variables can be passed during deployment:

```bash
SOME_ENV_VAR=FOO sst deploy
```

Access in `sst.config.ts`:

```typescript
async run() {
  console.log(process.env.SOME_ENV_VAR); // FOO
}
```

**Important:** Variables must be manually added to frontends/functions -- they're not automatically distributed.

### .env Files

Root-level `.env` files are loaded into `process.env`:

```
SOME_ENV_VAR=FOO
```

Stage-specific files (`.env.dev`, `.env.prod`) are loaded based on deployment stage:

```
SOME_ENV_VAR=BAR
```

### .env File Loading Order

1. `.env.{stage}.local` (highest priority)
2. `.env.{stage}`
3. `.env.local`
4. `.env` (lowest priority)

SST acknowledges this traditional method works but explicitly advises against it due to complexity and security concerns.

## Best Practices

- **Prefer Resource Linking** over environment variables for AWS resources
- **Use Secrets** for sensitive values (API keys, tokens, passwords)
- **Use `environment` prop** for non-sensitive, stage-specific configuration
- **Avoid `.env` files** when possible -- use SST's built-in mechanisms instead
- **Never commit `.env` files** to version control
