# Nuage

> Source: https://www.pulumi.com/registry/packages/nuage
> Package: `nuage`
> SST Install: `sst add nuage`

## Overview

The Nuage provider offers pre-packaged infrastructure-as-code components for provisioning cloud resources on AWS. It provides curated, well-designed bundles of resources for common patterns like serverless functions, container registries, and serverless databases.

## Configuration

Relies on AWS credentials configuration. Refer to the installation & configuration page for specific setup details.

## Key Resources

- **ContainerFunction** - Serverless Lambda functions with Docker container support, function URLs, CloudWatch keep-warm rules, and X-Ray tracing
- **Repository** - Amazon ECR repositories with lifecycle policies
- **ServerlessDatabase** - Serverless RDS Aurora databases (MySQL/PostgreSQL) with automatic subnet groups, security configurations, and credential management

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as nuage from "@pulumi/nuage";

const repository = new nuage.aws.Repository("foo", {
  name: "repository",
  expireInDays: 30,
});

const lambdaContainer = new nuage.aws.ContainerFunction("foo", {
  name: "lambda-function",
  description: "Nuage AWS ContainerFunction resource.",
  repositoryUrl: repository.url,
  architecture: "x86_64",
  memorySize: 512,
  timeout: 30,
  environment: { bar: "baz" },
  keepWarm: true,
  url: true,
  logRetentionInDays: 90,
});
```
