# GCP Global Cloud Run

> Source: https://www.pulumi.com/registry/packages/gcp-global-cloudrun
> Package: `gcp-global-cloudrun`
> SST Install: `sst add gcp-global-cloudrun`

## Overview

The GCP Global CloudRun package is a Pulumi component that enables easy deployment of globally load-balanced Google Cloud Run applications. It abstracts away infrastructure complexity, allowing developers to focus on application deployment across all Pulumi supported languages.

- **Current Version:** v0.0.3
- **Publisher:** Paul Stack / Pulumi
- **Repository:** [pulumi/pulumi-gcp-global-cloudrun](https://github.com/pulumi/pulumi-gcp-global-cloudrun)
- **Languages:** TypeScript/JavaScript, Python, Go

## Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | Yes | GCP project identifier |
| `imageName` | string | Yes | Container image URL (e.g., GCR image) |
| `serviceName` | string | Yes | Name for Cloud Run service |

## Key Resources

### Deployment

The primary component that creates:

- Cloud Run service with the specified container image
- Global HTTP(S) load balancer
- Network endpoint groups (NEGs) for Cloud Run backends
- URL map and forwarding rules

### Outputs

- `ipAddress` - The global load balancer IP address

## Example

```typescript
import * as cloudrun from "@pulumi/gcp-global-cloudrun";

const deployment = new cloudrun.Deployment("my-service", {
  projectId: "my-gcp-project",
  imageName: "gcr.io/my-gcp-project/my-app:latest",
  serviceName: "my-service",
});

export const ipAddress = deployment.ipAddress;
```

```python
import pulumi
import pulumi_gcp_global_cloudrun as cloudrun

deployment = cloudrun.Deployment("my-service",
    project_id="my-gcp-project",
    image_name="gcr.io/my-gcp-project/my-app:latest",
    service_name="my-service",
)

pulumi.export("ipAddress", deployment.ip_address)
```
