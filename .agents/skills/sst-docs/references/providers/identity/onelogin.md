# OneLogin

> Source: https://www.pulumi.com/registry/packages/onelogin
> Package: `onelogin`
> SST Install: `sst add onelogin`

## Overview

The OneLogin provider facilitates interaction with OneLogin resources, enabling management of an organization's OneLogin assets. It allows you to manage your OneLogin organization's resources easily through infrastructure-as-code. Based on the Terraform OneLogin provider. Version: v0.11.2.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ONELOGIN_CLIENT_ID` | Client ID for API authentication |
| `ONELOGIN_CLIENT_SECRET` | Client secret for API authentication |
| `ONELOGIN_API_URL` | Complete API URL (e.g., https://company.onelogin.com) |
| `ONELOGIN_SUBDOMAIN` | (Deprecated) OneLogin subdomain |

The provider requires no explicit configuration block in the Pulumi file; credentials are read directly from environment variables.

## Key Resources

- **SamlApp** - SAML application management
- **User** - User account management
- **Role** - Role definitions
- **App** - General application management

Note: The full resource list is available at the [API Docs](https://www.pulumi.com/registry/packages/onelogin/api-docs/).

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as onelogin from "@pulumi/onelogin";

// Add a SAML App to your account
const mySamlApp = new onelogin.index.SamlApp("my_saml_app", {
  name: "My SAML Application",
});
```
