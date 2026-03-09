# FusionAuth

> Source: https://www.pulumi.com/registry/packages/fusionauth
> Package: `pulumi-fusionauth`
> SST Install: `sst add pulumi-fusionauth`

## Overview

FusionAuth for Pulumi can be used to configure FusionAuth instances. This provider is bridged through the Terraform FusionAuth package, allowing developers to manage FusionAuth identity platform infrastructure programmatically. FusionAuth is a developer-focused identity and access management platform. Version: v6.0.2.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `FUSION_AUTH_HOST_URL` | The FusionAuth instance host URL |
| `FUSION_AUTH_API_KEY` | API key for authentication |

### Provider Instantiation

```typescript
import { Provider } from "pulumi-fusionauth";

const fusionAuthProvider = new Provider("fusion-auth", {
  host: process.env.FUSION_AUTH_HOST_URL,
  apiKey: process.env.FUSION_AUTH_API_KEY,
});
```

## Key Resources

- **FusionAuthTenant** - Tenant configuration
- **FusionAuthApplication** - Application registration
- **FusionAuthKey** - Cryptographic signing keys (RSA, EC, HMAC)
- **FusionAuthUser** - User management
- **FusionAuthGroup** - Group management
- **FusionAuthTheme** - UI theme customization
- **FusionAuthIdpGoogle** / **FusionAuthIdpApple** / etc. - Identity provider integrations
- **FusionAuthLambda** - Serverless function hooks
- **FusionAuthWebhook** - Webhook configuration
- **FusionAuthEmail** - Email template management

Note: Refer to the [Terraform FusionAuth docs](https://registry.terraform.io/providers/FusionAuth/fusionauth/latest/docs) for a comprehensive resource list.

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import { Provider, FusionAuthKey, FusionAuthApplication } from "pulumi-fusionauth";

const fusionAuthProvider = new Provider("fusion-auth", {
  host: process.env.FUSION_AUTH_HOST_URL,
  apiKey: process.env.FUSION_AUTH_API_KEY,
});

// Create a JWT signing key
const jwtKey = new FusionAuthKey(
  "jwt-signing-key",
  {
    algorithm: "RS256",
    name: "JWT Signing Key",
    length: 2048,
  },
  { provider: fusionAuthProvider }
);

export const jwtKeyId = jwtKey.id;
```
