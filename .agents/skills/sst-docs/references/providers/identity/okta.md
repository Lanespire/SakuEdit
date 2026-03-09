# Okta

> Source: https://www.pulumi.com/registry/packages/okta
> Package: `okta`
> SST Install: `sst add okta`

## Overview

The Okta provider is used to interact with the resources supported by Okta. It enables infrastructure-as-code management of Okta identity and access management resources including users, groups, applications, policies, and authentication servers. Version: v6.2.3.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `OKTA_ORG_NAME` | Organization identifier (e.g., dev-123456) |
| `OKTA_BASE_URL` | Domain (okta.com or oktapreview.com) |
| `OKTA_API_TOKEN` | Legacy API token (SSWS scheme) |
| `OKTA_ACCESS_TOKEN` | OAuth 2.0 access token |
| `OKTA_API_CLIENT_ID` | OAuth 2.0 client ID |
| `OKTA_API_PRIVATE_KEY_ID` | Private key ID (KID) |
| `OKTA_API_PRIVATE_KEY` | Private key for OAuth authentication |
| `OKTA_API_SCOPES` | Comma-separated scope values |

### Pulumi Config

```yaml
config:
  okta:orgName:
    value: dev-123456
  okta:baseUrl:
    value: okta.com
  okta:apiToken:
    value: <api-token>
```

Additional config keys: `accessToken`, `clientId`, `privateKey`, `privateKeyId`, `scopes`, `backoff`, `minWaitSeconds`, `maxWaitSeconds`, `maxRetries`, `requestTimeout`, `maxApiCapacity`.

## Key Resources

- **User** / **UserAdminRoles** / **UserGroupMemberships** / **UserSchemaProperty** - User management
- **Group** / **GroupMemberships** / **GroupSchemaProperty** - Group management
- **AppSignonPolicy** / **AppSignonPolicyRule** - Application sign-on policies
- **Authenticator** - Authentication method configuration
- **AuthServer** - Authorization server configuration
- **Domain** / **DomainCertificate** - Custom domain management
- **EmailCustomization** / **EmailDomain** / **EmailSender** - Email configuration
- **OrgConfiguration** / **Brand** / **Theme** - Organization and branding
- **ThreatInsightSettings** / **SecurityNotificationEmails** - Security settings
- **EventHook** / **LogStream** - Event and log integrations
- **Policy** (MFA, Password, Profile Enrollment) - Policy management
- **CustomizedSigninPage** - Custom sign-in page
- **ApiToken** - API token management

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as okta from "@pulumi/okta";

// Create an Okta User
const user = new okta.user.User("example-user", {
  firstName: "John",
  lastName: "Doe",
  login: "john.doe@example.com",
  email: "john.doe@example.com",
});

// Create an Okta Group
const group = new okta.group.Group("example-group", {
  name: "Engineering",
  description: "Engineering team",
});

// Create an OAuth App
const app = new okta.app.OAuth("my-app", {
  label: "My Application",
  type: "web",
  grantTypes: ["authorization_code"],
  redirectUris: ["https://example.com/callback"],
  responseTypes: ["code"],
});
```
