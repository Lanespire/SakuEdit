# Artifactory

> Source: https://www.pulumi.com/registry/packages/artifactory
> Package: `artifactory`
> SST Install: `sst add artifactory`

## Overview

The Artifactory provider enables infrastructure-as-code management of JFrog Artifactory resources. It allows you to manage repositories, permissions, users, groups, and other Artifactory entities. Note: Requires licensed Pro or Enterprise editions -- APIs are unavailable in open-source versions.

## Configuration

### Authentication Methods

1. **Access Token** (primary) - via environment variable or config
2. **API Key** (deprecated) - phase-out planned through Q4 2024
3. **OIDC Provider** - OpenID Connect integration
4. **Mutual TLS** - Client certificates (file-based or inline PEM)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `JFROG_ACCESS_TOKEN` | JFrog access token (preferred) |
| `ARTIFACTORY_ACCESS_TOKEN` | Alternative access token variable |
| `ARTIFACTORY_URL` | Artifactory instance URL |

### Pulumi Config

```bash
pulumi config set artifactory:url https://artifactory.site.com/artifactory
pulumi config set artifactory:accessToken XXXXXXXXXXXXXX --secret
```

### Key Parameters

- `url` - Artifactory instance URL (required)
- `accessToken` - JFrog access token
- `apiKey` - API key (deprecated)

## Key Resources

- `artifactory.LocalPypiRepository` - Local PyPI repository
- `artifactory.LocalDockerV2Repository` - Local Docker registry
- `artifactory.LocalNpmRepository` - Local npm repository
- `artifactory.RemoteDockerRepository` - Remote Docker proxy
- `artifactory.VirtualMavenRepository` - Virtual Maven repository
- `artifactory.PermissionTarget` - Permission management
- `artifactory.User` - User management
- `artifactory.Group` - Group management

## Example

```typescript
import * as artifactory from "@pulumi/artifactory";

// Create a local PyPI repository
const pypiLibs = new artifactory.LocalPypiRepository("pypi-libs", {
  key: "pypi-libs",
  repoLayoutRef: "simple-default",
  description: "A pypi repository for python packages",
});

// Create a local Docker repository
const dockerLocal = new artifactory.LocalDockerV2Repository("docker-local", {
  key: "docker-local",
  tagRetention: 10,
  maxUniqueTags: 25,
});
```
