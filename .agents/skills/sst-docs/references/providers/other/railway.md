# Railway

> Source: https://registry.terraform.io/providers/terraform-community-providers/railway/latest
> Package: `railway`
> SST Install: `sst add railway`

## Overview

The Railway provider enables infrastructure-as-code management of Railway.app resources. Railway is a deployment platform that makes it easy to deploy apps, databases, and other services. This is a community-maintained Terraform provider (which can be used with Pulumi via the Terraform bridge). It manages Railway projects, services, deployments, and environment variables.

## Configuration

The provider requires a Railway API token for authentication.

**Pulumi.yaml:**
```yaml
config:
  railway:token:
    value: YOUR_RAILWAY_TOKEN
```

**Environment Variable:**
```bash
export RAILWAY_TOKEN="your_railway_token"
```

Railway API tokens can be generated from the Railway dashboard under Account Settings > Tokens.

## Key Resources

- `railway.Project` - Create and manage Railway projects
- `railway.Service` - Define services within projects
- `railway.Variable` - Manage environment variables
- `railway.DeploymentTrigger` - Configure deployment triggers
- `railway.SharedVariable` - Shared environment variables across services
- `railway.TcpProxy` - TCP proxy configuration

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as railway from "@pulumi/railway";

const project = new railway.Project("my-project", {
  name: "my-app",
  description: "My Railway application",
});

const service = new railway.Service("my-service", {
  projectId: project.id,
  name: "web",
});
```
