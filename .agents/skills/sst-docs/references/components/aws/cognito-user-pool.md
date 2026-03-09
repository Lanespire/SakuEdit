# CognitoUserPool

> Source: https://sst.dev/docs/component/aws/cognito-user-pool/

## Overview

The `CognitoUserPool` component integrates Amazon Cognito User Pool functionality into SST applications, enabling user authentication and management capabilities.

## Constructor

```typescript
new sst.aws.CognitoUserPool(name, args?, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args?` (CognitoUserPoolArgs) - Configuration options
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### advancedSecurity?
- **Type:** `"audit"` | `"enforced"`
- **Default:** Disabled
- Enable advanced security features.

### aliases?
- **Type:** `("email" | "phone" | "preferred_username")[]`
- **Default:** Username only
- Additional sign-in methods beyond username.

### mfa?
- **Type:** `"on"` | `"optional"`
- **Default:** Disabled
- Multi-factor authentication configuration.

### sms?
- **Type:** `Object`
- SMS configuration.
- Sub-properties:
  - `externalId` (string) - External ID for SMS role
  - `snsCallerArn` (string) - SNS caller ARN
  - `snsRegion?` (string) - SNS region

### smsAuthenticationMessage?
- **Type:** `string`
- **Default:** Default template
- Message template for SMS auth with `{####}` placeholder.

### softwareToken?
- **Type:** `boolean`
- **Default:** `false`
- Enable software token MFA (TOTP).

### triggers?
- **Type:** `Object`
- Lambda function triggers for auth events.
- Sub-properties:
  - `createAuthChallenge?` (string) - Handler for new challenge creation
  - `customEmailSender?` (string) - Custom email provider
  - `customMessage?` (string) - Message customization
  - `customSmsSender?` (string) - Custom SMS provider
  - `defineAuthChallenge?` (string) - Challenge evaluation logic
  - `kmsKey?` (string) - KMS key ARN for encryption
  - `postAuthentication?` (string) - Post-authentication actions
  - `postConfirmation?` (string) - Post-confirmation actions
  - `preAuthentication?` (string) - Pre-authentication validation
  - `preSignUp?` (string) - Pre-signup customization
  - `preTokenGeneration?` (string) - Token generation customization
  - `preTokenGenerationVersion?` (`"v1"` | `"v2"`) - Token generation version
  - `userMigration?` (string) - Legacy user import handler
  - `verifyAuthChallengeResponse?` (string) - Challenge response verification

### usernames?
- **Type:** `("email" | "phone")[]`
- **Default:** Username only
- Allow email/phone as username for signup/signin.

### verify?
- **Type:** `Object`
- **Default:** Default messages
- Email/SMS verification templates.

### transform?
- **Type:** `Object`
- Resource transformation options.

## Properties

### arn
- **Type:** `Output<string>`
- The Cognito User Pool ARN.

### id
- **Type:** `Output<string>`
- The Cognito User Pool ID.

### nodes
- `userPool` (Output<UserPool>) - Underlying AWS UserPool resource

## Methods

### addClient(name, args?)

```typescript
addClient(name: string, args?: CognitoUserPoolClientArgs): CognitoUserPoolClient
```

Adds a client to the User Pool.

**CognitoUserPoolClientArgs:**
- `providers?` (string[]) - Supported identity providers (default: `["COGNITO"]`)
- `transform?` (Object) - Resource transformation options

### addIdentityProvider(name, args)

```typescript
addIdentityProvider(name: string, args: CognitoIdentityProviderArgs): CognitoIdentityProvider
```

Adds a federated identity provider.

**CognitoIdentityProviderArgs:**
- `type` (`"oidc"` | `"saml"` | `"google"` | `"facebook"` | `"apple"` | `"amazon"`) - Provider type
- `details` (Record<string, string>) - Provider configuration (scopes, URLs, credentials)
- `attributes?` (Record<string, string>) - Attribute mappings between provider and pool
- `transform?` (Object) - Resource transformation options

### static get(name, userPoolID, opts?)

```typescript
static get(name: string, userPoolID: Input<string>, opts?: ComponentResourceOptions): CognitoUserPool
```

References an existing User Pool by ID. Enables stage-based sharing without recreation.

## Links

When linked, the `CognitoUserPool` component exposes the following through the SDK `Resource` object:
- `id` (string) - The Cognito User Pool ID

## Examples

### Basic pool creation
```typescript
const userPool = new sst.aws.CognitoUserPool("MyUserPool");
```

### Email-based login
```typescript
new sst.aws.CognitoUserPool("MyUserPool", {
  usernames: ["email"]
});
```

### With authentication triggers
```typescript
new sst.aws.CognitoUserPool("MyUserPool", {
  triggers: {
    preAuthentication: "src/preAuthentication.handler",
    postAuthentication: "src/postAuthentication.handler"
  }
});
```

### Adding a client
```typescript
const userPool = new sst.aws.CognitoUserPool("MyUserPool");
userPool.addClient("Web");
```

### Google identity provider
```typescript
userPool.addIdentityProvider("Google", {
  type: "google",
  details: {
    authorize_scopes: "email profile",
    client_id: GoogleClientId.value,
    client_secret: GoogleClientSecret.value
  },
  attributes: {
    email: "email",
    name: "name",
    username: "sub"
  }
});
```

### Cross-stage pool sharing
```typescript
const userPool = $app.stage === "frank"
  ? sst.aws.CognitoUserPool.get("MyUserPool", "us-east-1_gcF5PjhQK")
  : new sst.aws.CognitoUserPool("MyUserPool");
```

### With MFA enabled
```typescript
new sst.aws.CognitoUserPool("MyUserPool", {
  mfa: "on",
  softwareToken: true
});
```

### With advanced security
```typescript
new sst.aws.CognitoUserPool("MyUserPool", {
  advancedSecurity: "enforced"
});
```
