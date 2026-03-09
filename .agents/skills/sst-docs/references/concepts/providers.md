# Providers

> Source: https://sst.dev/docs/providers/

## Overview

A provider is what allows SST to interact with the APIs of various cloud services. Providers are packages installable through `sst.config.ts`. SST supports 150+ providers including AWS, Azure, GCP, Cloudflare, Stripe, Vercel, and Auth0.

## Installation

To add a provider, run:

```bash
sst add <provider>
```

This command adds the provider to your config, installs packages, and adds the provider namespace to globals.

**Important:** Do not import provider packages directly in `sst.config.ts`. SST manages these internally.

**Multiple providers are supported.** Example configuration:

```typescript
{
  providers: {
    aws: "6.27.0",
    cloudflare: "5.37.1"
  }
}
```

For instance, `sst add planetscale` adds:

```typescript
{
  providers: {
    planetscale: "0.0.7"
  }
}
```

## Configuration

### Basic Setup

Customize provider behavior in `sst.config.ts`:

```typescript
{
  providers: {
    aws: {
      region: "us-west-2"
    }
  }
}
```

### Versions

Install specific versions by modifying the configuration:

```typescript
{
  providers: {
    aws: {
      version: "6.27.0"
    }
  }
}
```

**Note:** Providers don't auto-update. They stick to the version that was installed initially. Run `sst install` after updating provider versions.

### Credentials

Most providers read credentials from environment variables. Example for Cloudflare:

```bash
export CLOUDFLARE_API_TOKEN=aaaaaaaa_aaaaaaaaaaaa_aaaaaaaa
```

Alternatively, pass credentials through config:

```typescript
{
  providers: {
    cloudflare: {
      apiToken: "aaaaaaaa_aaaaaaaaaaaa_aaaaaaaa"
    }
  }
}
```

## Components

Provider packages include components accessible via namespacing:

```typescript
new aws.s3.BucketV2("b", {
  bucket: "mybucket",
  tags: {
    Name: "My bucket"
  }
});
```

SST also provides built-in higher-level components for common features.

## Functions

Providers expose helper functions (listed as `getXXXXXX` in Pulumi docs).

### Async Functions

Get AWS account information:

```typescript
const current = await aws.getCallerIdentity({});
const accountId = current.accountId;
const callerArn = current.arn;
const callerUser = current.userId;
```

Get current region:

```typescript
const current = await aws.getRegion({});
const region = current.name;
```

### Output Versions (Recommended)

**Tip:** Outputs don't block your deployments. Use Output versions for non-blocking calls:

```typescript
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  environment: {
    ACCOUNT: aws.getCallerIdentityOutput({}).accountId,
    REGION: aws.getRegionOutput().name
  }
});
```

Output functions return `Output<primitive>` types.

## Instances

Create multiple provider instances for multi-region or multi-account deployments:

```typescript
const useast1 = new aws.Provider("AnotherAWS");
```

### Multi-Region Example

Deploy resources to different regions:

```typescript
const useast1 = new aws.Provider("useast1", {
  region: "us-east-1"
});

new sst.aws.Function("MyFunction", "src/lambda.handler");

new aws.acm.Certificate("cert", {
  domainName: "foo.com",
  validationMethod: "EMAIL",
}, { provider: useast1 });
```

Here the function deploys to the default region while the certificate deploys to `us-east-1`.
