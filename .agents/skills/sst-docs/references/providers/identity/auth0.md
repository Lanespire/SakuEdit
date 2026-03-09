# Auth0

> Source: https://www.pulumi.com/registry/packages/auth0
> Package: `auth0`
> SST Install: `sst add auth0`

## Overview

Auth0 provider enables interaction with the Auth0 Management API to configure Auth0 tenants. It allows deployment of clients, resource servers, connections, users, roles, and other identity management resources through Pulumi infrastructure-as-code. Version: v3.37.1.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `AUTH0_DOMAIN` | Auth0 domain name |
| `AUTH0_CLIENT_ID` | Client ID for authentication |
| `AUTH0_CLIENT_SECRET` | Client secret |
| `AUTH0_API_TOKEN` | API token (alternative to client credentials) |
| `AUTH0_CLIENT_ASSERTION_PRIVATE_KEY` | Private key for JWT signing |
| `AUTH0_CLIENT_ASSERTION_SIGNING_ALG` | JWT signing algorithm |

### Pulumi Config

```yaml
config:
  auth0:domain:
    value: <domain>
  auth0:clientId:
    value: <client-id>
  auth0:clientSecret:
    value: <client-secret>
```

Additional config keys: `auth0:apiToken`, `auth0:debug`, `auth0:customDomainHeader`, `auth0:dynamicCredentials`.

## Key Resources

- **Client** - Auth0 applications
- **Connection** - Authentication connections (social, database, enterprise)
- **User** - User account management
- **Role** / **RolePermission** - Role definitions and permissions
- **ResourceServer** - API resource definitions
- **Organization** / **OrganizationMember** - Organization management
- **Action** / **Hook** - Custom actions and extensibility hooks
- **Guardian** - Multi-factor authentication
- **AttackProtection** - Threat protection settings
- **Branding** / **BrandingTheme** - Tenant branding and theme customization
- **CustomDomain** - Custom domain setup
- **EmailProvider** / **EmailTemplate** - Email service and templates
- **LogStream** / **EventStream** - Log and event streaming
- **Prompt** - Custom authentication prompts
- **NetworkAcl** - Network access control lists

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as auth0 from "@pulumi/auth0";

// Create an Auth0 Client (Application)
const app = new auth0.Client("my-app", {
  name: "My Application",
  appType: "spa",
  callbacks: ["https://example.com/callback"],
  allowedLogoutUrls: ["https://example.com"],
  webOrigins: ["https://example.com"],
});

// Create a Database Connection
const dbConnection = new auth0.Connection("db-connection", {
  name: "my-db-connection",
  strategy: "auth0",
  enabledClients: [app.clientId],
});

// Create a Resource Server (API)
const api = new auth0.ResourceServer("my-api", {
  identifier: "https://api.example.com",
  name: "My API",
  signingAlg: "RS256",
});

// Create a Role
const adminRole = new auth0.Role("admin-role", {
  name: "admin",
  description: "Administrator role",
});
```
