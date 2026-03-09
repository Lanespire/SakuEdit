# SvelteKit

> Source: https://sst.dev/docs/component/aws/svelte-kit/

## Overview

The `SvelteKit` component deploys a SvelteKit application to AWS. It manages assets via S3, serves content through CloudFront, and handles server-side rendering with Lambda functions.

## Constructor

```typescript
new sst.aws.SvelteKit(name, args?, opts?)
```

**Parameters:**
- `name` (string): Component identifier
- `args?` (SvelteKitArgs): Configuration options
- `opts?` (ComponentResourceOptions): Pulumi resource options

## Props

### assets?

**Type:** `Input<Object>`
**Default:** Text encoding UTF-8, versioned cache max-age 1 year, non-versioned cache 1 day with CloudFront

Controls S3 asset upload behavior:
- `fileOptions?` (`Input<Object[]>`): Array of file-specific configurations (glob patterns, cache headers, content types)
  - `cacheControl?` (string): HTTP cache header value
  - `contentType?` (string): MIME type header
  - `files` (string | string[]): Glob pattern(s) for matching files
  - `ignore?` (string | string[]): Patterns to exclude
- `nonVersionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=0,s-maxage=86400,stale-while-revalidate=8640"`
- `purge?` (`Input<boolean>`): Default `true` - Remove previous deployment files
- `textEncoding?` (`Input<"utf-8" | "iso-8859-1" | "windows-1252" | "ascii" | "none">`): Default `"utf-8"`
- `versionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=31536000,immutable"`

### buildCommand?

**Type:** `Input<string>`
**Default:** `"npm run build"`

Custom build command for the SvelteKit app.

### cachePolicy?

**Type:** `Input<string>`

Reuse existing CloudFront cache policy ID instead of creating new one.

### dev?

**Type:** `false | Object`

Configure behavior in `sst dev`:
- `autostart?` (`Input<boolean>`): Default `true` - Auto-start with dev mode
- `command?` (`Input<string>`): Default `"npm run dev"` - Dev command to run
- `directory?` (`Input<string>`): Directory for command execution
- `title?` (`Input<string>`): Tab title in multiplexer
- `url?` (`Input<string>`): Default `"http://url-unavailable-in-dev.mode"` - Placeholder URL

Pass `false` to disable dev mode entirely.

### domain?

**Type:** `Input<string | Object>`

Custom domain configuration:
- `name` (string): Domain name (required)
- `aliases?` (`Input<string[]>`): Alternate domains keeping visitors on alias
- `cert?` (`Input<string>`): ACM certificate ARN for domain validation
- `dns?` (`Input<false | sst.aws.dns | sst.cloudflare.dns | sst.vercel.dns>`): DNS provider
- `redirects?` (`Input<string[]>`): Domains that redirect to main name

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

Environment variables accessible during build and `sst dev`.

### invalidation?

**Type:** `Input<false | Object>`
**Default:** `{paths: "all", wait: false}`

CloudFront cache invalidation configuration:
- `paths?` (`Input<string[] | "all" | "versioned">`): Paths to invalidate
- `wait?` (`Input<boolean>`): Default `false` - Block deployment until invalidation completes

### link?

**Type:** `Input<any[]>`

Array of resources to link, granting permissions and SDK access.

### path?

**Type:** `Input<string>`
**Default:** `"."`

Relative path to SvelteKit app directory from sst.config.ts.

### permissions?

**Type:** `Input<Object[]>`

IAM permissions for server function:
- `actions` (string[]): Array of IAM action strings
- `effect?` (`"allow" | "deny"`): Default `"allow"`
- `resources` (`Input<Input<string>[]>`): ARN format resource identifiers

### regions?

**Type:** `Input<string[]>`
**Default:** SST app default region

Regions for server function deployment (enables multi-region routing).

### router?

**Type:** `Object`

Serve through Router component instead of standalone CloudFront:
- `instance` (`Input<Router>`): Router component to use
- `domain?` (`Input<string>`): Subdomain pattern (e.g., `"docs.example.com"`)
- `path?` (`Input<string>`): Default `"/"` - Path prefix

**Note:** Set matching base path in `svelte.config.js` when routing to path.

### server?

**Type:** `Object`
**Default:** `{architecture: "x86_64", memory: "1024 MB"}`

Lambda function configuration:
- `architecture?` (`Input<"x86_64" | "arm64">`): Default `"x86_64"`
- `install?` (`Input<string[]>`): NPM packages to exclude from bundling
- `layers?` (`Input<Input<string>[]>`): Lambda layer ARNs to attach
- `loader?` (`Input<Record<string, Loader>>`): esbuild file extension loaders
- `memory?` (`Input<string>`): Default `"1024 MB"` - 128-10240 MB
- `runtime?` (`Input<"nodejs18.x" | "nodejs20.x" | "nodejs22.x">`): Default `"nodejs20.x"`
- `timeout?` (`Input<string>`): Default `"20 seconds"` - Maximum execution time (max 60s with CloudFront)

### transform?

**Type:** `Object`

Transform underlying resources:
- `assets?`: Transform Bucket resource
- `cdn?`: Transform CloudFront CDN
- `server?`: Transform Lambda function

### vpc?

**Type:** `Vpc | Input<Object>`

VPC configuration for private subnet access:
- `privateSubnets` (`Input<Input<string>[]>`): Subnet ID array
- `securityGroups` (`Input<Input<string>[]>`): Security group ID array

### warm?

**Type:** `Input<number>`
**Default:** `0`

Number of server function instances to keep warm via periodic requests.

## Properties

### nodes

**Type:** `Object`

Underlying resources:
- `assets` (`Bucket`): S3 Bucket storing assets
- `cdn` (`Cdn`): CloudFront CDN distribution
- `server` (`Output<Function>`): Lambda function rendering site

### url

**Type:** `Output<string>`

Deployment URL (custom domain if set, otherwise auto-generated CloudFront URL).

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
new sst.aws.SvelteKit("MyWeb");
```

### Custom directory

```typescript
new sst.aws.SvelteKit("MyWeb", { path: "my-svelte-app/" });
```

### Custom domain

```typescript
new sst.aws.SvelteKit("MyWeb", { domain: "my-app.com" });
```

### WWW redirect

```typescript
new sst.aws.SvelteKit("MyWeb", {
  domain: {
    name: "my-app.com",
    redirects: ["www.my-app.com"]
  }
});
```

### Link resources

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.SvelteKit("MyWeb", { link: [bucket] });
```

### Access linked resources in code

```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```
