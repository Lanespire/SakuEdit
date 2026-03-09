# Docker

> Source: https://www.pulumi.com/registry/packages/docker
> Package: `docker`
> SST Install: `sst add docker`

## Overview

The Docker provider enables interaction with Docker containers and images through Pulumi. It uses the Docker API to manage the lifecycle of Docker containers, including pulling images, creating containers, and managing networks and volumes. Works with single-server Docker, Docker Swarm, and Docker-compatible API hosts.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DOCKER_HOST` | Docker daemon address (e.g., `unix:///var/run/docker.sock`) |
| `DOCKER_CERT_PATH` | Path to TLS certificates |

### Pulumi Config

```bash
pulumi config set docker:host unix:///var/run/docker.sock
```

### Key Parameters

- `host` - Docker daemon address (e.g., `unix:///var/run/docker.sock`, `tcp://host:2376`)
- `certPath` - Path to directory with TLS certificates
- `certMaterial` - PEM-encoded certificate content
- `keyMaterial` - PEM-encoded private key content
- `caMaterial` - PEM-encoded CA certificate content
- `registryAuth` - Authentication credentials for private registries
- `context` - Docker context name
- `disableDockerDaemonCheck` - Skip daemon verification for registry-only operations

Remote connections use SSH protocol: `ssh://user@remote-host:22`

## Key Resources

- `docker.RemoteImage` - Pull Docker images from registries
- `docker.Container` - Create and manage Docker containers
- `docker.RegistryImage` - Work with registry images without requiring daemon
- `docker.Network` - Manage Docker networks
- `docker.Volume` - Manage Docker volumes
- `docker.Secret` - Manage Docker Swarm secrets
- `docker.Service` - Manage Docker Swarm services

## Example

```typescript
import * as docker from "@pulumi/docker";

// Pull an image
const ubuntu = new docker.RemoteImage("ubuntu", {
  name: "ubuntu:latest",
});

// Create a container
const container = new docker.Container("app", {
  image: ubuntu.imageId,
  name: "my-app",
  ports: [{
    internal: 80,
    external: 8080,
  }],
  envs: [
    "NODE_ENV=production",
  ],
});
```
