# Custom Domains

> Source: https://sst.dev/docs/custom-domains/

## Overview

SST enables configuration of custom domains and subdomains for frontends, APIs, services, and routers. The feature currently supports AWS components, with domain configuration acting as a two-step validation and DNS routing process.

## Key Configuration Examples

**Frontend (Next.js):**

```typescript
new sst.aws.Nextjs("MyWeb", {
  domain: "example.com"
});
```

**API Gateway:**

```typescript
new sst.aws.ApiGatewayV2("MyApi", {
  domain: "api.example.com"
});
```

**Service with Load Balancer:**

```typescript
const vpc = new sst.aws.Vpc("MyVpc");
new sst.aws.Cluster("MyCluster", {
  vpc,
  loadBalancer: { domain: "example.com" }
});
```

## How It Works

The setup involves two essential steps:

1. **Domain Ownership Validation** - Create an ACM certificate and validate through DNS records or email verification
2. **DNS Record Configuration** - Route the domain to your component

## Supported DNS Adapters

### AWS Route 53 (default)

- Automatically assumed for domains in same AWS account
- Specify hosted zones when needed

### Vercel

- Requires `VERCEL_API_TOKEN` environment variable
- Optional `VERCEL_TEAM_ID` for team domains

### Cloudflare

- Needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_DEFAULT_ACCOUNT_ID`
- Token must have "Edit zone DNS" permissions

## Advanced Features

### WWW Redirects

```typescript
domain: {
  name: "example.com",
  redirects: ["www.example.com"]
}
```

### Subdomains with Aliases

```typescript
domain: {
  name: "example.com",
  aliases: ["*.example.com"]
}
```

## Manual Setup

For unsupported providers or cross-account scenarios:

1. Manually validate domain ownership
2. Obtain the certificate ARN
3. Disable automatic DNS (`dns: false`)
4. Add DNS records yourself

Example with manual DNS:

```typescript
new sst.aws.Nextjs("MyWeb", {
  domain: {
    name: "example.com",
    dns: false,
    cert: "arn:aws:acm:us-east-1:123456789012:certificate/abc-123"
  }
});
```
