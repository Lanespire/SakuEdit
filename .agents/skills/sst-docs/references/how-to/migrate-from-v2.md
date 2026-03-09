# Migrate from SST v2

> Source: https://sst.dev/docs/migrate-from-v2/

## Overview

This comprehensive guide helps SST v2 users migrate to v3. SST v3 has been around for a few months with a pretty sizeable community on Discord. The guide provides a reference migration of the demo notes app.

## Major Changes

### Architecture Shifts

**No CloudFormation/CDK**: v3 eliminates CloudFormation and CDK dependencies. Resources are defined in a single `sst.config.ts` file rather than stacks. Resource outputs now use Outputs instead of tokens, and application state stores locally with S3 backup.

**Provider Flexibility**: Instead of CDK fallbacks, v3 uses Pulumi's AWS provider and 150+ other providers, though these are primarily low-level resources compared to CDK's higher-level constructs.

### Configuration Changes

The `sst.config.ts` structure changes significantly:

- Global variables replace method arguments (`$app`, `$dev`)
- No stack-based organization
- Resources return from the `run()` method instead of using `addOutputs()`

### Development Workflow

`sst dev` now runs a multiplexer deploying your app and frontends together -- eliminating the need for separate frontend startup or `sst bind` wrapping. The `sst build` command is replaced by `sst diff` for deployment previewing.

## Migration Strategy

### Phased Approach

1. Deploy empty v3 app to verify configuration
2. Migrate transient resources (Function, Topic, Queue) by recreation
3. Import data-containing resources (RDS, Table, Bucket) for production
4. Handle custom domains through staged deployment to avoid downtime
5. Manage subscribers separately to prevent double-processing

### Resource Handling

**Transient Resources**: Can be recreated freely.

**Data Resources**: For production, use import/transform props. In the error message, you'll see the props you need to change.

**Custom Domains**: Deploy without domains first, then flip DNS using override.

## Client/SDK Updates

### Resource Binding

Access linked resources through the `Resource` module:

```typescript
// v3 approach
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

### Secrets

Secrets are encrypted in state files rather than stored in SSM. Loading no longer requires top-level await.

### Removed Features

Handlers and hooks from v2 are unsupported but can be imported via `sstv2` alias if both versions are installed.

## Component Migration

The guide provides detailed comparisons for 23+ components including Api, Job, RDS, Cron, Table, Topic, Queue, Config, Bucket, Service, Cognito, Function, and various site builders (Astro, Remix, Next.js, SvelteKit, SolidStart).

### Key Component Changes

| v2 Component | v3 Component | Notes |
|---|---|---|
| Api | ApiGatewayV2 | Renamed |
| Job | Task | Fargate-based |
| Table | Dynamo | Renamed |
| Cognito | CognitoUserPool / CognitoIdentityPool | Split into two |
| `customDomain` prop | `domain` prop | Simplified naming |
| All Site components | Updated equivalents | Astro, Remix, Next.js, SvelteKit, SolidStart |

## Unsupported Features

- **Auth**: In beta
- **Script**: Not supported
- **Python runtime**: Not supported
- **Container runtime**: Not supported
- **Custom function runtimes**: Not supported

GitHub issue references are available for tracking these features.

## Support

Feel free to let the SST team know via the linked GitHub issues if these are blockers for you.
