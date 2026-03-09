# Aquasec

> Source: https://www.pulumi.com/registry/packages/aquasec
> Package: `@pulumiverse/aquasec`
> SST Install: `sst add @pulumiverse/aquasec`

## Overview

The Aquasec provider enables provisioning of cloud resources available through Aquasec's cloud-native security platform. It integrates with Pulumi to manage Aquasec security resources programmatically, including container image scanning and vulnerability assessment.

## Configuration

The provider requires credentials and a URL to connect to your Aquasec instance. Refer to the installation & configuration page for specific setup details.

## Key Resources

- **Image** - Query container images from registries (e.g., Docker Hub), retrieve vulnerability data and architecture information

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aquasec from "@pulumiverse/aquasec";

const golangImage = new aquasec.Image("image", {
  registry: "Docker Hub",
  repository: "golang",
  tag: "1.19",
});

export const architecture = golangImage.architecture;
export const criticalVulnerabilities = golangImage.criticalVulnerabilities;
```
