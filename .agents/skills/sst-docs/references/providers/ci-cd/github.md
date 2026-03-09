# GitHub

> Source: https://www.pulumi.com/registry/packages/github
> Package: `github`
> SST Install: `sst add github`

## Overview

GitHub provider enables infrastructure-as-code management of GitHub resources. It allows you to manage your GitHub organization's members, teams, repositories, webhooks, and other GitHub entities programmatically through Pulumi.

## Configuration

### Authentication Methods

1. **GitHub CLI** - Leverages tokens from `gh auth login`
2. **OAuth / Personal Access Token** - Set via config or environment variable
3. **GitHub App Installation** - Configure `appAuth` block with app ID, installation ID, and PEM file

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | Personal access token or OAuth token |
| `GITHUB_OWNER` | Target GitHub organization or user account |

### Pulumi Config

```bash
pulumi config set github:token XXXXXXXXXXXXXX --secret
pulumi config set github:owner my-org
```

### Key Parameters

- `owner` - Target GitHub organization or user account
- `baseUrl` - GitHub API endpoint (required for GitHub Enterprise)
- `writeDelayMs` - Delay between write operations (default: 1000ms)
- `maxRetries` - Retry attempts after errors (default: 3)
- `readDelayMs` - Delay between read operations (default: 0ms)

## Key Resources

- `github.Repository` - Manage GitHub repositories
- `github.Membership` - Add users to organizations
- `github.Team` - Manage organization teams
- `github.TeamRepository` - Assign repositories to teams
- `github.BranchProtection` - Configure branch protection rules
- `github.ActionsSecret` - Manage GitHub Actions secrets
- `github.RepositoryWebhook` - Configure repository webhooks

## Example

```typescript
import * as github from "@pulumi/github";

// Add a user to the organization
const membership = new github.Membership("membership", {
  username: "user-x",
  role: "member",
});

// Create a repository
const repo = new github.Repository("my-repo", {
  name: "my-repo",
  description: "Managed by Pulumi",
  visibility: "private",
  hasIssues: true,
});
```
