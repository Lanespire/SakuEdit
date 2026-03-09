# Nuxt

> Source: https://sst.dev/docs/component/aws/nuxt/

## Overview

The `Nuxt` component deploys a Nuxt application to AWS, handling server rendering, static asset delivery, and CloudFront CDN distribution.

## Constructor

```typescript
new sst.aws.Nuxt(name, args?, opts?)
```

**Parameters:**
- `name` (string): Component identifier
- `args?` (NuxtArgs): Configuration options
- `opts?` (ComponentResourceOptions): Pulumi resource options

## Props

### assets?

**Type:** `Input<Object>`

Controls S3 asset upload behavior:
- `fileOptions?` (`Input<Object[]>`): Array of file-specific configurations
  - `cacheControl?` (string): HTTP cache header value
  - `contentType?` (string): Custom Content-Type header
  - `files` (string | string[]): Glob patterns to match
  - `ignore?` (string | string[]): Patterns to exclude
- `textEncoding?` (`Input<"utf-8" | "iso-8859-1" | "windows-1252" | "ascii" | "none">`): Default `"utf-8"`
- `versionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=31536000,immutable"`
- `nonVersionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=0,s-maxage=86400,stale-while-revalidate=8640"`
- `purge?` (`Input<boolean>`): Default `true` - Remove previous deployment files

### buildCommand?

**Type:** `Input<string>`
**Default:** `"npm run build"`

Command used to build the Nuxt application.

### cachePolicy?

**Type:** `Input<string>`

CloudFront cache policy ID (avoids creating new policies; limit: 20 per account).

### dev?

**Type:** `false | Object`

Development mode configuration:
- `autostart?` (`Input<boolean>`): Default `true` - Auto-start in `sst dev`
- `command?` (`Input<string>`): Default `"npm run dev"` - Dev start command
- `directory?` (`Input<string>`): Directory to run command from
- `title?` (`Input<string>`): Tab title in multiplexer
- `url?` (`Input<string>`): Default `"http://url-unavailable-in-dev.mode"` - Placeholder URL

### domain?

**Type:** `Input<string | Object>`

Custom domain configuration:
- `name` (string): Domain name (required, supports stage-based templates)
- `aliases?` (`Input<string[]>`): Alternative domains (visitor stays on alias)
- `redirects?` (`Input<string[]>`): Domains that redirect to main domain
- `cert?` (`Input<string>`): ACM certificate ARN for manual setup
- `dns?` (`Input<false | sst.aws.dns | sst.cloudflare.dns | sst.vercel.dns>`): Default `sst.aws.dns` - DNS provider adapter

### edge?

**Type:** `Input<Object>`

CloudFront Functions for request/response customization:
- `viewerRequest?`: Configure request modifications
  - `injection` (string): Code to inject at function start
  - `kvStore?` (`Input<string>`): KV store ARN
- `viewerResponse?`: Configure response modifications
  - `injection` (string): Code to inject at function start
  - `kvStore?` (`Input<string>`): KV store ARN

### environment?

**Type:** `Input<Record<string, Input<string>>>`

Environment variables accessible during build and `sst dev`. Prefix with `VUE_APP_` for browser access.

### invalidation?

**Type:** `Input<false | Object>`
**Default:** `{paths: "all", wait: false}`

CloudFront cache invalidation settings:
- `paths?` (`Input<string[] | "all" | "versioned">`): Files to invalidate
- `wait?` (`Input<boolean>`): Wait for completion before deploy finishes

### link?

**Type:** `Input<any[]>`

Resources to link (grants permissions and SDK access).

### path?

**Type:** `Input<string>`
**Default:** `"."`

Relative path to Nuxt app directory from `sst.config.ts`.

### permissions?

**Type:** `Input<Object[]>`

IAM permissions for server function:
- `actions` (string[]): IAM actions (e.g., `["s3:GetObject"]`)
- `resources` (`Input<Input<string>[]>`): IAM ARN format resources
- `effect?` (`"allow" | "deny"`): Default `"allow"`

### regions?

**Type:** `Input<string[]>`
**Default:** Single default region of SST app

Deploy server function to multiple regions for geo-routing.

### router?

**Type:** `Object`

Serve through Router component instead of standalone CloudFront:
- `instance` (`Input<Router>`): Router component reference (required)
- `domain?` (`Input<string>`): Subdomain pattern (e.g., `"docs.example.com"`)
- `path?` (`Input<string>`): Default `"/"` - Path prefix (e.g., `"/docs"`)

### server?

**Type:** `Object`
**Default:** `{architecture: "x86_64", memory: "1024 MB"}`

Lambda server function configuration:
- `architecture?` (`Input<"x86_64" | "arm64">`): Default `"x86_64"`
- `memory?` (`Input<string>`): Default `"1024 MB"` - 128-10240 MB
- `runtime?` (`Input<"nodejs18.x" | "nodejs20.x" | "nodejs22.x">`): Default `"nodejs20.x"`
- `timeout?` (`Input<string>`): Default `"20 seconds"` - Max 60s via CloudFront
- `layers?` (`Input<Input<string>[]>`): Lambda layer ARNs
- `install?` (`Input<string[]>`): NPM packages excluded from bundling
- `loader?` (`Input<Record<string, Loader>>`): esbuild loaders for file types

### transform?

**Type:** `Object`

Transform underlying resources:
- `assets?`: Transform S3 Bucket resource
- `cdn?`: Transform CloudFront CDN resource
- `server?`: Transform Lambda Function resource

### vpc?

**Type:** `Vpc | Input<Object>`

VPC configuration for private subnet access:
- `privateSubnets` (`Input<Input<string>[]>`): Subnet IDs
- `securityGroups` (`Input<Input<string>[]>`): Security group IDs

### warm?

**Type:** `Input<number>`
**Default:** `0`

Number of concurrent server function instances to keep warm via periodic cron invocations.

## Properties

### nodes

**Type:** `Object`

Underlying resources:
- `assets` (`Bucket | undefined`): S3 bucket storing assets
- `cdn` (`Cdn | undefined`): CloudFront CDN serving the site
- `server` (`Output<Function> | undefined`): Lambda server function

### url

**Type:** `Output<string>`

Deployment URL (custom domain if set, otherwise auto-generated CloudFront URL).

## Links

When linked, the following is accessible via the `Resource` object:
- `url` (string): The Nuxt app's URL

```typescript
import { Resource } from "sst";
console.log(Resource.MyWeb.url);
```

## Examples

### Minimal deployment

```typescript
new sst.aws.Nuxt("MyWeb");
```

### Custom path

```typescript
new sst.aws.Nuxt("MyWeb", { path: "my-nuxt-app/" });
```

### Custom domain

```typescript
new sst.aws.Nuxt("MyWeb", { domain: "my-app.com" });
```

### WWW redirect

```typescript
new sst.aws.Nuxt("MyWeb", {
  domain: {
    name: "my-app.com",
    redirects: ["www.my-app.com"]
  }
});
```

### Link resources

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Nuxt("MyWeb", { link: [bucket] });
```

### Access linked resources in app

```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

### Asset cache control

```typescript
new sst.aws.Nuxt("MyWeb", {
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

### CloudFront cache headers

```typescript
new sst.aws.Nuxt("MyWeb", {
  assets: {
    textEncoding: "iso-8859-1",
    versionedFilesCacheHeader: "public,max-age=31536000,immutable",
    nonVersionedFilesCacheHeader: "public,max-age=0,no-cache"
  }
});
```

### Selective invalidation

```typescript
new sst.aws.Nuxt("MyWeb", {
  invalidation: {
    paths: ["/index.html", "/products/*"],
    wait: true
  }
});
```

### Multiple regions

```typescript
new sst.aws.Nuxt("MyWeb", {
  regions: ["us-east-1", "eu-west-1"]
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

new sst.aws.Nuxt("MyWeb", {
  router: {
    instance: router,
    domain: "docs.example.com"
  }
});
```

### Router integration (path)

```typescript
const router = new sst.aws.Router("Router", {
  domain: "example.com"
});

new sst.aws.Nuxt("MyWeb", {
  router: {
    instance: router,
    path: "/docs"
  }
});
```

**Note:** Also set `baseURL` in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  app: {
    baseURL: "/docs"
  }
});
```

### Server configuration

```typescript
new sst.aws.Nuxt("MyWeb", {
  server: {
    architecture: "arm64",
    memory: "2048 MB",
    runtime: "nodejs22.x",
    timeout: "50 seconds",
    install: ["sharp"],
    layers: ["arn:aws:lambda:us-east-1:123456789012:layer:my-layer:1"],
    loader: {
      ".png": "file"
    }
  }
});
```

### Edge functions (viewer request)

```typescript
new sst.aws.Nuxt("MyWeb", {
  edge: {
    viewerRequest: {
      injection: `event.request.headers["x-foo"] = { value: "bar" };`
    }
  }
});
```

### Edge functions (viewer response)

```typescript
new sst.aws.Nuxt("MyWeb", {
  edge: {
    viewerResponse: {
      injection: `event.response.headers["x-foo"] = { value: "bar" };`
    }
  }
});
```

### IAM permissions

```typescript
new sst.aws.Nuxt("MyWeb", {
  permissions: [
    {
      actions: ["s3:GetObject", "s3:PutObject"],
      resources: ["arn:aws:s3:::my-bucket/*"]
    }
  ]
});
```

### Environment variables

```typescript
new sst.aws.Nuxt("MyWeb", {
  environment: {
    API_URL: api.url,
    VUE_APP_STRIPE_PUBLISHABLE_KEY: "pk_test_123"
  }
});
```

### VPC configuration

```typescript
const myVpc = new sst.aws.Vpc("MyVpc");
new sst.aws.Nuxt("MyWeb", { vpc: myVpc });
```

### Keep-warm configuration

```typescript
new sst.aws.Nuxt("MyWeb", { warm: 5 });
```

### Custom build command

```typescript
new sst.aws.Nuxt("MyWeb", { buildCommand: "yarn build" });
```

### Cloudflare domain

```typescript
new sst.aws.Nuxt("MyWeb", {
  domain: {
    name: "example.com",
    dns: sst.cloudflare.dns()
  }
});
```

### Manual domain setup

```typescript
new sst.aws.Nuxt("MyWeb", {
  domain: {
    name: "domain.com",
    dns: false,
    cert: "arn:aws:acm:us-east-1:112233445566:certificate/3a958790-8878-4cdc-a396-06d95064cf63"
  }
});
```
