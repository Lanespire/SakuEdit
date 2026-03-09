# Docker Build

> Source: https://www.pulumi.com/registry/packages/docker-build
> Package: `docker-build`
> SST Install: `sst add docker-build`

## Overview

The Docker Build provider leverages Docker's buildx and BuildKit to build modern Docker images with Pulumi. It focuses specifically on image building operations with advanced features like multi-platform builds, cache management, and registry pushing. This is distinct from the Docker provider which manages containers and networks.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DOCKER_HOST` | Custom build daemon location (e.g., `tcp://127.0.0.1:2376/`) |

### Pulumi Config

```bash
pulumi config set docker-build:host tcp://127.0.0.1:2376/
```

### Key Parameters

- `host` - Docker build daemon address

## Key Resources

- `docker-build.Image` - Build and push Docker images with BuildKit

### Image Resource Features

- Multi-platform builds (linux/amd64, linux/arm64, etc.)
- Cache management (`cacheFrom`, `cacheTo` with inline caching)
- Registry authentication and image pushing
- Image tagging
- Build context specification
- Dockerfile path configuration
- Build arguments

## Example

```typescript
import * as dockerBuild from "@pulumi/docker-build";
import * as aws from "@pulumi/aws";

// Get ECR repository
const ecrRepo = new aws.ecr.Repository("my-repo", {
  name: "my-app",
});

// Get ECR credentials
const authToken = aws.ecr.getAuthorizationTokenOutput({
  registryId: ecrRepo.registryId,
});

// Build and push a multi-platform image
const image = new dockerBuild.Image("my-image", {
  tags: [pulumi.interpolate`${ecrRepo.repositoryUrl}:latest`],
  context: {
    location: "./app",
  },
  platforms: [
    dockerBuild.Platform.Linux_amd64,
    dockerBuild.Platform.Linux_arm64,
  ],
  push: true,
  registries: [{
    address: ecrRepo.repositoryUrl,
    username: authToken.userName,
    password: authToken.password,
  }],
  cacheFrom: [{
    registry: {
      ref: pulumi.interpolate`${ecrRepo.repositoryUrl}:cache`,
    },
  }],
  cacheTo: [{
    registry: {
      ref: pulumi.interpolate`${ecrRepo.repositoryUrl}:cache`,
      imageManifest: true,
      ociMediaTypes: true,
    },
  }],
});
```
