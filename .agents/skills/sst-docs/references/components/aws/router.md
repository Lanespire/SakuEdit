# Router

> Source: https://sst.dev/docs/component/aws/router/

## Overview

The `Router` component uses Amazon CloudFront to direct requests to various application parts including URLs, functions, frontends, and S3 buckets. It manages routing through a CloudFront KeyValueStore and function, dynamically setting origins based on routing data.

## Constructor

```typescript
new sst.aws.Router(name, args?, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args?` (RouterArgs) - Configuration options
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### domain?
- **Type:** `Input<string | Object>`
- Custom domain configuration.
- Sub-properties:
  - `name` (Input<string>) - The custom domain to use
  - `aliases?` (Input<string[]>) - Alternate domains where visitors remain on the alias domain
  - `cert?` (Input<string>) - ACM certificate ARN for domain ownership validation
  - `dns?` (Input<false | dns adapters>) - DNS provider (defaults to AWS Route 53)
  - `redirects?` (Input<string[]>) - Alternate domains that redirect to main domain

### edge?
- **Type:** `Object`
- CloudFront Functions configuration.
- Sub-properties:
  - `viewerRequest?` (Object) - Modify incoming requests:
    - `injection?` (string) - Code to inject
    - `kvStore?` - Key-value store
  - `viewerResponse?` (Object) - Modify outgoing responses:
    - `injection?` (string) - Code to inject
    - `kvStore?` - Key-value store

### invalidation?
- **Type:** `Input<boolean | Object>`
- Cache invalidation settings.
- Sub-properties:
  - `paths?` (Input<Input<string>[]>) - Glob patterns for paths to invalidate
  - `token?` (Input<string>) - Token to determine if cache should be invalidated
  - `wait?` (Input<boolean>) - Wait for invalidation to complete (default: `false`)

### transform?
- **Type:** `Object`
- Resource transformation options.
- Sub-properties:
  - `cachePolicy?` - Transform Cache Policy for CloudFront behaviors
  - `cdn?` - Transform CloudFront CDN resource

## Properties

### distributionID
- **Type:** `Output<string>`
- The Router CloudFront distribution ID.

### url
- **Type:** `Output<string>`
- Router URL. Uses custom domain if configured, otherwise auto-generated CloudFront URL.

### nodes
Underlying resources:
- `cdn` (Output<Cdn>) - Amazon CloudFront CDN resource

## Methods

### route(pattern, url, args?)

```typescript
route(pattern: Input<string>, url: Input<string>, args?: Input<RouterUrlRouteArgs>): void
```

Add a route to a destination URL. Patterns can match path prefixes (`/api`), domains (`api.example.com`), or combined patterns. Supports path rewriting via regex.

**RouterUrlRouteArgs:**
- `connectionAttempts?` (Input<number>) - CloudFront connection attempts, 1-3 (default: 3)
- `connectionTimeout?` (Input<string>) - Connection timeout, 1-10 seconds (default: `"10 seconds"`)
- `keepAliveTimeout?` (Input<string>) - Keep-alive duration, 1-60 seconds (default: `"5 seconds"`)
- `readTimeout?` (Input<string>) - Response timeout, 1-60 seconds (default: `"20 seconds"`)
- `rewrite?` (Object) - Path rewriting:
  - `regex` (string) - Regex pattern to match
  - `to` (string) - Replacement string

### routeBucket(pattern, bucket, args?)

```typescript
routeBucket(pattern: Input<string>, bucket: Input<Bucket>, args?: Input<RouterBucketRouteArgs>): void
```

Add a route to an S3 bucket. Bucket must have CloudFront access enabled. Supports path prefixes, domain patterns, and path rewriting.

**RouterBucketRouteArgs:**
- `connectionAttempts?` (Input<number>) - CloudFront connection attempts, 1-3 (default: 3)
- `connectionTimeout?` (Input<string>) - Connection timeout, 1-10 seconds (default: `"10 seconds"`)
- `rewrite?` (Object) - Path rewriting:
  - `regex` (string) - Regex pattern
  - `to` (string) - Replacement string

### static get(name, distributionID, opts?)

```typescript
static get(name: string, distributionID: Input<string>, opts?: ComponentResourceOptions): Router
```

Reference an existing Router by CloudFront distribution ID for stage sharing.

## Links

When linked, the `Router` component exposes the following through the SDK `Resource` object:
- `url` (string) - The Router URL

## Examples

### Minimal setup
```typescript
new sst.aws.Router("MyRouter");
```

### Custom domain
```typescript
new sst.aws.Router("MyRouter", {
  domain: "myapp.com"
});
```

### Route to URL
```typescript
router.route("/", "https://some-external-service.com");
```

### Route to API
```typescript
router.route("/api", "https://api.example.com");
```

### Route to S3 bucket
```typescript
router.routeBucket("/files", myBucket);
```

### With path rewriting
```typescript
router.route("/api", "https://api.example.com", {
  rewrite: {
    regex: "^/api/(.*)$",
    to: "/$1"
  }
});
```

### Share across stages
```typescript
const router = $app.stage === "production"
  ? new sst.aws.Router("MyRouter", { domain: "example.com" })
  : sst.aws.Router.get("MyRouter", "E1XWRGCYGTFB7Z");
```

### With domain aliases
```typescript
new sst.aws.Router("MyRouter", {
  domain: {
    name: "myapp.com",
    aliases: ["www.myapp.com"]
  }
});
```

### With domain redirects
```typescript
new sst.aws.Router("MyRouter", {
  domain: {
    name: "myapp.com",
    redirects: ["old.myapp.com"]
  }
});
```

### Cache invalidation
```typescript
new sst.aws.Router("MyRouter", {
  invalidation: {
    paths: ["/*"],
    wait: true
  }
});
```
