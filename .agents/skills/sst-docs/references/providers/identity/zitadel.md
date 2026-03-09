# Zitadel

> Source: https://www.pulumi.com/registry/packages/zitadel
> Package: `@pulumiverse/zitadel`
> SST Install: `sst add @pulumiverse/zitadel`

## Overview

The Zitadel provider for Pulumi can be used to provision any of the cloud resources available in Zitadel. Zitadel is an open-source identity management platform that provides authentication, authorization, and user management. The provider is maintained by the Pulumiverse community. Version: v0.2.0.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ZITADEL_DOMAIN` | Zitadel instance domain |
| `ZITADEL_TOKEN` | Access token or service account key |
| `ZITADEL_PORT` | API port (default: 443) |
| `ZITADEL_INSECURE` | Disable TLS (development only) |

### Pulumi Config

```yaml
config:
  zitadel:domain:
    value: my-instance.zitadel.cloud
  zitadel:token:
    value: <service-account-token>
```

## Key Resources

- **Org** - Organization management
- **Project** - Project definitions within organizations
- **Application** (OIDC, API, SAML) - Application registration
- **User** (Human, Machine) - User account management
- **Action** - Custom action scripts
- **Domain** - Custom domain configuration
- **IdpGithub** / **IdpGoogle** / **IdpAzureAd** / etc. - Identity provider integrations
- **OrgMember** / **ProjectMember** - Member role assignments
- **PersonalAccessToken** - PAT management
- **DefaultLoginPolicy** / **DefaultPasswordComplexityPolicy** - Security policies

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as zitadel from "@pulumiverse/zitadel";

// Create an Organization
const org = new zitadel.Org("my-org", {
  name: "My Organization",
});

// Create a Project
const project = new zitadel.Project("my-project", {
  name: "My Application",
  orgId: org.id,
});

// Create an OIDC Application
const app = new zitadel.ApplicationOidc("my-app", {
  projectId: project.id,
  orgId: org.id,
  name: "Web App",
  redirectUris: ["https://example.com/callback"],
  responseTypes: ["OIDC_RESPONSE_TYPE_CODE"],
  grantTypes: ["OIDC_GRANT_TYPE_AUTHORIZATION_CODE"],
  appType: "OIDC_APP_TYPE_WEB",
  authMethodType: "OIDC_AUTH_METHOD_TYPE_BASIC",
});
```
