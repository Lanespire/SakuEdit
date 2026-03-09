# React

> Source: https://sst.dev/docs/component/aws/react/

## Overview

The `React` component enables deployment of React applications built with React Router to AWS. It manages infrastructure including S3 storage for assets, CloudFront CDN distribution, and Lambda functions for server-side rendering.

## Constructor

```typescript
new sst.aws.React(name, args?, opts?)
```

**Parameters:**
- `name` (string): Component identifier
- `args?` (ReactArgs): Configuration object
- `opts?` (ComponentResourceOptions): Pulumi resource options

## Props

### assets?

**Type:** `Input<Object>`

Manages how React app assets upload to S3:
- `fileOptions?` (`Input<Object[]>`): Applies `Content-Type` and `Cache-Control` headers to specific files via glob patterns
  - `cacheControl?` (string): HTTP cache header value
  - `contentType?` (string): MIME type header
  - `files` (string | string[]): Glob pattern(s) for matching files
  - `ignore?` (string | string[]): Patterns to exclude from matches
- `nonVersionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=0,s-maxage=86400,stale-while-revalidate=8640"` - Cache header for non-versioned files like index.html
- `versionedFilesCacheHeader?` (`Input<string>`): Default `"public,max-age=31536000,immutable"` - Cache header for versioned files like main-1234.css
- `purge?` (`Input<boolean>`): Default `true` - Whether to remove files from previous deployments
- `textEncoding?` (`Input<"utf-8" | "iso-8859-1" | "windows-1252" | "ascii" | "none">`): Default `"utf-8"` - Character encoding for text assets

### buildCommand?

**Type:** `Input<string>`
**Default:** `"npm run build"`

Custom command for building the React application.

### cachePolicy?

**Type:** `Input<string>`

Existing CloudFront cache policy ARN. When omitted, a new policy is created (limited to 20 per account).

### dev?

**Type:** `false | Object`

Configures `sst dev` behavior:
- `autostart?` (`Input<boolean>`): Default `true` - Automatically start when `sst dev` launches
- `command?` (`Input<string>`): Default `"npm run dev"` - Dev server startup command
- `directory?` (`Input<string>`): Working directory for command execution (defaults to `path`)
- `title?` (`Input<string>`): Tab label in multiplexer display
- `url?` (`Input<string>`): Default `"http://url-unavailable-in-dev.mode"` - Placeholder URL during development

### domain?

**Type:** `Input<string | Object>`

Custom domain configuration:
- `name` (string): Domain name (can include stage interpolation)
- `aliases?` (`Input<string[]>`): Alternative domains (visitor stays on alias)
- `redirects?` (`Input<string[]>`): Domains that redirect to main domain
- `dns?` (`Input<false | sst.aws.dns | sst.cloudflare.dns | sst.vercel.dns>`): Default `sst.aws.dns` - DNS provider adapter
- `cert?` (`Input<string>`): ACM certificate ARN for validation (required for unsupported providers)

### edge?

**Type:** `Input<Object>`

CloudFront Functions for edge customization:
- `viewerRequest?` (`Input<Object>`):
  - `injection` (string): Code injected into viewer request handler
  - `kvStore?` (`Input<string>`): KV store ARN for viewer request
- `viewerResponse?` (`Input<Object>`):
  - `injection` (string): Code injected into viewer response handler
  - `kvStore?` (`Input<string>`): KV store ARN for viewer response

### environment?

**Type:** `Input<Record<string, Input<string>>>`

Environment variables accessible during build and dev. Alternative to using `link` for resources.

### invalidation?

**Type:** `Input<false | Object>`
**Default:** `{paths: "all", wait: false}`

CloudFront cache invalidation settings:
- `paths?` (`Input<string[] | "all" | "versioned">`): Default `"all"` - Paths to invalidate
- `wait?` (`Input<boolean>`): Default `false` - Whether deployment waits for invalidation completion

### link?

**Type:** `Input<any[]>`

Resources to link, granting permissions and enabling SDK access.

### path?

**Type:** `Input<string>`
**Default:** `"."`

Relative path to React app directory from sst.config.ts.

### permissions?

**Type:** `Input<Object[]>`

IAM permissions for server function:
- `actions` (string[]): IAM action names
- `effect?` (`"allow" | "deny"`): Default `"allow"` - Permission type
- `resources` (`Input<Input<string>[]>`): IAM ARN format resource identifiers

### regions?

**Type:** `Input<string[]>`

Regions for server function deployment (defaults to SST app region).

### router?

**Type:** `Object`

Serve through Router instead of standalone CloudFront:
- `instance` (`Input<Router>`): Router component reference
- `domain?` (`Input<string>`): Subdomain pattern (e.g., `"docs.example.com"`)
- `path?` (`Input<string>`): Default `"/"` - Path prefix (e.g., `"/docs"`)

### server?

**Type:** `Object`
**Default:** `{architecture: "x86_64", memory: "1024 MB"}`

Lambda function configuration:
- `architecture?` (`Input<"x86_64" | "arm64">`): Default `"x86_64"` - Processor architecture
- `install?` (`Input<string[]>`): NPM packages excluded from bundling
- `layers?` (`Input<Input<string>[]>`): Lambda layer ARNs
- `loader?` (`Input<Record<string, Loader>>`): esbuild loaders for file types
- `memory?` (`Input<string>`): Default `"1024 MB"` - Range: 128 MB to 10240 MB
- `runtime?` (`Input<"nodejs18.x" | "nodejs20.x" | "nodejs22.x">`): Default `"nodejs20.x"`
- `timeout?` (`Input<string>`): Default `"20 seconds"` - Max 60 seconds without limit increase

### transform?

**Type:** `Object`

Modify underlying resources:
- `assets?`: Transforms Bucket configuration
- `cdn?`: Transforms CDN configuration
- `server?`: Transforms Function configuration

### vpc?

**Type:** `Vpc | Input<Object>`

VPC connectivity for server function:
- `privateSubnets` (`Input<Input<string>[]>`): Subnet IDs
- `securityGroups` (`Input<Input<string>[]>`): Security group IDs

### warm?

**Type:** `Input<number>`
**Default:** `0`

Number of server function instances to keep warm via concurrent cron requests.

## Properties

### nodes

**Type:** `Object`

Underlying resources:
- `assets?` (`Bucket | undefined`): S3 bucket storing assets
- `cdn?` (`Cdn | undefined`): CloudFront distribution
- `server?` (`Output<Function> | undefined`): Lambda server function

### url

**Type:** `Output<string>`

React app URL (custom domain if configured, otherwise CloudFront auto-generated URL).

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
new sst.aws.React("MyWeb");
```

### Custom path

```typescript
new sst.aws.React("MyWeb", { path: "my-react-app/" });
```

### Custom domain

```typescript
new sst.aws.React("MyWeb", { domain: "my-app.com" });
```

### WWW redirect

```typescript
new sst.aws.React("MyWeb", {
  domain: {
    name: "my-app.com",
    redirects: ["www.my-app.com"]
  }
});
```

### Link resources

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.React("MyWeb", { link: [bucket] });
```

### Access linked resources in app (app/root.tsx)

```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```
