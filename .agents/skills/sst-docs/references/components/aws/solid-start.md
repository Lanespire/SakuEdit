# SolidStart

> Source: https://sst.dev/docs/component/aws/solid-start/

## Overview

The `SolidStart` component deploys a SolidStart application to AWS. It manages CloudFront distribution, S3 assets, and Lambda server functions for rendering.

## Constructor

```typescript
new sst.aws.SolidStart(name, args?, opts?)
```

**Parameters:**
- `name` (string): Component identifier
- `args?` (SolidStartArgs): Configuration options
- `opts?` (ComponentResourceOptions): Pulumi resource options

## Props

### assets?

**Type:** `Input<Object>`
**Default:** UTF-8 encoding, versioned files cached 1 year, non-versioned cached 1 day on CloudFront

Controls S3 asset upload behavior:
- `fileOptions?` (`Input<Object[]>`): Array of glob-based file configuration objects
  - `cacheControl?` (string): HTTP cache header value
  - `contentType?` (string): MIME type header
  - `files` (string | string[]): Glob pattern(s) for matching files
  - `ignore?` (string | string[]): Patterns to exclude
- `textEncoding?` (`Input<"utf-8" | "iso-8859-1" | "windows-1252" | "ascii" | "none">`): Default `"utf-8"`
- `versionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=31536000,immutable"`
- `nonVersionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=0,s-maxage=86400,stale-while-revalidate=8640"`
- `purge?` (`Input<boolean>`): Default `true` - Auto-remove previous deployment files

### buildCommand?

**Type:** `Input<string>`
**Default:** `"npm run build"`

Internal build command executed during deployment.

### cachePolicy?

**Type:** `Input<string>`

Reuse existing CloudFront cache policy by ARN (helpful due to 20-policy account limit).

### dev?

**Type:** `false | Object`

Controls behavior in `sst dev` mode:
- `autostart?` (`Input<boolean>`): Default `true` - Auto-start when sst dev runs
- `command?` (`Input<string>`): Default `"npm run dev"` - Dev startup command
- `directory?` (`Input<string>`): Working directory for command execution
- `title?` (`Input<string>`): Tab title in multiplexer
- `url?` (`Input<string>`): Placeholder URL in dev mode

Set to `false` to disable dev mode.

### domain?

**Type:** `Input<string | Object>`

Custom domain configuration with auto-DNS management for Route 53, Cloudflare, and Vercel:
- `name` (string): Domain name (required)
- `aliases?` (`Input<string[]>`): Alias domains (no redirect, visitor stays on alias)
- `redirects?` (`Input<string[]>`): Domains that redirect to main domain
- `cert?` (`Input<string>`): ACM certificate ARN for manual validation
- `dns?` (`Input<false | sst.aws.dns | sst.cloudflare.dns | sst.vercel.dns>`): DNS provider (default: Route 53)

### edge?

**Type:** `Input<Object>`

CloudFront Functions for request/response customization:
- `viewerRequest?`: Modify incoming requests
  - `injection` (string): Code injected at function start
  - `kvStore?` (`Input<string>`): KV store ARN
- `viewerResponse?`: Modify outgoing responses
  - `injection` (string): Code injected at function start
  - `kvStore?` (`Input<string>`): KV store ARN

### environment?

**Type:** `Input<Record<string, Input<string>>>`

Environment variables accessible during build and dev mode.

### invalidation?

**Type:** `Input<false | Object>`
**Default:** `{paths: "all", wait: false}`

CloudFront cache invalidation handling post-deployment:
- `paths?` (`Input<string[] | "all" | "versioned">`): Default `"all"` - Paths to invalidate
- `wait?` (`Input<boolean>`): Default `false` - Block deployment until invalidation completes

### link?

**Type:** `Input<any[]>`

Resources to connect with permission grants, accessible via SDK.

### path?

**Type:** `Input<string>`
**Default:** `"."`

Directory location of the SolidStart app relative to `sst.config.ts`.

### permissions?

**Type:** `Input<Object[]>`

IAM permissions for server function:
- `actions` (string[]): IAM actions
- `resources` (`Input<Input<string>[]>`): ARN format resources
- `effect?` (`"allow" | "deny"`): Default `"allow"`

### regions?

**Type:** `Input<string[]>`
**Default:** Single default SST region

Deploys server function to multiple regions with geo-based routing.

### router?

**Type:** `Object`

Serves app through existing Router instead of standalone CloudFront:
- `instance` (`Input<Router>`): Router component reference (required)
- `domain?` (`Input<string>`): Subdomain pattern (e.g., `"docs.example.com"`)
- `path?` (`Input<string>`): Default `"/"` - Path prefix (e.g., `"/docs"`)

**Note:** Requires matching `baseURL` in `app.config.ts` without trailing slash.

### server?

**Type:** `Object`
**Default:** `{architecture: "x86_64", memory: "1024 MB"}`

Lambda server function configuration:
- `architecture?` (`Input<"x86_64" | "arm64">`): Default `"x86_64"`
- `memory?` (`Input<string>`): Default `"1024 MB"` - Range 128-10240 MB
- `timeout?` (`Input<string>`): Default `"20 seconds"` - Max 900 seconds
- `runtime?` (`Input<"nodejs18.x" | "nodejs20.x" | "nodejs22.x">`): Default `"nodejs20.x"`
- `layers?` (`Input<Input<string>[]>`): Lambda layer ARNs array
- `install?` (`Input<string[]>`): Dependencies to exclude from bundling
- `loader?` (`Input<Record<string, Loader>>`): esbuild loader configuration for file extensions

### transform?

**Type:** `Object`

Customize underlying resource creation:
- `assets?`: Bucket configuration transformer
- `cdn?`: CDN configuration transformer
- `server?`: Function configuration transformer

### vpc?

**Type:** `Vpc | Input<Object>`

Connects server function to VPC for private resource access:
- `privateSubnets` (`Input<Input<string>[]>`): Subnet IDs
- `securityGroups` (`Input<Input<string>[]>`): Security group IDs

### warm?

**Type:** `Input<number>`
**Default:** `0`

Concurrent Lambda instances to keep warm via periodic cron invocations.

## Properties

### nodes

**Type:** `Object`

Underlying resources:
- `assets` (`Bucket`): S3 Bucket for assets
- `cdn` (`Cdn`): CloudFront CDN distribution
- `server` (`Output<Function>`): Lambda Function for rendering

### url

**Type:** `Output<string>`

Returns custom domain if set, otherwise auto-generated CloudFront URL.

## Links

When linked, the following is accessible via the `Resource` object:
- `url` (string): Application URL (custom domain or CloudFront)

```typescript
import { Resource } from "sst";
console.log(Resource.MyWeb.url);
```

## Examples

### Minimal deployment

```typescript
new sst.aws.SolidStart("MyWeb");
```

### Custom path

```typescript
new sst.aws.SolidStart("MyWeb", {
  path: "my-solid-app/"
});
```

### Custom domain

```typescript
new sst.aws.SolidStart("MyWeb", {
  domain: "my-app.com"
});
```

### Domain with www redirect

```typescript
new sst.aws.SolidStart("MyWeb", {
  domain: {
    name: "my-app.com",
    redirects: ["www.my-app.com"]
  }
});
```

### Resource linking

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.SolidStart("MyWeb", {
  link: [bucket]
});
```

### Access linked resources (src/app.tsx)

```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

### Enhanced server configuration

```typescript
new sst.aws.SolidStart("MyWeb", {
  server: {
    architecture: "arm64",
    memory: "2048 MB",
    timeout: "50 seconds",
    runtime: "nodejs22.x",
    install: ["sharp"]
  }
});
```

### Asset cache customization

```typescript
new sst.aws.SolidStart("MyWeb", {
  assets: {
    fileOptions: [
      {
        files: "**/*.zip",
        contentType: "application/zip",
        cacheControl: "private,no-cache,no-store,must-revalidate"
      }
    ]
  }
});
```

### Cloudflare domain

```typescript
new sst.aws.SolidStart("MyWeb", {
  domain: {
    name: "example.com",
    dns: sst.cloudflare.dns()
  }
});
```

### Edge function with custom headers

```typescript
new sst.aws.SolidStart("MyWeb", {
  edge: {
    viewerRequest: {
      injection: `event.request.headers["x-foo"] = { value: "bar" };`
    }
  }
});
```

### Router path integration

```typescript
const router = new sst.aws.Router("Router", {
  domain: "example.com"
});

new sst.aws.SolidStart("MyWeb", {
  router: {
    instance: router,
    path: "/docs"
  }
});
```

**Note:** Requires `app.config.ts`: `baseURL: "/docs"`

### Multi-region deployment

```typescript
new sst.aws.SolidStart("MyWeb", {
  regions: ["us-east-1", "eu-west-1"]
});
```

### Environment variables

```typescript
new sst.aws.SolidStart("MyWeb", {
  environment: {
    API_URL: api.url,
    STRIPE_PUBLISHABLE_KEY: "pk_test_123"
  }
});
```

### IAM permissions

```typescript
new sst.aws.SolidStart("MyWeb", {
  permissions: [
    {
      actions: ["s3:GetObject", "s3:PutObject"],
      resources: ["arn:aws:s3:::my-bucket/*"]
    }
  ]
});
```

### Dev mode configuration

```typescript
new sst.aws.SolidStart("MyWeb", {
  dev: {
    autostart: true,
    command: "npm run dev",
    url: "http://localhost:3000"
  }
});
```

### Invalidation control

```typescript
new sst.aws.SolidStart("MyWeb", {
  invalidation: {
    paths: ["/index.html", "/products/*"],
    wait: true
  }
});
```
