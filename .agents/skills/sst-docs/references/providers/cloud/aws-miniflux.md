# AWS Miniflux

> Source: https://www.pulumi.com/registry/packages/aws-miniflux/
> Package: `aws-miniflux`
> SST Install: `sst add aws-miniflux`

## Overview

This package provides infrastructure-as-code tooling to deploy Miniflux, an open-source RSS server, on AWS with Pulumi. It creates a fully managed Miniflux installation on AWS infrastructure.

- **Current Version:** v0.1.0
- **Publisher:** Christian Nunciato / Pulumi
- **Repository:** [pulumi/pulumi-aws-miniflux](https://github.com/pulumi/pulumi-aws-miniflux)
- **Languages:** TypeScript/JavaScript, Python, Go, C#

## Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `adminPassword` | secret | Yes | Administrative access credentials |
| `dbPassword` | secret | Yes | Database authentication credentials |

Both parameters must be provided as Pulumi secrets for security.

## Key Resources

### MinifluxService

The primary component that creates a managed Miniflux installation including:

- ECS Fargate service (or EC2-backed)
- RDS PostgreSQL database
- Networking configuration (VPC, subnets, security groups)
- Load balancer for web access

### Outputs

- `url` - The service endpoint URL for accessing Miniflux

## Example

```typescript
import * as miniflux from "@pulumi/aws-miniflux";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

const service = new miniflux.MinifluxService("miniflux", {
  adminPassword: config.requireSecret("adminPassword"),
  dbPassword: config.requireSecret("dbPassword"),
});

export const url = service.url;
```

```python
import pulumi
import pulumi_aws_miniflux as miniflux

config = pulumi.Config()

service = miniflux.MinifluxService("miniflux",
    admin_password=config.require_secret("adminPassword"),
    db_password=config.require_secret("dbPassword"),
)

pulumi.export("url", service.url)
```
