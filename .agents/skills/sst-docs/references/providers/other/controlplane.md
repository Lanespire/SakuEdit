# Control Plane

> Source: https://www.pulumi.com/registry/packages/cpln/
> Package: `@pulumiverse/cpln`
> SST Install: `sst add @pulumiverse/cpln`

## Overview

The Control Plane provider enables infrastructure-as-code capabilities for Control Plane resources. It allows scaffolding of any Control Plane object as code, including virtual cloud infrastructure (VPCs, subnets, databases, queues, caches) and multi-cloud/multi-region compute workload deployments.

## Configuration

Required settings:

- **org** (String) - The Control Plane organization (env: `CPLN_ORG`)
- **endpoint** (String) - API endpoint, defaults to `https://api.cpln.io` (env: `CPLN_ENDPOINT`)
- **profile** (String) - User/service account profile for authentication (env: `CPLN_PROFILE`)
- **token** (String) - Generated authentication token (env: `CPLN_TOKEN`)
- **refresh_token** (String) - Token for org creation and authConfig updates (env: `CPLN_REFRESH_TOKEN`)

Authentication methods: CLI-based (`cpln login`), token-based, or refresh token-based.

## Key Resources

- **cpln.Agent** - Control Plane agent management
- **cpln.Org** - Organization management
- Workloads, GVCs, and other Control Plane objects

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as cpln from "@pulumiverse/cpln";

// Configuration via Pulumi.yaml:
// cpln:org: "my-org"
// cpln:token: "my-token"
```
