# Remix

> Source: https://sst.dev/docs/component/aws/remix/

## Overview

The `Remix` component deploys a Remix app to AWS. It creates a CloudFront distribution with S3 storage for assets and Lambda functions for server-side rendering.

## Constructor

```typescript
new sst.aws.Remix(name, args?, opts?)
```

**Parameters:**
- `name` (string): Component identifier
- `args?` (RemixArgs): Configuration options
- `opts?` (ComponentResourceOptions): Pulumi resource options

## Props

### assets?

**Type:** `Input<Object>`

Controls S3 asset upload behavior with default caching headers:
- `fileOptions?` (`Input<Object[]>`): Array of glob-based file configurations
  - `cacheControl?` (string): HTTP cache header value
  - `contentType?` (string): MIME type header
  - `files` (string | string[]): Glob pattern(s) for matching files
  - `ignore?` (string | string[]): Patterns to exclude from matches
- `nonVersionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=0,s-maxage=86400,stale-while-revalidate=8640"`
- `versionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=31536000,immutable"`
- `textEncoding?` (`Input<"utf-8" | "iso-8859-1" | "windows-1252" | "ascii" | "none">`): Default `"utf-8"`
- `purge?` (`Input<boolean>`): Default `true` - Remove previous deployment files

### buildCommand?

**Type:** `Input<string>`
**Default:** `"npm run build"`

Command used to build the application.

### buildDirectory?

**Type:** `Input<string>`
**Default:** `"build"`

Output directory matching Vite config buildDirectory setting.

### cachePolicy?

**Type:** `Input<string>`

CloudFront cache policy ID to reuse existing policy instead of creating new one. Useful due to 20-policy-per-account limit.

### dev?

**Type:** `false | Object`

Controls `sst dev` behavior:
- `autostart?` (`Input<boolean>`): Default `true` - Auto-start when sst dev runs
- `command?` (`Input<string>`): Default `"npm run dev"` - Dev startup command
- `directory?` (`Input<string>`): Working directory for command execution
- `title?` (`Input<string>`): Tab title in multiplexer
- `url?` (`Input<string>`): Placeholder URL in dev mode

### domain?

**Type:** `Input<string | Object>`

Custom domain configuration supporting Route 53, Cloudflare, and Vercel:
- `name` (string): Custom domain URL (required)
- `aliases?` (`Input<string[]>`): Alternate domains (visitors stay on alias)
- `redirects?` (`Input<string[]>`): Domains that redirect to main domain
- `cert?` (`Input<string>`): ACM certificate ARN for manual setup
- `dns?` (`Input<false | sst.aws.dns | sst.cloudflare.dns | sst.vercel.dns>`): DNS provider adapter (default: Route 53)

### edge?

**Type:** `Input<Object>`

CloudFront Functions for request/response customization:
- `viewerRequest?`: Modify incoming requests
  - `injection` (string): Code injected into viewer request handler
  - `kvStore?` (`Input<string>`): KV store ARN
- `viewerResponse?`: Modify outgoing responses
  - `injection` (string): Code injected into viewer response handler
  - `kvStore?` (`Input<string>`): KV store ARN

### environment?

**Type:** `Input<Record<string, Input<string>>>`

Environment variables accessible in remix build and sst dev.

### invalidation?

**Type:** `Input<false | Object>`
**Default:** `{paths: "all", wait: false}`

CloudFront cache invalidation settings:
- `paths?` (`Input<string[] | "all" | "versioned">`): Default `"all"` - Files to invalidate
- `wait?` (`Input<boolean>`): Default `false` - Block deployment until invalidation completes

### link?

**Type:** `Input<any[]>`

Link resources for type-safe access via SDK.

### path?

**Type:** `Input<string>`
**Default:** `"."`

Directory location relative to sst.config.ts.

### permissions?

**Type:** `Input<Object[]>`

IAM permissions for server function:
- `actions` (string[]): IAM action array
- `resources` (`Input<Input<string>[]>`): ARN array
- `effect?` (`"allow" | "deny"`): Default `"allow"`

### regions?

**Type:** `Input<string[]>`

Deploys server function to multiple regions for geographic distribution.

### router?

**Type:** `Object`

Serve through Router component instead of standalone CloudFront:
- `instance` (`Input<Router>`): Router component reference
- `path?` (`Input<string>`): Path prefix like `"/docs"`
- `domain?` (`Input<string>`): Subdomain pattern

### server?

**Type:** `Object`
**Default:** `{architecture: "x86_64", memory: "1024 MB"}`

Lambda server function configuration:
- `architecture?` (`Input<"x86_64" | "arm64">`): Processor architecture
- `memory?` (`Input<string>`): 128-10240 MB (default: `"1024 MB"`)
- `runtime?` (`Input<"nodejs18.x" | "nodejs20.x" | "nodejs22.x">`): Node.js runtime version
- `timeout?` (`Input<string>`): Maximum execution time (default: `"20 seconds"`)
- `layers?` (`Input<Input<string>[]>`): Lambda layer ARNs
- `install?` (`Input<string[]>`): Dependencies excluded from bundling
- `loader?` (`Input<Record<string, Loader>>`): Custom esbuild loaders for file extensions

### transform?

**Type:** `Object`

Modify underlying resources:
- `assets?`: Transform Bucket configuration
- `cdn?`: Transform CDN configuration
- `server?`: Transform Function configuration

### vpc?

**Type:** `Vpc | Input<Object>`

Connect server to VPC for private resource access:
- `privateSubnets` (`Input<Input<string>[]>`): Subnet IDs
- `securityGroups` (`Input<Input<string>[]>`): Security group IDs

### warm?

**Type:** `Input<number>`
**Default:** `0`

Number of concurrent server instances to keep warm via periodic invocations.

## Properties

### nodes

**Type:** `Object`

Underlying resources:
- `assets?` (`Bucket`): S3 Bucket storing static files
- `cdn?` (`Cdn`): CloudFront distribution
- `server?` (`Output<Function>`): Lambda function rendering the site

### url

**Type:** `Output<string>`

Deployment URL (custom domain if set, otherwise CloudFront URL).

## Links

When linked, the following is accessible via the `Resource` object:
- `url` (string): Deployment URL

```typescript
import { Resource } from "sst";
console.log(Resource.MyWeb.url);
```

## Examples

### Minimal deployment

```typescript
new sst.aws.Remix("MyWeb");
```

### Custom path

```typescript
new sst.aws.Remix("MyWeb", { path: "my-remix-app/" });
```

### Custom domain

```typescript
new sst.aws.Remix("MyWeb", { domain: "my-app.com" });
```

### Domain with WWW redirect

```typescript
new sst.aws.Remix("MyWeb", {
  domain: {
    name: "my-app.com",
    redirects: ["www.my-app.com"]
  }
});
```

### Linked resources

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Remix("MyWeb", { link: [bucket] });
```

### Access linked resources in app/root.tsx

```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

### Router integration (subdomain)

```typescript
const router = new sst.aws.Router("Router", {
  domain: { name: "example.com", aliases: ["*.example.com"] }
});
new sst.aws.Remix("MyWeb", {
  router: { instance: router, domain: "docs.example.com" }
});
```

### Custom cache headers

```typescript
new sst.aws.Remix("MyWeb", {
  assets: {
    fileOptions: [{
      files: "**/*.zip",
      contentType: "application/zip",
      cacheControl: "private,no-cache,no-store,must-revalidate"
    }]
  }
});
```

### Edge functions with custom headers

```typescript
new sst.aws.Remix("MyWeb", {
  edge: {
    viewerRequest: {
      injection: `event.request.headers["x-foo"] = { value: "bar" };`
    }
  }
});
```

### Environment variables

```typescript
new sst.aws.Remix("MyWeb", {
  environment: {
    API_URL: api.url,
    STRIPE_KEY: "pk_test_123"
  }
});
```

### IAM permissions

```typescript
new sst.aws.Remix("MyWeb", {
  permissions: [{
    actions: ["s3:GetObject", "s3:PutObject"],
    resources: ["arn:aws:s3:::my-bucket/*"]
  }]
});
```

### Multi-region deployment

```typescript
new sst.aws.Remix("MyWeb", {
  regions: ["us-east-1", "eu-west-1"]
});
```

### Keep instances warm

```typescript
new sst.aws.Remix("MyWeb", { warm: 2 });
```
