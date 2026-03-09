# Azure DevOps

> Source: https://www.pulumi.com/registry/packages/azuredevops
> Package: `azuredevops`
> SST Install: `sst add azuredevops`

## Overview

The Azure DevOps provider enables infrastructure-as-code management of Azure DevOps projects using the Azure DevOps Service REST API. It allows you to programmatically create projects, configure repositories, manage build pipelines, and control service connections.

## Configuration

### Authentication Methods

1. **Personal Access Token** - Primary method with owner privileges
2. **Service Principal** - Using `clientId` / `clientSecret` / `tenantId`
3. **Managed Identity** - Azure managed identity authentication
4. **Client Certificates** - Certificate-based authentication
5. **OIDC Tokens** - OpenID Connect token-based authentication

### Environment Variables

| Variable | Description |
|----------|-------------|
| `AZDO_ORG_SERVICE_URL` | Azure DevOps organization URL |
| `AZDO_PERSONAL_ACCESS_TOKEN` | Personal access token |

### Pulumi Config

```bash
pulumi config set azuredevops:orgServiceUrl https://dev.azure.com/my-org
pulumi config set azuredevops:personalAccessToken XXXXXXXXXXXXXX --secret
```

### Key Parameters

- `orgServiceUrl` - Azure DevOps organization URL (required)
- `personalAccessToken` - PAT with owner privileges
- `clientId` / `clientSecret` / `tenantId` - Service principal auth

## Key Resources

- `azuredevops.Project` - Create and manage DevOps projects
- `azuredevops.GitRepository` - Manage Git repositories
- `azuredevops.BuildDefinition` - Configure build pipelines
- `azuredevops.ServiceEndpointAzureRM` - Azure service connections
- `azuredevops.VariableGroup` - Manage variable groups
- `azuredevops.BranchPolicyMinReviewers` - Branch policy configuration

## Example

```typescript
import * as azuredevops from "@pulumi/azuredevops";

// Create a project
const project = new azuredevops.Project("my-project", {
  name: "Project Name",
  description: "Managed by Pulumi",
  versionControl: "Git",
  workItemTemplate: "Agile",
});

// Create a Git repository
const repo = new azuredevops.GitRepository("my-repo", {
  projectId: project.id,
  name: "my-repo",
  initialization: {
    initType: "Clean",
  },
});
```
