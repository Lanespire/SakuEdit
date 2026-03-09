# StaticSite

> Source: https://sst.dev/docs/component/aws/static-site/

## Overview

The `StaticSite` component deploys static websites to AWS using S3 for storage and CloudFront for content delivery. It supports automatic building via static site generators like Vite, and works with plain HTML files as well.

## Constructor

```typescript
new sst.aws.StaticSite(name, args?, opts?)
```

**Parameters:**
- `name` (string): Component identifier
- `args?` (StaticSiteArgs): Configuration options
- `opts?` (ComponentResourceOptions): Pulumi resource options

## Props

### assets?

**Type:** `Object`

Controls S3 asset upload behavior:
- `bucket?` (`Input<string>`): Existing S3 bucket name; creates new by default
- `fileOptions?` (`Input<Object[]>`): Cache and content-type rules by file pattern
  - `cacheControl?` (string): HTTP Cache-Control header value
  - `contentType?` (string): MIME type header
  - `files` (string | string[]): Glob pattern(s) to match
  - `ignore?` (string | string[]): Exclude patterns
- `path?` (`Input<string>`): S3 path prefix for uploads (default: bucket root)
- `purge?` (`Input<boolean>`): Default `true` - Remove old files on deploy
- `routes?` (`Input<Input<string>[]>`): Additional asset routes for direct S3 serving
- `textEncoding?` (`Input<"utf-8" | "iso-8859-1" | "windows-1252" | "ascii" | "none">`): Default `"utf-8"`

**Default behavior:** Caches CSS/JS for 1 year; doesn't cache HTML files.

### build?

**Type:** `Input<Object>`

Configures static site generation:
- `command` (`Input<string>`): Build command (e.g., `"npm run build"`)
- `output` (`Input<string>`): Output directory path relative to site root

### dev?

**Type:** `false | Object`

Local development settings:
- `autostart?` (`Input<boolean>`): Default `true` - Auto-start in `sst dev`
- `command?` (`Input<string>`): Default `"npm run dev"` - Dev server command
- `directory?` (`Input<string>`): Working directory for command
- `title?` (`Input<string>`): Multiplexer tab name
- `url?` (`Input<string>`): Placeholder URL in dev mode

### domain?

**Type:** `Input<string | Object>`

Custom domain configuration:
- `name` (`Input<string>`): Primary domain (required)
- `aliases?` (`Input<string[]>`): Alias domains (no redirect)
- `cert?` (`Input<string>`): ACM certificate ARN for validation
- `dns?` (`Input<false | sst.aws.dns | sst.cloudflare.dns | sst.vercel.dns>`): DNS provider (default: AWS)
- `redirects?` (`Input<string[]>`): Domains that redirect to main domain

### edge?

**Type:** `Input<Object>`

CloudFront edge function customization:
- `viewerRequest?` (`Input<Object>`): Modify incoming requests
  - `injection` (`Input<string>`): Code to inject at function start
  - `kvStore?` (`Input<string>`): KV store ARN association
- `viewerResponse?` (`Input<Object>`): Modify outgoing responses
  - `injection` (`Input<string>`): Code to inject
  - `kvStore?` (`Input<string>`): KV store ARN association

### environment?

**Type:** `Input<Record<string, Input<string>>>`

Environment variables for build and runtime. Variables prefixed with `VITE_` accessible in browser for Vite projects.

### errorPage?

**Type:** `Input<string>`

Path to error page for 403/404 responses (relative to site root). Default: value of `indexPage`.

### indexPage?

**Type:** `string`

Index page name (default: `"index.html"`). Only applies to root path.

### invalidation?

**Type:** `Input<false | Object>`
**Default:** `{paths: "all", wait: false}`

CloudFront cache invalidation settings:
- `paths?` (`Input<string[] | "all">`): Paths to invalidate
- `wait?` (`Input<boolean>`): Default `false` - Wait for completion

### path?

**Type:** `Input<string>`
**Default:** `"."`

Directory path relative to `sst.config.ts`. Uploaded to S3 unless `build` is configured.

### router?

**Type:** `Object`

Serve through Router component instead of standalone CloudFront:
- `instance` (`Input<Router>`): Router component reference (required)
- `domain?` (`Input<string>`): Subdomain pattern
- `path?` (`Input<string>`): Default `"/"` - Path prefix

### transform?

**Type:** `Object`

Resource transformation callbacks:
- `assets?`: Transform underlying S3 Bucket
- `cdn?`: Transform CloudFront CDN

### vite?

**Type:** `Input<Object>`

Vite-specific configuration:
- `types?` (string): Type definition file location (default: `"src/sst-env.d.ts"`)

## Properties

### nodes

**Type:** `Object`

Underlying resources:
- `assets` (`Bucket | undefined`): S3 bucket storing assets
- `cdn` (`Cdn | undefined`): CloudFront distribution

### url

**Type:** `Output<string>`

Website URL (custom domain if set, otherwise CloudFront auto-generated URL).

## Links

When linked, the following is accessible via the `Resource` object:
- `url` (string): Website URL

```typescript
import { Resource } from "sst";
console.log(Resource.MyWeb.url);
```

## Examples

### Minimal deployment

```typescript
new sst.aws.StaticSite("MyWeb");
```

### Custom path

```typescript
new sst.aws.StaticSite("MyWeb", { path: "path/to/site" });
```

### Vite SPA

```typescript
new sst.aws.StaticSite("MyWeb", {
  build: {
    command: "npm run build",
    output: "dist"
  }
});
```

### Jekyll site

```typescript
new sst.aws.StaticSite("MyWeb", {
  errorPage: "/404.html",
  build: {
    command: "bundle exec jekyll build",
    output: "_site"
  }
});
```

### Gatsby site

```typescript
new sst.aws.StaticSite("MyWeb", {
  errorPage: "/404.html",
  build: {
    command: "npm run build",
    output: "public"
  }
});
```

### Angular SPA

```typescript
new sst.aws.StaticSite("MyWeb", {
  build: {
    command: "ng build --output-path dist",
    output: "dist"
  }
});
```

### Custom domain

```typescript
new sst.aws.StaticSite("MyWeb", { domain: "my-app.com" });
```

### WWW redirect

```typescript
new sst.aws.StaticSite("MyWeb", {
  domain: {
    name: "my-app.com",
    redirects: ["www.my-app.com"]
  }
});
```

### Environment variables

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.StaticSite("MyWeb", {
  environment: {
    BUCKET_NAME: bucket.name,
    VITE_STRIPE_PUBLISHABLE_KEY: "pk_test_123"
  },
  build: {
    command: "npm run build",
    output: "dist"
  }
});
```

### Cache configuration

```typescript
new sst.aws.StaticSite("MyWeb", {
  assets: {
    fileOptions: [
      {
        files: ["**/*.css", "**/*.js"],
        cacheControl: "max-age=31536000,public,immutable"
      },
      {
        files: "**/*.html",
        cacheControl: "max-age=0,no-cache,no-store,must-revalidate"
      }
    ]
  }
});
```

### Edge function injection

```typescript
new sst.aws.StaticSite("MyWeb", {
  edge: {
    viewerRequest: {
      injection: `event.request.headers["x-foo"] = { value: "bar" };`
    }
  }
});
```

### Router integration (path)

```typescript
const router = new sst.aws.Router("Router", { domain: "example.com" });
new sst.aws.StaticSite("MyWeb", {
  router: { instance: router, path: "/docs" }
});
```

### Router integration (subdomain)

```typescript
const router = new sst.aws.Router("Router", {
  domain: { name: "example.com", aliases: ["*.example.com"] }
});
new sst.aws.StaticSite("MyWeb", {
  router: { instance: router, domain: "docs.example.com" }
});
```
