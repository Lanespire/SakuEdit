# Harbor

> Source: https://www.pulumi.com/registry/packages/harbor
> Package: `@pulumiverse/harbor`
> SST Install: `sst add @pulumiverse/harbor`

## Overview

The Harbor provider enables provisioning and management of Harbor container registry resources through Pulumi. Harbor is an open-source cloud-native registry that stores, signs, and scans container images. This provider allows you to manage registries, projects, users, replication rules, and other Harbor entities as infrastructure-as-code.

## Configuration

### Pulumi Config

```bash
pulumi config set harbor:url https://harbor.example.com
pulumi config set harbor:username admin --secret
pulumi config set harbor:password XXXXXXXXXXXXXX --secret
```

### Key Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `harbor:url` | Yes | URL of the Harbor instance |
| `harbor:username` | Yes | Username for Harbor access |
| `harbor:password` | Yes | Password for Harbor access |
| `harbor:insecure` | No | Skip certificate validation |
| `harbor:apiVersion` | No | API version (`1` or `2`, default: `2`) |

## Key Resources

- `harbor.Registry` - Configure external container registries (Docker Hub, etc.)
- `harbor.Project` - Organize and manage Harbor projects
- `harbor.RobotAccount` - Create robot accounts for automation
- `harbor.Replication` - Configure replication rules
- `harbor.RetentionPolicy` - Manage image retention policies
- `harbor.Label` - Manage resource labels
- `harbor.Interrogation` - Configure vulnerability scanning

## Example

```typescript
import * as harbor from "@pulumiverse/harbor";

// Register Docker Hub as an external registry
const registry = new harbor.Registry("docker-hub", {
  providerName: "docker-hub",
  endpointUrl: "https://hub.docker.com",
  name: "pulumi-harbor",
});

// Create a project using the registry
const project = new harbor.Project("my-project", {
  name: "my-project",
  registryId: registry.registryId,
  public: true,
});

// Create a robot account for CI/CD
const robot = new harbor.RobotAccount("ci-robot", {
  name: "ci-robot",
  level: "project",
  permissions: [{
    namespace: project.name,
    kind: "project",
    access: [{
      action: "push",
      resource: "repository",
    }, {
      action: "pull",
      resource: "repository",
    }],
  }],
});
```
