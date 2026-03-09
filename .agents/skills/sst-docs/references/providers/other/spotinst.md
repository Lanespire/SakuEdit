# Spotinst

> Source: https://www.pulumi.com/registry/packages/spotinst
> Package: `spotinst`
> SST Install: `sst add spotinst`

## Overview

The Spotinst provider is used to interact with the resources supported by Spotinst (now Spot by NetApp). It enables infrastructure-as-code management of cloud compute optimization, particularly Elastigroups for intelligent instance management and cost optimization across AWS, Azure, and GCP.

## Configuration

**Pulumi.yaml:**
```yaml
config:
  spotinst:token:
    value: YOUR_SPOTINST_TOKEN
  spotinst:account:
    value: YOUR_ACCOUNT_ID
```

**Environment Variables:**
```bash
export SPOTINST_TOKEN="your_token"
export SPOTINST_ACCOUNT="your_account_id"
```

**Configuration Variables:**
- `token` (String, required) - Personal API Access Token (env: `SPOTINST_TOKEN`)
- `account` (String, required) - Spotinst account ID (env: `SPOTINST_ACCOUNT`)
- `enabled` (Boolean, optional) - Activate/deactivate provider (default: `true`)
- `featureFlags` (String, optional) - SDK feature flags (env: `SPOTINST_FEATURE_FLAGS`)

**Credential Priority Order:**
1. Provider configuration in template
2. Environment variables
3. `~/.spotinst/credentials` file

## Key Resources

- `spotinst.aws.Elastigroup` - AWS Elastigroup for intelligent instance management
- `spotinst.aws.Ocean` - Container-driven infrastructure for Kubernetes
- `spotinst.gke.OceanImport` - GKE Ocean cluster import
- `spotinst.azure.Elastigroup` - Azure Elastigroup management

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as spotinst from "@pulumi/spotinst";

const foo = new spotinst.aws.Elastigroup("foo", {
  name: "my-elastigroup",
  product: "Linux/UNIX",
  maxSize: 5,
  minSize: 1,
  desiredCapacity: 2,
});
```
