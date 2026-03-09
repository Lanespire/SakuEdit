# Secret Component

> Source: https://sst.dev/docs/component/secret/

## Overview

The `Secret` component enables creation of encrypted secrets within SST applications. These secrets are stored in an S3 Bucket within your AWS account and encrypted both in state files and function bundles. They decrypt synchronously when functions initialize.

## Creating Secrets

**Naming Requirements:** Secret names must start with a capital letter and contain only letters and numbers.

```typescript
const secret = new sst.Secret("MySecret");
```

## Setting Placeholder Values

You can define optional placeholder values for non-sensitive data:

```typescript
const secret = new sst.Secret("MySecret", "my-secret-placeholder-value");
```

## Managing Secret Values

### Via CLI

```bash
sst secret set MySecret my-secret-value
```

Note: Deploy required if not running `sst dev`.

### Fallback Values

```bash
sst secret set MySecret my-fallback-value --fallback
```

Useful for auto-deployed PR environments.

## Usage in App Config

```typescript
console.log(mySecret.value);
```

## Linking to Resources

```typescript
new sst.aws.Nextjs("MyWeb", { link: [secret] });
```

**In function code:**

```typescript
import { Resource } from "sst";
console.log(Resource.MySecret.value);
```

## Constructor

```typescript
new Secret(name, placeholder?)
```

**Parameters:**

- **name** (`string`) - The name of the secret
- **placeholder?** (`Input<string>`) - Optional placeholder for non-sensitive values

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `Output<string>` | The secret's name |
| `placeholder` | `undefined \| Output<string>` | Placeholder value if set |
| `value` | `Output<string>` | Secret value; `undefined` if unset and no placeholder exists |

## SDK Access

Through the `Resource` object:

- **value** (`string`) - Secret value (undefined if not set and no placeholder)

```typescript
import { Resource } from "sst";

// Access the secret value at runtime
const secretValue = Resource.MySecret.value;
```
