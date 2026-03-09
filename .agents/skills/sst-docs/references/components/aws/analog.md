# Analog

> Source: https://sst.dev/docs/component/aws/analog/

## Overview

The `Analog` component deploys an Analog app to AWS. It creates a CloudFront distribution for static assets and Lambda functions for server-side rendering. Analog is the fullstack meta-framework for Angular.

## Constructor

```typescript
new sst.aws.Analog(name, args?, opts?)
```

**Parameters:**
- `name` (string): Component identifier
- `args?` (AnalogArgs): Configuration options
- `opts?` (ComponentResourceOptions): Pulumi resource options

## Props

### assets?

**Type:** `Input<Object>`

Controls how Analog app assets upload to S3:
- `fileOptions?` (`Input<Object[]>`): Array of file-specific options
  - `cacheControl?` (string): HTTP cache header value
  - `contentType?` (string): MIME type header
  - `files` (string | string[]): Glob patterns to match
  - `ignore?` (string | string[]): Patterns to exclude
- `nonVersionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=0,s-maxage=86400,stale-while-revalidate=8640"`
- `purge?` (`Input<boolean>`): Default `true` - Remove previous deployment files
- `textEncoding?` (`Input<"utf-8" | "iso-8859-1" | "windows-1252" | "ascii" | "none">`): Default `"utf-8"`
- `versionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=31536000,immutable"`

### buildCommand?

**Type:** `Input<string>`
**Default:** `"npm run build"`

Custom build command for the Analog app.

### cachePolicy?

**Type:** `Input<string>`

CloudFront cache policy ID (avoids creating new policies, max 20 per account).

### dev?

**Type:** `false | Object`

Development mode configuration:
- `autostart?` (`Input<boolean>`): Default `true` - Auto-start in `sst dev`
- `command?` (`Input<string>`): Default `"npm run dev"` - Dev start command
- `directory?` (`Input<string>`): Working directory for command
- `title?` (`Input<string>`): Multiplexer tab title
- `url?` (`Input<string>`): Default `"http://url-unavailable-in-dev.mode"` - Placeholder URL in dev mode

### domain?

**Type:** `Input<string | Object>`

Custom domain configuration:
- `name` (string): Domain name (required if using object form)
- `aliases?` (`Input<string[]>`): Alias domains (no redirect, visitor stays on alias)
- `cert?` (`Input<string>`): ACM certificate ARN for manual validation
- `dns?` (`Input<false | sst.aws.dns | sst.cloudflare.dns | sst.vercel.dns>`): DNS provider (default: AWS Route 53)
- `redirects?` (`Input<string[]>`): Redirect alternate domains to main domain

### edge?

**Type:** `Input<Object>`

CloudFront Functions for request/response customization:
- `viewerRequest?`: Modify incoming requests before reaching origin
  - `injection` (string): Code injected at function start
  - `kvStore?` (`Input<string>`): KV store ARN
- `viewerResponse?`: Modify outgoing responses to clients
  - `injection` (string): Code injected at function start
  - `kvStore?` (`Input<string>`): KV store ARN

### environment?

**Type:** `Input<Record<string, Input<string>>>`

Environment variables accessible during build and `sst dev`. Only variables prefixed with `VITE_` available in browser.

### invalidation?

**Type:** `Input<false | Object>`
**Default:** `{paths: "all", wait: false}`

CloudFront cache invalidation handling:
- `paths?` (`Input<string[] | "all" | "versioned">`): Default `"all"` - Paths to invalidate
- `wait?` (`Input<boolean>`): Default `false` - Wait for invalidation to complete

### link?

**Type:** `Input<any[]>`

Resources to link for SDK access and automatic permission grants.

### path?

**Type:** `Input<string>`
**Default:** `"."`

Directory path to Analog app (relative to sst.config.ts).

### permissions?

**Type:** `Input<Object[]>`

IAM permissions for server function:
- `actions` (string[]): IAM actions (e.g., `["s3:GetObject"]`)
- `effect?` (`"allow" | "deny"`): Default `"allow"`
- `resources` (`Input<Input<string>[]>`): IAM ARN format resources

### regions?

**Type:** `Input<string[]>`
**Default:** App's default region

Regions for server function deployment (creates multi-region Lambda functions).

### router?

**Type:** `Object`

Serve through Router component instead of standalone CloudFront:
- `instance` (`Input<Router>`): Router component reference (required)
- `domain?` (`Input<string>`): Subdomain pattern (e.g., `"docs.example.com"`)
- `path?` (`Input<string>`): Default `"/"` - Path prefix

### server?

**Type:** `Object`
**Default:** `{architecture: "x86_64", memory: "1024 MB"}`

Lambda server function configuration:
- `architecture?` (`Input<"x86_64" | "arm64">`): Default `"x86_64"`
- `install?` (`Input<string[]>`): NPM packages excluded from bundling
- `layers?` (`Input<Input<string>[]>`): Lambda layer ARNs
- `loader?` (`Input<Record<string, Loader>>`): esbuild loaders for file types
- `memory?` (`Input<string>`): Default `"1024 MB"` - 128-10240 MB
- `runtime?` (`Input<"nodejs18.x" | "nodejs20.x" | "nodejs22.x">`): Default `"nodejs20.x"`
- `timeout?` (`Input<string>`): Default `"20 seconds"` - Maximum execution time

### transform?

**Type:** `Object`

Transform underlying resources:
- `assets?`: Bucket configuration or transformation function
- `cdn?`: CDN configuration or transformation function
- `server?`: Function configuration or transformation function

### vpc?

**Type:** `Vpc | Input<Object>`

VPC configuration for private subnet access:
- `privateSubnets` (`Input<Input<string>[]>`): Subnet IDs
- `securityGroups` (`Input<Input<string>[]>`): Security group IDs

### warm?

**Type:** `Input<number>`
**Default:** `0`

Number of server function instances to keep warm via scheduled requests.

## Properties

### nodes

**Type:** `Object`

Underlying resource references:
- `assets?` (`Bucket`): S3 bucket storing assets
- `cdn?` (`Cdn`): CloudFront CDN distribution
- `server?` (`Output<Function>`): Lambda server function

### url

**Type:** `Output<string>`

Site URL (custom domain if configured, otherwise auto-generated CloudFront URL).

## Links

When linked, the following is accessible via the `Resource` object:
- `url` (string): Site URL

```typescript
import { Resource } from "sst";
console.log(Resource.MyWeb.url);
```

## Examples

### Minimal deployment

```typescript
new sst.aws.Analog("MyWeb");
```

### Custom path

```typescript
new sst.aws.Analog("MyWeb", { path: "my-analog-app/" });
```

### Custom domain

```typescript
new sst.aws.Analog("MyWeb", { domain: "my-app.com" });
```

### WWW redirect

```typescript
new sst.aws.Analog("MyWeb", {
  domain: {
    name: "my-app.com",
    redirects: ["www.my-app.com"]
  }
});
```

### Link resources

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Analog("MyWeb", { link: [bucket] });
```

### Access linked resources in app

```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

### Cloudflare domain

```typescript
new sst.aws.Analog("MyWeb", {
  domain: {
    name: "example.com",
    dns: sst.cloudflare.dns()
  }
});
```

### Multiple regions

```typescript
new sst.aws.Analog("MyWeb", {
  regions: ["us-east-1", "eu-west-1"]
});
```

### Custom build command

```typescript
new sst.aws.Analog("MyWeb", {
  buildCommand: "yarn build"
});
```

### Router integration (path)

```typescript
const router = new sst.aws.Router("Router", { domain: "example.com" });
new sst.aws.Analog("MyWeb", {
  router: { instance: router, path: "/docs" }
});
```

### Router integration (subdomain)

```typescript
const router = new sst.aws.Router("Router", {
  domain: {
    name: "example.com",
    aliases: ["*.example.com"]
  }
});
new sst.aws.Analog("MyWeb", {
  router: { instance: router, domain: "docs.example.com" }
});
```

### Edge function injection

```typescript
new sst.aws.Analog("MyWeb", {
  edge: {
    viewerRequest: {
      injection: `event.request.headers["x-foo"] = { value: "bar" };`
    }
  }
});
```

### Environment variables

```typescript
new sst.aws.Analog("MyWeb", {
  environment: {
    API_URL: api.url,
    VITE_STRIPE_PUBLISHABLE_KEY: "pk_test_123"
  }
});
```

### IAM permissions

```typescript
new sst.aws.Analog("MyWeb", {
  permissions: [{
    actions: ["s3:GetObject", "s3:PutObject"],
    resources: ["arn:aws:s3:::my-bucket/*"]
  }]
});
```

### Cache invalidation

```typescript
new sst.aws.Analog("MyWeb", {
  invalidation: {
    paths: ["/index.html", "/products/*"],
    wait: true
  }
});
```

### Server configuration

```typescript
new sst.aws.Analog("MyWeb", {
  server: {
    architecture: "arm64",
    memory: "2048 MB",
    runtime: "nodejs22.x",
    timeout: "50 seconds"
  }
});
```

### VPC integration

```typescript
const myVpc = new sst.aws.Vpc("MyVpc");
new sst.aws.Analog("MyWeb", { vpc: myVpc });
```

### Keep instances warm

```typescript
new sst.aws.Analog("MyWeb", { warm: 5 });
```
