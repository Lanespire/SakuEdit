# Astro

> Source: https://sst.dev/docs/component/aws/astro/

## Overview

The `Astro` component deploys an Astro site to AWS. It manages CloudFront distribution, S3 bucket storage, and Lambda server functions for rendering.

## Constructor

```typescript
new sst.aws.Astro(name, args?, opts?)
```

**Parameters:**
- `name` (string): Component identifier
- `args?` (AstroArgs): Configuration options
- `opts?` (ComponentResourceOptions): Pulumi resource options

## Props

### assets?

**Type:** `Input<Object>`
**Default:** `{textEncoding: "utf-8", versionedFilesCacheHeader: "public,max-age=31536000,immutable", nonVersionedFilesCacheHeader: "public,max-age=0,s-maxage=86400,stale-while-revalidate=8640"}`

Configures S3 asset uploads including cache headers and file-specific options:
- `fileOptions?` (`Input<Object[]>`): Array of glob-based file configurations
  - `cacheControl?` (string): HTTP cache header value
  - `contentType?` (string): MIME type header
  - `files` (string | string[]): Glob pattern(s) for matching files
  - `ignore?` (string | string[]): Patterns to exclude
- `nonVersionedFilesCacheHeader?` (`Input<string>`): Cache control for non-versioned files like `index.html`
- `purge?` (`Input<boolean>`): Default `true` - Removes previous deployment files
- `textEncoding?` (`Input<"utf-8" | "iso-8859-1" | "windows-1252" | "ascii" | "none">`): Character encoding for text assets
- `versionedFilesCacheHeader?` (`Input<string>`): Cache control for versioned files

### buildCommand?

**Type:** `Input<string>`
**Default:** `"npm run build"`

The command executed to build the Astro site.

### cachePolicy?

**Type:** `Input<string>`

Reuses an existing CloudFront cache policy ARN instead of creating one.

### dev?

**Type:** `false | Object`

Configures local development behavior:
- `autostart?` (`Input<boolean>`): Default `true` - Auto-start in `sst dev`
- `command?` (`Input<string>`): Default `"npm run dev"` - Dev command
- `directory?` (`Input<string>`): Working directory for command
- `title?` (`Input<string>`): Tab title in multiplexer
- `url?` (`Input<string>`): Default `"http://url-unavailable-in-dev.mode"` - Placeholder URL for dev mode

### domain?

**Type:** `Input<string | Object>`

Sets custom domain configuration:
- `name` (string): Primary domain (required)
- `aliases?` (`Input<string[]>`): Additional domains kept in browser
- `redirects?` (`Input<string[]>`): Domains redirecting to primary
- `cert?` (`Input<string>`): ACM certificate ARN for validation
- `dns?` (`Input<false | sst.aws.dns | sst.cloudflare.dns | sst.vercel.dns>`): DNS provider (defaults to Route 53)

### edge?

**Type:** `Input<Object>`

CloudFront Functions for HTTP customization:
- `viewerRequest?`: Modify incoming requests
  - `injection` (string): Code injected at function start
  - `kvStore?` (`Input<string>`): Associated KV store ARN
- `viewerResponse?`: Modify outgoing responses
  - `injection` (string): Code injected at function start
  - `kvStore?` (`Input<string>`): Associated KV store ARN

### environment?

**Type:** `Input<Record<string, Input<string>>>`

Environment variables available in build and via `import.meta.env`. Prefix with `PUBLIC_` for client-side access.

### invalidation?

**Type:** `Input<false | Object>`
**Default:** `{paths: "all", wait: false}`

CloudFront cache invalidation settings:
- `paths?` (`Input<string[] | "all" | "versioned">`): Files to invalidate
- `wait?` (`Input<boolean>`): Block deployment until complete

### link?

**Type:** `Input<any[]>`

Resources to link for permissions and SDK access.

### path?

**Type:** `Input<string>`
**Default:** `"."`

Directory containing the Astro site relative to `sst.config.ts`.

### permissions?

**Type:** `Input<Object[]>`

IAM permissions for server function:
- `actions` (string[]): IAM actions allowed
- `effect?` (`"allow" | "deny"`): Default `"allow"`
- `resources` (`Input<Input<string>[]>`): IAM ARN resources

### regions?

**Type:** `Input<string[]>`
**Default:** Default SST app region

Regions for multi-region server function deployment.

### router?

**Type:** `Object`

Serves site through Router component instead of standalone CloudFront:
- `instance` (`Input<Router>`): Router component reference (required)
- `domain?` (`Input<string>`): Subdomain pattern
- `path?` (`Input<string>`): Default `"/"` - Path prefix

### server?

**Type:** `Object`
**Default:** `{architecture: "x86_64", memory: "1024 MB"}`

Lambda server function configuration:
- `architecture?` (`Input<"x86_64" | "arm64">`): Default `"x86_64"`
- `install?` (`Input<string[]>`): Dependencies excluded from bundling
- `layers?` (`Input<Input<string>[]>`): Lambda layer ARNs
- `loader?` (`Input<Record<string, Loader>>`): esbuild loaders for file extensions
- `memory?` (`Input<string>`): Default `"1024 MB"` - RAM 128-10240 MB
- `runtime?` (`Input<"nodejs18.x" | "nodejs20.x" | "nodejs22.x">`): Default `"nodejs20.x"`
- `timeout?` (`Input<string>`): Default `"20 seconds"` - Maximum execution time

### transform?

**Type:** `Object`

Modifies underlying resources:
- `assets?`: Bucket configuration transformer
- `cdn?`: CloudFront CDN configuration transformer
- `server?`: Lambda function configuration transformer

### vpc?

**Type:** `Vpc | Input<Object>`

VPC connectivity for server function:
- `privateSubnets` (`Input<Input<string>[]>`): Subnet IDs
- `securityGroups` (`Input<Input<string>[]>`): Security group IDs

### warm?

**Type:** `Input<number>`
**Default:** `0`

Number of concurrent server function instances to keep warm.

## Properties

### nodes

**Type:** `Object`

Underlying resources:
- `assets?` (`Bucket`): S3 bucket storing assets
- `cdn?` (`Cdn`): CloudFront distribution serving site
- `server?` (`Output<Function>`): Lambda function rendering site

### url

**Type:** `Output<string>`

Site URL - custom domain if configured, otherwise CloudFront URL.

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
new sst.aws.Astro("MyWeb");
```

### Custom path

```typescript
new sst.aws.Astro("MyWeb", { path: "my-astro-app/" });
```

### Custom domain

```typescript
new sst.aws.Astro("MyWeb", { domain: "my-app.com" });
```

### WWW redirect

```typescript
new sst.aws.Astro("MyWeb", {
  domain: {
    name: "my-app.com",
    redirects: ["www.my-app.com"]
  }
});
```

### Linked resources

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Astro("MyWeb", { link: [bucket] });
```

### Access linked resource in site

```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

### Custom cache headers

```typescript
new sst.aws.Astro("MyWeb", {
  assets: {
    fileOptions: [{
      files: "**/*.zip",
      contentType: "application/zip",
      cacheControl: "private,no-cache,no-store,must-revalidate"
    }]
  }
});
```

### Environment variables

```typescript
new sst.aws.Astro("MyWeb", {
  environment: {
    API_URL: api.url,
    PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123"
  }
});
```

### Edge function injection

```typescript
new sst.aws.Astro("MyWeb", {
  edge: {
    viewerRequest: {
      injection: `event.request.headers["x-foo"] = { value: "bar" };`
    }
  }
});
```

### Router integration with path

```typescript
const router = new sst.aws.Router("Router", { domain: "example.com" });
new sst.aws.Astro("MyWeb", {
  router: { instance: router, path: "/docs" }
});
```

### Router integration with subdomain

```typescript
const router = new sst.aws.Router("Router", {
  domain: { name: "example.com", aliases: ["*.example.com"] }
});
new sst.aws.Astro("MyWeb", {
  router: { instance: router, domain: "docs.example.com" }
});
```

### Server configuration

```typescript
new sst.aws.Astro("MyWeb", {
  server: {
    architecture: "arm64",
    memory: "2048 MB",
    runtime: "nodejs22.x",
    timeout: "50 seconds",
    install: ["sharp"]
  }
});
```

### Invalidation settings

```typescript
new sst.aws.Astro("MyWeb", {
  invalidation: {
    paths: ["/index.html", "/products/*"],
    wait: true
  }
});
```

### Custom build command

```typescript
new sst.aws.Astro("MyWeb", {
  buildCommand: "yarn build"
});
```
