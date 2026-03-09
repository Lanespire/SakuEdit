---
name: sst-docs
description: >
  SST (Serverless Stack) v3 comprehensive documentation skill. Use when building, configuring, deploying, or
  troubleshooting SST applications. Covers core concepts (Live dev, State, Linking, Providers, Components),
  40+ AWS components, 4 Cloudflare components, 150+ external providers (Pulumi/Terraform), getting started
  guides for 23+ frameworks, and best practices for infrastructure-as-code with SST.
alwaysApply: false
license: MIT
metadata:
  author: community
  version: "1.0.0"
  source: https://sst.dev/docs/
  date: February 2026
  abstract: >
    Complete SST v3 documentation as a Claude Code skill. SST is a framework for building modern
    full-stack applications on your own infrastructure. It uses Pulumi/Terraform under the hood
    and supports AWS, Cloudflare, and 150+ providers. This skill provides implementation guidance,
    component API references, provider documentation, and best practices.
---

# SST v3 Documentation

SST is a framework for building modern full-stack applications on your own infrastructure.
Your entire app — frontends, functions, databases, queues, cron jobs, and 150+ provider
integrations — is defined in a single `sst.config.ts` file.

## When to Use This Skill

- Setting up a new SST project or adding SST to an existing app
- Configuring AWS or Cloudflare components (Next.js, Functions, Buckets, Queues, etc.)
- Adding external providers (Stripe, Vercel, Auth0, Supabase, etc.)
- Understanding Resource Linking, Live dev, or State management
- Deploying to stages (dev, staging, production)
- Troubleshooting SST configuration or deployment issues

## Quick Reference

### Installation

```bash
# npm (Node.js projects)
npm install sst

# Global install (non-Node)
curl -fsSL https://sst.dev/install | bash
```

### Project Config (`sst.config.ts`)

```typescript
/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "my-app",
      removal: input?.stage === "production" ? "retain" : "remove",
      providers: {
        aws: { region: "us-east-1" }
      }
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket("MyBucket");
    new sst.aws.Nextjs("MyWeb", {
      link: [bucket],
      domain: "my-app.com"
    });
  }
});
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `sst dev` | Start local dev with Live functions + tunnels |
| `sst deploy --stage <name>` | Deploy to a stage |
| `sst remove --stage <name>` | Remove all resources in a stage |
| `sst add <provider>` | Add a provider (e.g., `sst add stripe`) |
| `sst shell` | Open a shell with SST env vars |
| `sst refresh` | Resync state with actual cloud resources |
| `sst unlock` | Unlock a stuck deployment |

### Resource Linking

```typescript
// sst.config.ts — link resources
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Function("MyFunction", {
  handler: "index.handler",
  link: [bucket]
});

// Runtime code — access linked resources
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

## Core Concepts

### Live Dev (`sst dev`)
Runs a multiplexer that: deploys infrastructure, proxies Lambda invocations to localhost,
creates VPC tunnels for database access, and starts frontends/containers locally.
Use only in personal stages.

### State
SST tracks all resources in a state tree stored locally and backed up to your cloud account.
Never delete the state storage bucket. Use `sst refresh` to resync after manual changes.
Avoid manually modifying SST-managed resources.

### Linking
Bridges infrastructure code (deploy-time) with runtime code (user-facing).
Link resources in config, access them via `Resource` import in runtime.
Supports type-safe access with auto-generated types.

### Providers
SST supports AWS and Cloudflare natively. Add 150+ external providers via Pulumi/Terraform:
```bash
sst add <provider>  # e.g., sst add stripe
```
No Pulumi account needed — everything runs locally.

### Components
High-level building blocks: `sst.aws.Nextjs`, `sst.aws.Function`, `sst.aws.Bucket`, etc.
Components create multiple low-level cloud resources and can be customized via `transform`.

### Stages
Isolated environments: personal (auto from username), dev, staging, production.
Each stage has its own resources. Deploy with `--stage <name>`.

## Component Selection Guide

| Use Case | Component |
|----------|-----------|
| Next.js app | `sst.aws.Nextjs` |
| React SPA | `sst.aws.React` |
| Remix app | `sst.aws.Remix` |
| Astro site | `sst.aws.Astro` |
| SvelteKit | `sst.aws.SvelteKit` |
| SolidStart | `sst.aws.SolidStart` |
| Static site | `sst.aws.StaticSite` |
| REST/GraphQL API | `sst.aws.ApiGatewayV2` |
| Lambda function | `sst.aws.Function` |
| Container service | `sst.aws.Service` + `sst.aws.Cluster` |
| Cron job | `sst.aws.Cron` |
| S3 bucket | `sst.aws.Bucket` |
| PostgreSQL | `sst.aws.Postgres` |
| MySQL/Aurora | `sst.aws.Aurora` / `sst.aws.Mysql` |
| DynamoDB | `sst.aws.Dynamo` |
| Redis/Valkey | `sst.aws.Redis` |
| SQS queue | `sst.aws.Queue` |
| SNS topic | `sst.aws.SnsTopic` |
| EventBridge bus | `sst.aws.Bus` |
| Email (SES) | `sst.aws.Email` |
| Realtime (IoT) | `sst.aws.Realtime` |
| Vector search | `sst.aws.Vector` |
| Auth (Cognito) | `sst.aws.CognitoUserPool` |
| Auth (OpenAuth) | `sst.aws.Auth` |
| Step Functions | `sst.aws.StepFunctions` |
| AppSync GraphQL | `sst.aws.AppSync` |
| OpenSearch | `sst.aws.OpenSearch` |
| Kinesis stream | `sst.aws.KinesisStream` |
| EFS file system | `sst.aws.Efs` |
| VPC | `sst.aws.Vpc` |
| CDN/Router | `sst.aws.Router` |
| CF Worker | `sst.cloudflare.Worker` |
| CF KV | `sst.cloudflare.Kv` |
| CF D1 | `sst.cloudflare.D1` |
| CF R2 Bucket | `sst.cloudflare.Bucket` |

## Best Practices

1. **One config file**: Keep all infrastructure in `sst.config.ts` (or split to `infra/` in monorepos)
2. **Use Resource Linking**: Never hardcode ARNs, bucket names, or connection strings
3. **Stage isolation**: Each developer uses personal stage; shared dev/staging/production
4. **Protect production**: Set `removal: "retain"` for production databases and buckets
5. **Use transforms**: Customize low-level resources via `transform` instead of raw Pulumi
6. **Provider versions**: Pin provider versions in config for reproducible deployments
7. **State safety**: Never delete state storage bucket; use `sst refresh` for drift
8. **Monorepo structure**: Use `infra/` directory for large projects; reference with relative paths

## Workflow

1. `sst dev` — develop locally with live reload and tunnels
2. Push to `dev` branch — auto-deploy to dev stage
3. Create PR — auto-create preview environment (`pr-<number>` stage)
4. Merge to production — auto-deploy to production stage
5. `sst remove --stage pr-<number>` — clean up preview env

## Reference Files

Detailed documentation is available in the `references/` directory:

- `references/concepts/` — Core concepts (Live, State, Linking, etc.)
- `references/how-to/` — Configuration guides (domains, monorepo, IAM, etc.)
- `references/components/aws/` — AWS component API reference (40+ components)
- `references/components/cloudflare/` — Cloudflare component API reference
- `references/providers/` — External provider documentation (150+ providers)
- `references/getting-started/` — Framework-specific setup guides (23+ frameworks)
- `references/reference/` — CLI, SDK, Global config, and Config reference
- `references/examples/` — 82+ example projects index

Read specific reference files when you need detailed API documentation or provider-specific guidance.
