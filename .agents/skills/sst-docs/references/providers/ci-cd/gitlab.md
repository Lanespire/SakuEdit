# GitLab

> Source: https://www.pulumi.com/registry/packages/gitlab
> Package: `gitlab`
> SST Install: `sst add gitlab`

## Overview

The GitLab provider enables infrastructure-as-code management of GitLab resources. It leverages the `client-go` library to interact with the GitLab REST API, allowing you to programmatically manage projects, groups, users, webhooks, variables, deploy keys, and other GitLab entities.

## Configuration

### Authentication

Requires a GitLab token (Personal Access Token, OAuth2, or CI Job Token).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GITLAB_TOKEN` | GitLab personal access token |
| `GITLAB_BASE_URL` | Self-hosted GitLab API URL (e.g., `https://my.gitlab.server/api/v4/`) |

### Pulumi Config

```bash
pulumi config set gitlab:token XXXXXXXXXXXXXX --secret
pulumi config set gitlab:baseUrl https://my.gitlab.server/api/v4/
```

### Key Parameters

- `token` - GitLab authentication token (required)
- `baseUrl` - API endpoint for self-hosted GitLab
- `cacertFile` - CA certificate for TLS verification
- `insecure` - Allow insecure connections
- Retry configuration for rate limiting

## Key Resources

- `gitlab.Project` - Create and manage repositories
- `gitlab.Group` - Organize projects hierarchically
- `gitlab.ProjectHook` - Configure webhooks
- `gitlab.ProjectVariable` - Define CI/CD variables
- `gitlab.DeployKey` - Add SSH keys for deployment
- `gitlab.Branch` - Manage branches
- `gitlab.PipelineSchedule` - Schedule CI pipelines

## Example

```typescript
import * as gitlab from "@pulumi/gitlab";

// Create a project
const project = new gitlab.Project("my-project", {
  name: "example",
  description: "Managed by Pulumi",
  visibilityLevel: "private",
});

// Add a webhook
const hook = new gitlab.ProjectHook("webhook", {
  project: project.id,
  url: "https://example.com/project_hook",
  pushEvents: true,
});

// Create a group
const group = new gitlab.Group("my-group", {
  name: "example",
  path: "example",
  description: "Managed by Pulumi",
});
```
