# TanStackStart

> Source: https://sst.dev/docs/component/aws/tan-stack-start/

## Overview

The `TanStackStart` component deploys a TanStack Start app to AWS. It requires the `server.preset` value in `app.config.ts` to be set to `aws-lambda`. It creates a CloudFront distribution with S3 storage for assets and Lambda functions for server-side rendering.

## Constructor

```typescript
new sst.aws.TanStackStart(name, args?, opts?)
```

**Parameters:**
- `name` (string): Component identifier
- `args?` (TanStackStartArgs): Configuration options
- `opts?` (ComponentResourceOptions): Pulumi resource options

## Props

### assets?

**Type:** `Input<Object>`

Configures S3 asset uploads with defaults:
- `fileOptions?` (`Input<Object[]>`): Array of file-specific configurations
  - `cacheControl?` (string): HTTP cache header value
  - `contentType?` (string): MIME type header
  - `files` (string | string[]): Glob patterns to match
  - `ignore?` (string | string[]): Patterns to exclude
- `nonVersionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=0,s-maxage=86400,stale-while-revalidate=8640"`
- `purge?` (`Input<boolean>`): Default `true` - Whether to purge previous deployment files
- `textEncoding?` (`Input<"utf-8" | "iso-8859-1" | "windows-1252" | "ascii" | "none">`): Default `"utf-8"`
- `versionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=31536000,immutable"`

### buildCommand?

**Type:** `Input<string>`
**Default:** `"npm run build"`

Build command for the app.

### cachePolicy?

**Type:** `Input<string>`

CloudFront cache policy ID. Creates new policy by default.

### dev?

**Type:** `false | Object`

Configures `sst dev` behavior:
- `autostart?` (`Input<boolean>`): Default `true` - Auto-start when `sst dev` starts
- `command?` (`Input<string>`): Default `"npm run dev"` - Dev command
- `directory?` (`Input<string>`): Working directory for command
- `title?` (`Input<string>`): Tab title in multiplexer
- `url?` (`Input<string>`): Default `"http://url-unavailable-in-dev.mode"` - Placeholder URL in dev mode

### domain?

**Type:** `Input<string | Object>`

Custom domain configuration:
- `name` (string): Domain name (required)
- `aliases?` (`Input<string[]>`): Alias domains maintaining visitor's current domain
- `cert?` (`Input<string>`): ACM certificate ARN
- `dns?` (`Input<false | sst.aws.dns | sst.cloudflare.dns | sst.vercel.dns>`): DNS provider (default: Route 53)
- `redirects?` (`Input<string[]>`): Domains redirecting to main domain

### edge?

**Type:** `Input<Object>`

CloudFront edge functions:
- `viewerRequest?`: Request customization
  - `injection` (string): Code injected at function start
  - `kvStore?` (`Input<string>`): KV store ARN
- `viewerResponse?`: Response customization
  - `injection` (string): Code injected at function start
  - `kvStore?` (`Input<string>`): KV store ARN

### environment?

**Type:** `Input<Record<string, Input<string>>>`

Environment variables available in build and dev.

### invalidation?

**Type:** `Input<false | Object>`
**Default:** `{paths: "all", wait: false}`

CloudFront cache invalidation:
- `paths?` (`Input<string[] | "all" | "versioned">`): Paths to invalidate
- `wait?` (`Input<boolean>`): Default `false` - Wait for completion

### link?

**Type:** `Input<any[]>`

Resources to link, granting permissions and SDK access.

### path?

**Type:** `Input<string>`
**Default:** `"."`

Path to TanStack Start app directory.

### permissions?

**Type:** `Input<Object[]>`

IAM permissions structure:
- `actions` (string[]): IAM action array
- `effect?` (`"allow" | "deny"`): Default `"allow"`
- `resources` (`Input<Input<string>[]>`): ARN array

### regions?

**Type:** `Input<string[]>`

Deployment regions (default: SST app default region). Deploys Lambda functions to each region.

### router?

**Type:** `Object`

Serve through Router component instead of standalone CloudFront:
- `instance` (`Input<Router>`): Router component (required)
- `domain?` (`Input<string>`): Subdomain pattern
- `path?` (`Input<string>`): Path prefix

### server?

**Type:** `Object`
**Default:** `{architecture: "x86_64", memory: "1024 MB"}`

Lambda server configuration:
- `architecture?` (`Input<"x86_64" | "arm64">`): Default `"x86_64"`
- `install?` (`Input<string[]>`): Dependencies to exclude from bundling
- `layers?` (`Input<Input<string>[]>`): Lambda layer ARNs
- `loader?` (`Input<Record<string, Loader>>`): esbuild loaders for file extensions
- `memory?` (`Input<string>`): Default `"1024 MB"` - 128-10240 MB
- `runtime?` (`Input<"nodejs18.x" | "nodejs20.x" | "nodejs22.x">`): Default `"nodejs20.x"`
- `timeout?` (`Input<string>`): Default `"20 seconds"` - Max 900 seconds

### transform?

**Type:** `Object`

Transform underlying resources:
- `assets?`: Bucket resource transform
- `cdn?`: CDN resource transform
- `server?`: Function resource transform

### vpc?

**Type:** `Vpc | Input<Object>`

VPC configuration:
- `privateSubnets` (`Input<Input<string>[]>`): Subnet ID array
- `securityGroups` (`Input<Input<string>[]>`): Security group ID array

### warm?

**Type:** `Input<number>`
**Default:** `0`

Number of server function instances to keep warm.

## Properties

### nodes

**Type:** `Object`

Underlying resources:
- `assets` (`Bucket`): S3 bucket storing assets
- `cdn` (`Cdn`): CloudFront CDN
- `server` (`Output<Function>`): Lambda function for rendering

### url

**Type:** `Output<string>`

Component URL -- custom domain if set, otherwise CloudFront URL.

## Links

When linked, the following is accessible via the `Resource` object:
- `url` (string): The TanStackStart app URL

```typescript
import { Resource } from "sst";
console.log(Resource.MyWeb.url);
```

## Examples

### Minimal deployment

```typescript
new sst.aws.TanStackStart("MyWeb");
```

### Custom path

```typescript
new sst.aws.TanStackStart("MyWeb", { path: "my-app/" });
```

### Custom domain

```typescript
new sst.aws.TanStackStart("MyWeb", { domain: "my-app.com" });
```

### Redirect www to apex

```typescript
new sst.aws.TanStackStart("MyWeb", {
  domain: {
    name: "my-app.com",
    redirects: ["www.my-app.com"]
  }
});
```

### Link resources

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.TanStackStart("MyWeb", { link: [bucket] });
```

### Access linked resources

```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

### Required app.config.ts setting

```typescript
// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";

export default defineConfig({
  server: {
    preset: "aws-lambda",
  },
});
```
