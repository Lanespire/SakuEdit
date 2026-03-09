# Auth

> Source: https://sst.dev/docs/component/aws/auth/

## Overview

The `Auth` component deploys centralized authentication servers on AWS using OpenAuth, Lambda, and DynamoDB. It always uses the `DynamoStorage` storage provider. Currently in **beta** status.

## Constructor

```typescript
new sst.aws.Auth(name, args, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args` (AuthArgs) - Configuration object (required)
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### issuer?
- **Type:** `Input<string | FunctionArgs>`
- Specifies the function running your OpenAuth server.
- Can be a simple handler path or a full `FunctionArgs` object.
- The issuer function must export a Hono app with Lambda adapter.

### domain?
- **Type:** `Input<string | Object>`
- Sets a custom domain for the auth server. Supports automatic management on Route 53, Cloudflare, and Vercel.
- Sub-properties:
  - `name` (Input<string>) - The custom domain (required)
  - `dns?` - DNS provider adapter (defaults to AWS Route 53)
  - `cert?` (Input<string>) - ACM certificate ARN for manual setup
  - `aliases?` (Input<string[]>) - Alternative domains without redirect
  - `redirects?` (Input<string[]>) - Alternate domains that redirect to main domain

## Properties

### url
- **Type:** `Output<string>`
- The Auth component URL. Uses custom domain if configured; otherwise, returns auto-generated function URL.

### nodes
Underlying resources:
- `issuer` (Output<Function>) - The issuer Lambda function
- `table` (Dynamo) - The DynamoDB storage table
- `router?` (Router) - Router component for custom domains

## Methods

No additional public methods documented.

## Links

When linked, the `Auth` component exposes the following through the SDK `Resource` object:
- `url` (string) - Auth component URL

## Examples

### Basic setup
```typescript
const auth = new sst.aws.Auth("MyAuth", {
  issuer: "src/auth.handler"
});
```

### With custom domain
```typescript
new sst.aws.Auth("MyAuth", {
  issuer: "src/auth.handler",
  domain: "auth.example.com"
});
```

### With Cloudflare DNS
```typescript
new sst.aws.Auth("MyAuth", {
  issuer: "src/auth.handler",
  domain: {
    name: "auth.example.com",
    dns: sst.cloudflare.dns()
  }
});
```

### With domain aliases
```typescript
new sst.aws.Auth("MyAuth", {
  issuer: "src/auth.handler",
  domain: {
    name: "auth.example.com",
    aliases: ["auth2.example.com"]
  }
});
```

### With domain redirects
```typescript
new sst.aws.Auth("MyAuth", {
  issuer: "src/auth.handler",
  domain: {
    name: "auth.example.com",
    redirects: ["old-auth.example.com"]
  }
});
```
