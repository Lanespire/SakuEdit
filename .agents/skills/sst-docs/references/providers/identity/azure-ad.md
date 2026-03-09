# Azure Active Directory (Azure AD)

> Source: https://www.pulumi.com/registry/packages/azuread
> Package: `azuread`
> SST Install: `sst add azuread`

## Overview

The AzureAD provider for Pulumi enables provisioning of any of the Azure Active Directory resources available in Azure. It provides infrastructure-as-code management for Azure AD including applications, users, groups, service principals, conditional access policies, and entitlement management. Version: v6.8.0.

## Configuration

The AzureAD provider must be configured with credentials to deploy and update resources in Azure. It supports Azure CLI, Managed Identity, Service Principal (client secret or certificate), and OIDC authentication methods.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ARM_CLIENT_ID` | Service principal client ID |
| `ARM_CLIENT_SECRET` | Service principal client secret |
| `ARM_TENANT_ID` | Azure AD tenant ID |
| `ARM_ENVIRONMENT` | Azure environment (public, usgovernment, china) |
| `ARM_CLIENT_CERTIFICATE_PATH` | Path to client certificate |
| `ARM_CLIENT_CERTIFICATE_PASSWORD` | Client certificate password |

### Pulumi Config

```yaml
config:
  azuread:tenantId:
    value: <tenant-id>
  azuread:clientId:
    value: <client-id>
  azuread:clientSecret:
    value: <client-secret>
```

## Key Resources

- **Application** / **ApplicationPassword** / **ApplicationCertificate** - App registration and credentials
- **ApplicationRedirectUris** - OAuth redirect URIs
- **ServicePrincipal** - Service principal management
- **User** - User account management
- **Group** - Security and Microsoft 365 group management
- **DirectoryRole** - Directory role assignments
- **AppRoleAssignment** - App role grants to principals
- **ConditionalAccessPolicy** - Conditional access policies
- **AuthenticationStrengthPolicy** - Authentication requirements
- **AccessPackage** - Entitlement management
- **AdministrativeUnit** - Directory object organization
- **CustomDirectoryRole** - Custom directory role definitions
- **SynchronizationJob** - Identity synchronization
- **PrivilegedAccessGroupAssignmentSchedule** - Time-bound group access (PIM)

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as azuread from "@pulumi/azuread";

// Create an Azure AD Group
const group = new azuread.Group("my-group", {
  displayName: "Engineering Team",
  securityEnabled: true,
});

// Register an Application
const app = new azuread.Application("my-app", {
  displayName: "My Web Application",
  signInAudience: "AzureADMyOrg",
  web: {
    redirectUris: ["https://example.com/callback"],
    implicitGrant: {
      accessTokenIssuanceEnabled: true,
    },
  },
});

// Create a Service Principal for the Application
const sp = new azuread.ServicePrincipal("my-sp", {
  clientId: app.clientId,
});

// Create a User
const user = new azuread.User("example-user", {
  userPrincipalName: "john.doe@example.onmicrosoft.com",
  displayName: "John Doe",
  password: "SecurePassword123!",
});
```
