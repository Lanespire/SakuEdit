# Nextjs

> Source: https://sst.dev/docs/component/aws/nextjs/

## Overview

The `Nextjs` component deploys Next.js applications on AWS, utilizing OpenNext to build the app and transform its output into a format compatible with AWS infrastructure. It creates a CloudFront distribution with S3 storage for assets and Lambda functions for server-side rendering.

## Constructor

```typescript
new sst.aws.Nextjs(name, args?, opts?)
```

**Parameters:**
- `name` (string): Component identifier
- `args?` (NextjsArgs): Configuration options
- `opts?` (ComponentResourceOptions): Pulumi resource options

## Props

### assets?

**Type:** `Input<Object>`
**Default:** Configured caching headers for versioned and non-versioned files

Manages S3 asset uploads with customizable cache policies and content types.

- `fileOptions?` (`Input<Object[]>`): Array of glob-based file configurations
  - `cacheControl?` (string): HTTP cache header value
  - `contentType?` (string): MIME type header
  - `files` (string | string[]): Glob pattern(s) for matching files
  - `ignore?` (string | string[]): Patterns to exclude from matches
- `nonVersionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=0,s-maxage=86400,stale-while-revalidate=8640"`
- `versionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=31536000,immutable"`
- `textEncoding?` (`Input<string>`): Character encoding (`"utf-8"`, `"iso-8859-1"`, `"windows-1252"`, `"ascii"`, `"none"`)
- `purge?` (`Input<boolean>`): Controls removal of previous deployment files

### buildCommand?

**Type:** `Input<string>`
**Default:** `"npx --yes open-next@OPEN_NEXT_VERSION build"`

Custom build command for OpenNext compilation process.

### cachePolicy?

**Type:** `Input<string>`

Specifies existing CloudFront cache policy ARN instead of creating new one. Useful due to the 20-policy-per-account limit.

### dev?

**Type:** `false | Object`

Configures development mode behavior:
- `autostart?` (`Input<boolean>`): Auto-start with `sst dev` (default: `true`)
- `command?` (`Input<string>`): Dev mode command (default: `"npm run dev"`)
- `directory?` (`Input<string>`): Working directory override
- `title?` (`Input<string>`): Tab title in multiplexer
- `url?` (`Input<string>`): Placeholder URL when running locally

### domain?

**Type:** `Input<string | Object>`

Custom domain configuration supporting Route 53, Cloudflare, and Vercel:
- `name` (string): Domain string (required)
- `aliases?` (`Input<string[]>`): Subdomains maintaining visitor on alias domain
- `redirects?` (`Input<string[]>`): Alternate domains redirecting to main domain
- `dns?` (`Input<false | sst.aws.dns | sst.cloudflare.dns | sst.vercel.dns>`): DNS provider adapter (defaults to AWS Route 53)
- `cert?` (`Input<string>`): ACM certificate ARN for manual validation

### edge?

**Type:** `Input<Object>`

CloudFront Functions for request/response modification:
- `viewerRequest?`: Object with `injection` code and optional `kvStore`
- `viewerResponse?`: Object with `injection` code and optional `kvStore`

### environment?

**Type:** `Input<Record<string, Input<string>>>`

Environment variables accessible during build and development. Prefix with `NEXT_PUBLIC_` for browser access.

### imageOptimization?

**Type:** `Object`
**Default:** `{memory: "1024 MB"}`

Lambda function configuration for image optimization:
- `memory?` (string): RAM allocation `"128 MB"` to `"10240 MB"`
- `staticEtag?` (boolean): Enable 304 Not Modified for immutable images

### invalidation?

**Type:** `Input<false | Object>`
**Default:** `{paths: "all", wait: false}`

CloudFront cache invalidation settings:
- `paths?` (`Input<string[] | "all" | "versioned">`): Paths to invalidate
- `wait?` (`Input<boolean>`): Block deployment until invalidation completes

### link?

**Type:** `Input<any[]>`

Resources to grant permissions and SDK access to the application.

### openNextVersion?

**Type:** `Input<string>`

OpenNext version for building (pinned to SST version by default).

### path?

**Type:** `Input<string>`
**Default:** `"."`

Relative path to Next.js application directory.

### permissions?

**Type:** `Input<Object[]>`

IAM permissions for the server function:
- `actions` (string[]): IAM action names
- `resources` (`Input<Input<string>[]>`): IAM ARN format resource identifiers
- `effect?` (`"allow" | "deny"`): Permission type (default: `"allow"`)

### regions?

**Type:** `Input<string[]>`

Regions for multi-region server function deployment.

### router?

**Type:** `Object`

Integration with Router component:
- `instance` (`Input<Router>`): Router component reference (required)
- `domain?` (`Input<string>`): Subdomain routing pattern
- `path?` (`Input<string>`): Path prefix routing (default: `"/"`)

### server?

**Type:** `Object`
**Default:** `{architecture: "x86_64", memory: "1024 MB"}`

Lambda server function configuration:
- `architecture?` (`Input<"x86_64" | "arm64">`): Processor architecture
- `memory?` (`Input<string>`): RAM allocation `"128 MB"` to `"10240 MB"`
- `runtime?` (`Input<"nodejs18.x" | "nodejs20.x" | "nodejs22.x">`): Node.js runtime version
- `timeout?` (`Input<string>`): Maximum execution time (default: `"20 seconds"`)
- `install?` (`Input<string[]>`): Dependencies excluded from bundling
- `layers?` (`Input<Input<string>[]>`): Lambda layer ARNs
- `loader?` (`Input<Record<string, Loader>>`): esbuild loader configurations

### transform?

**Type:** `Object`

Resource transformation callbacks:
- `assets?`: Bucket configuration transformer
- `cdn?`: CloudFront CDN transformer
- `server?`: Lambda function transformer

### vpc?

**Type:** `Vpc | Input<Object>`

VPC connectivity for private resources:
- `privateSubnets` (`Input<Input<string>[]>`): Subnet IDs array
- `securityGroups` (`Input<Input<string>[]>`): Security group IDs array

### warm?

**Type:** `Input<number>`
**Default:** `0`

Count of server function instances to maintain in warm state.

## Properties

### nodes

**Type:** `Object`

Underlying created resources:
- `assets?` (`Bucket`): S3 Bucket storing assets
- `cdn?` (`Cdn`): CloudFront CDN distribution
- `server?` (`Output<Function>`): Lambda server function
- `revalidationFunction?` (`Function`): ISR revalidation Lambda
- `revalidationQueue?` (`Queue`): SQS queue for ISR
- `revalidationTable?` (`Table`): DynamoDB ISR data table

### url

**Type:** `Output<string>`

Application URL (custom domain if configured, otherwise CloudFront auto-generated URL).

## Links

When linked, the following is accessible via the `Resource` object:
- `url` (string): Application URL

```typescript
import { Resource } from "sst";
console.log(Resource.MyWeb.url);
```

## Examples

### Minimal deployment

```typescript
new sst.aws.Nextjs("MyWeb");
```

### Custom directory

```typescript
new sst.aws.Nextjs("MyWeb", { path: "my-next-app/" });
```

### Custom domain

```typescript
new sst.aws.Nextjs("MyWeb", { domain: "my-app.com" });
```

### Domain with www redirect

```typescript
new sst.aws.Nextjs("MyWeb", {
  domain: {
    name: "my-app.com",
    redirects: ["www.my-app.com"]
  }
});
```

### Linked resources

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Nextjs("MyWeb", { link: [bucket] });
```

### Accessing linked resources in app

```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

### Custom headers via edge function

```typescript
new sst.aws.Nextjs("MyWeb", {
  edge: {
    viewerRequest: {
      injection: `event.request.headers["x-foo"] = { value: "bar" };`
    }
  }
});
```

### Multi-region deployment

```typescript
new sst.aws.Nextjs("MyWeb", {
  regions: ["us-east-1", "eu-west-1"]
});
```

### Router path integration

```typescript
new sst.aws.Nextjs("MyWeb", {
  router: { instance: router, path: "/docs" }
});
```

### Router subdomain integration

```typescript
new sst.aws.Nextjs("MyWeb", {
  router: { instance: router, domain: "docs.example.com" }
});
```
