# Keycloak

> Source: https://www.pulumi.com/registry/packages/keycloak
> Package: `keycloak`
> SST Install: `sst add keycloak`

## Overview

The Keycloak provider can be used to interact with Keycloak, the open-source identity and access management solution. It supports managing realms, clients, users, roles, groups, identity providers, and protocol mappers. Multiple authentication grant types are supported including client credentials, password grant, access token, and mTLS. Version: v6.9.0.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `KEYCLOAK_URL` | Keycloak server URL |
| `KEYCLOAK_ADMIN_URL` | Admin console URL (if different) |
| `KEYCLOAK_CLIENT_ID` | Client ID for authentication |
| `KEYCLOAK_CLIENT_SECRET` | Client secret |
| `KEYCLOAK_USER` | Admin username (password grant) |
| `KEYCLOAK_PASSWORD` | Admin password (password grant) |
| `KEYCLOAK_ACCESS_TOKEN` | Pre-obtained access token |
| `KEYCLOAK_REALM` | Realm for authentication (default: master) |
| `KEYCLOAK_CLIENT_TIMEOUT` | Request timeout |
| `KEYCLOAK_BASE_PATH` | Custom base path |

### Pulumi Config

```yaml
config:
  keycloak:clientId:
    value: pulumi
  keycloak:clientSecret:
    value: <client-secret>
  keycloak:url:
    value: http://localhost:8080
```

### Supported Authentication Grants

- Client Credentials (client secret or private key JWT)
- Password Grant (username/password)
- Provided Access Token
- mTLS Certificate

## Key Resources

- **Realm** - Core identity namespace for organizing users and clients
- **User** - Individual user accounts with credentials and profiles
- **Role** - Permission definitions for access control
- **Group** / **GroupRoles** / **GroupMemberships** - Group management
- **UserGroups** / **UserRoles** - User-to-group/role associations
- **GenericClientProtocolMapper** - Maps claims in client tokens
- **GenericProtocolMapper** - Protocol-specific claim mappings
- **GenericClientRoleMapper** - Maps roles for clients
- **Organization** - Enterprise organization structures
- **AttributeImporterIdentityProviderMapper** - Import attributes from external IdPs
- **HardcodedAttributeIdentityProviderMapper** - Static attribute assignments
- **HardcodedGroupIdentityProviderMapper** - Fixed group assignments
- **RealmLocalization** - Multi-language support
- **RealmUserProfile** - Custom user attribute schemas
- **RequiredAction** - Actions users must complete on login

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as keycloak from "@pulumi/keycloak";

// Create a Realm
const realm = new keycloak.Realm("my-realm", {
  realm: "my-app",
  enabled: true,
  displayName: "My Application",
  loginTheme: "keycloak",
});

// Create a Client
const client = new keycloak.openid.Client("my-client", {
  realmId: realm.id,
  clientId: "my-web-app",
  accessType: "CONFIDENTIAL",
  validRedirectUris: ["https://example.com/callback"],
});

// Create a User
const user = new keycloak.User("example-user", {
  realmId: realm.id,
  username: "johndoe",
  email: "john@example.com",
  firstName: "John",
  lastName: "Doe",
  enabled: true,
});

// Create a Role
const role = new keycloak.Role("admin-role", {
  realmId: realm.id,
  name: "admin",
  description: "Administrator role",
});
```
