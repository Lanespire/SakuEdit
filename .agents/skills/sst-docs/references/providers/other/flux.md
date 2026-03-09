# Flux

> Source: https://www.pulumi.com/registry/packages/flux
> Package: `@worawat/flux`
> SST Install: `sst add @worawat/flux`

## Overview

The Flux provider enables management of Flux resources for GitOps-based continuous deployment workflows on Kubernetes. It bootstraps Flux on Kubernetes clusters using Git repositories as the source of truth.

## Configuration

Required settings:

**Kubernetes Configuration:**
- `configPath` - Path to kubeconfig file (e.g., `~/.kube/config`)

**Git Configuration:**
- `url` - SSH Git repository URL
- `branch` - Target branch name
- `ssh.username` - Git username (typically "git")
- `ssh.privateKey` - SSH private key in PEM format

## Key Resources

- **FluxBootstrapGit** - Bootstraps Flux on a Kubernetes cluster using a Git repository as the source

## Example

```typescript
import * as flux from "@worawat/flux";

const provider = new flux.Provider("flux", {
  kubernetes: { configPath: "~/.kube/config" },
  git: {
    url: `ssh://git@github.com/${githubOwner}/${repoName}.git`,
    branch: branch,
    ssh: { username: "git", privateKey: key.privateKeyPem },
  },
});

const resource = new flux.FluxBootstrapGit(
  "flux",
  { path: path },
  { provider: provider, dependsOn: deployKey }
);
```
