# Configure a Router

> Source: https://sst.dev/docs/configure-a-router/

## Overview

The Router component allows you to create and share a single CloudFront distribution across your entire application instead of creating separate distributions for each component and stage. This approach reduces deployment time significantly, as CloudFront distributions can take 15-20 minutes to deploy.

## Key Benefits

- **Multiple frontends**: Manage landing pages, docs sites, and other frontends from one distribution
- **Path-based routing**: Serve resources from different paths like `/docs` or `/api` on the same domain
- **Preview environments**: Set up subdomains for staging and PR environments
- **Faster deployments**: Avoid creating new CloudFront distributions for each component and stage

## Sample Application Structure

The guide demonstrates a typical app with three components:

```typescript
// Frontend
const web = new sst.aws.Nextjs("MyWeb", {
  path: "packages/web"
});

// API
const api = new sst.aws.Function("MyApi", {
  url: true,
  handler: "packages/functions/api.handler"
});

// Documentation
const docs = new sst.aws.Astro("MyDocs", {
  path: "packages/docs"
});
```

### Production Routing Goals

- `example.com` -> MyWeb
- `example.com/api` -> MyApi
- `docs.example.com` -> MyDocs

### Development Routing Goals

- `dev.example.com` -> MyWeb
- `dev.example.com/api` -> MyApi
- `docs.dev.example.com` -> MyDocs

### Preview Environment Goals

- `pr-123.dev.example.com` -> MyWeb
- `pr-123.dev.example.com/api` -> MyApi
- `docs-pr-123.dev.example.com` -> MyDocs

## Implementation Steps

### Step 1: Add the Router

Create a Router component with your production domain:

```typescript
const router = new sst.aws.Router("MyRouter", {
  domain: {
    name: "example.com",
    aliases: ["*.example.com"]
  }
});
```

The wildcard alias enables routing to subdomains like `docs.example.com`.

### Step 2: Configure Components to Use the Router

Update each component to reference the router instead of using individual custom domains:

**Frontend configuration:**

```typescript
const web = new sst.aws.Nextjs("MyWeb", {
  path: "packages/web",
  router: {
    instance: router
  }
});
```

**API configuration:**

```typescript
const api = new sst.aws.Function("MyApi", {
  handler: "packages/functions/api.handler",
  url: {
    router: {
      instance: router,
      path: "/api"
    }
  }
});
```

**Documentation configuration:**

```typescript
const docs = new sst.aws.Astro("MyDocs", {
  path: "packages/docs",
  router: {
    instance: router,
    domain: "docs.example.com"
  }
});
```

### Step 3: Implement Stage-Based Domains

Create a function that returns appropriate domains based on deployment stage:

```typescript
const domain = $app.stage === "production"
  ? "example.com"
  : $app.stage === "dev"
    ? "dev.example.com"
    : `${$app.stage}.dev.example.com`;
```

Update the Router configuration to use this dynamic domain:

```typescript
const router = new sst.aws.Router("MyRouter", {
  domain: {
    name: domain,
    aliases: [`*.${domain}`]
  }
});
```

Update the documentation component:

```typescript
const docs = new sst.aws.Astro("MyDocs", {
  path: "packages/docs",
  router: {
    instance: router,
    domain: `docs.${domain}`
  }
});
```

### Step 4: Share Router Across Preview Environments

To share the dev stage's router with PR preview stages, conditionally create or reference the router:

```typescript
const isPermanentStage = ["production", "dev"].includes($app.stage);

const router = isPermanentStage
  ? new sst.aws.Router("MyRouter", {
      domain: {
        name: domain,
        aliases: [`*.${domain}`]
      }
    })
  : sst.aws.Router.get("MyRouter", "A2WQRGCYGTFB7Z");
```

The distribution ID (`A2WQRGCYGTFB7Z`) refers to the CloudFront distribution created in the dev stage. This can be found in the SST Console or output during deployment.

Output the router ID for reference:

```typescript
return {
  router: router.distributionID
};
```

### Step 5: Handle Nested Subdomains

CloudFront doesn't support nested wildcard patterns like `*.docs.*.example.com`. Instead, use a naming convention that replaces dots with hyphens for preview environments:

```typescript
function subdomain(name: string) {
  if (isPermanentStage) return `${name}.${domain}`;
  return `${name}-${domain}`;
}
```

Update the documentation component to use this helper:

```typescript
const docs = new sst.aws.Astro("MyDocs", {
  path: "packages/docs",
  router: {
    instance: router,
    domain: subdomain("docs")
  }
});
```

This produces:

- Production: `docs.example.com`
- Dev: `docs.dev.example.com`
- PR stages: `docs-pr-123.dev.example.com`

## Complete Configuration Example

```typescript
const isPermanentStage = ["production", "dev"].includes($app.stage);

const domain = $app.stage === "production"
  ? "example.com"
  : $app.stage === "dev"
    ? "dev.example.com"
    : `${$app.stage}.dev.example.com`;

function subdomain(name: string) {
  if (isPermanentStage) return `${name}.${domain}`;
  return `${name}-${domain}`;
}

const router = isPermanentStage
  ? new sst.aws.Router("MyRouter", {
      domain: {
        name: domain,
        aliases: [`*.${domain}`]
      }
    })
  : sst.aws.Router.get("MyRouter", "A2WQRGCYGTFB7Z");

// Frontend
const web = new sst.aws.Nextjs("MyWeb", {
  path: "packages/web",
  router: {
    instance: router
  }
});

// API
const api = new sst.aws.Function("MyApi", {
  handler: "packages/functions/api.handler",
  url: {
    router: {
      instance: router,
      path: "/api"
    }
  }
});

// Documentation
const docs = new sst.aws.Astro("MyDocs", {
  path: "packages/docs",
  router: {
    instance: router,
    domain: subdomain("docs")
  }
});
```

## Summary

This approach consolidates infrastructure management by using a single shared CloudFront distribution, significantly reducing deployment complexity and time while enabling flexible routing configurations across multiple stages and preview environments.
