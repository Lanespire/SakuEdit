# CognitoIdentityPool

> Source: https://sst.dev/docs/component/aws/cognito-identity-pool/

## Overview

The `CognitoIdentityPool` component integrates Amazon Cognito identity pools into SST applications, enabling authentication and authorization for AWS resources.

## Constructor

```typescript
new sst.aws.CognitoIdentityPool(name, args?, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args?` (CognitoIdentityPoolArgs) - Configuration options
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### userPools?
- **Type:** `Input<Input<Object>[]>`
- Configures Cognito User Pools as identity providers.
- Each entry requires:
  - `userPool` (Input<string>) - The user pool ID
  - `client` (Input<string>) - The user pool client ID

### permissions?
- **Type:** `Input<Object>`
- Defines IAM permissions for authenticated and unauthenticated users.
- Sub-properties:
  - `authenticated?` (Input<Object[]>) - Permissions for authenticated users:
    - `actions` (string[]) - IAM actions allowed
    - `effect?` (`"allow"` | `"deny"`) - Default is `"allow"`
    - `resources` (Input<Input<string>[]>) - ARN format resources
  - `unauthenticated?` (Input<Object[]>) - Permissions for unauthenticated users (same structure as authenticated)

### transform?
- **Type:** `Object`
- Customizes underlying resource creation.
- Sub-properties:
  - `identityPool?` - Transform the Cognito identity pool resource
  - `authenticatedRole?` - Transform the authenticated IAM role
  - `unauthenticatedRole?` - Transform the unauthenticated IAM role

## Properties

### id
- **Type:** `Output<string>`
- The Cognito identity pool ID.

### nodes
Underlying resources:
- `identityPool` (IdentityPool) - The Amazon Cognito identity pool
- `authenticatedRole` (Role) - The authenticated IAM role
- `unauthenticatedRole` (Role) - The unauthenticated IAM role

## Methods

### static get(name, identityPoolID, opts?)

```typescript
static get(name: string, identityPoolID: Input<string>, opts?: ComponentResourceOptions): CognitoIdentityPool
```

References an existing identity pool by ID. Useful for sharing pools across deployment stages without recreation.

## Links

When linked, the `CognitoIdentityPool` component exposes the following through the SDK `Resource` object:
- `id` (string) - The identity pool ID

## Examples

### Basic creation with user pool
```typescript
new sst.aws.CognitoIdentityPool("MyIdentityPool", {
  userPools: [{
    userPool: "us-east-1_QY6Ly46JH",
    client: "6va5jg3cgtrd170sgokikjm5m6"
  }]
});
```

### With authenticated permissions
```typescript
new sst.aws.CognitoIdentityPool("MyIdentityPool", {
  userPools: [{
    userPool: "us-east-1_QY6Ly46JH",
    client: "6va5jg3cgtrd170sgokikjm5m6"
  }],
  permissions: {
    authenticated: [{
      actions: ["s3:GetObject", "s3:PutObject"],
      resources: ["arn:aws:s3:::my-bucket/*"]
    }]
  }
});
```

### With unauthenticated permissions
```typescript
new sst.aws.CognitoIdentityPool("MyIdentityPool", {
  permissions: {
    unauthenticated: [{
      actions: ["s3:GetObject"],
      resources: ["arn:aws:s3:::public-bucket/*"]
    }]
  }
});
```

### Cross-stage sharing
```typescript
const identityPool = $app.stage === "frank"
  ? sst.aws.CognitoIdentityPool.get(
      "MyIdentityPool",
      "us-east-1:02facf30-e2f3-49ec-9e79-c55187415cf8"
    )
  : new sst.aws.CognitoIdentityPool("MyIdentityPool");
```
