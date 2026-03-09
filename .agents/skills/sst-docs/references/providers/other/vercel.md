# Vercel

> Source: https://www.pulumi.com/registry/packages/vercel
> Package: `@pulumiverse/vercel`
> SST Install: `sst add @pulumiverse/vercel`

## Overview

The Vercel provider enables interaction with resources supported by Vercel. It allows infrastructure-as-code management of Vercel projects, deployments, domains, environment variables, and team configurations through Pulumi.

## Configuration

**Pulumi.yaml:**
```yaml
config:
  vercel:apiToken:
    value: YOUR_API_TOKEN
  vercel:team:
    value: your_team_slug_or_id
```

**Environment Variables:**
```bash
export VERCEL_API_TOKEN="your_api_token"
```

**Configuration Variables:**
- `apiToken` (String, Sensitive, required) - Vercel API Token from account settings
- `team` (String, optional) - Default Vercel Team (slug or ID) for resources

## Key Resources

- `vercel.Project` - Vercel project management
- `vercel.Deployment` - Deployment configuration
- `vercel.DnsRecord` - DNS record management
- `vercel.ProjectEnvironmentVariable` - Environment variable management
- `vercel.ProjectDomain` - Custom domain assignment

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as vercel from "@pulumiverse/vercel";

const myProject = new vercel.Project("my-project", {
  name: "my-project",
  framework: "nextjs",
});
```
