# Function

> Source: https://sst.dev/docs/component/aws/function/

## Overview

The `Function` component adds serverless functions to your app using AWS Lambda. It supports Node.js and Golang officially, with community support for Python and Rust.

## Constructor

```typescript
new sst.aws.Function(name, args, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args` (FunctionArgs) - Configuration object
- `opts?` (ComponentResourceOptions) - Pulumi options

## Props

### Required

#### handler
- **Type:** `Input<string>`
- **Description:** Path to handler function. Format varies by runtime:
  - Node.js: `{path}/{file}.{method}` (e.g., `src/lambda.handler`)
  - Python: `{path}/{file}.{method}` requiring uv workspace
  - Go: `{path}` to Go module directory
  - Rust: `{path}` to Cargo.toml directory

### Optional

#### runtime
- **Type:** `Input<string>`
- **Default:** `"nodejs20.x"`
- **Options:** `nodejs18.x`, `nodejs20.x`, `nodejs22.x`, `go`, `rust`, `python3.9`-`python3.12`, `provided.al2023`

#### memory
- **Type:** `Input<string>`
- **Default:** `"1024 MB"`
- **Range:** 128 MB to 10,240 MB in 1 MB increments

#### timeout
- **Type:** `Input<string>`
- **Default:** `"20 seconds"`
- **Range:** 1 second to 900 seconds (15 minutes)

#### architecture
- **Type:** `Input<string>`
- **Default:** `"x86_64"`
- **Options:** `x86_64`, `arm64`

#### environment
- **Type:** `Input<Record<string, Input<string>>>`
- **Description:** Key-value pairs as Lambda environment variables. Maximum total size: 4 KB.

#### url
- **Type:** `Input<boolean | Object>`
- **Description:** Enables Lambda function URLs with optional authorization and CORS configuration.
- **url.authorization** - `Input<string>` - Default: `"none"`. Options: `none`, `iam`
- **url.cors** - `Input<boolean | Object>` - Default: `true`. Customize: `allowOrigins`, `allowMethods`, `allowHeaders`, `allowCredentials`, `exposeHeaders`, `maxAge`

#### vpc
- **Type:** `Vpc | Input<Object>`
- **Description:** Connect function to VPC private subnets and security groups for accessing private resources.

#### link
- **Type:** `Input<any[]>`
- **Description:** Link resources to grant permissions and SDK access within handlers.

#### permissions
- **Type:** `Input<Object[]>`
- **Description:** Define IAM actions and resources.
  ```typescript
  { actions: ["s3:GetObject"], resources: ["arn:aws:s3:::bucket/*"] }
  ```

#### policies
- **Type:** `Input<string[]>`
- **Description:** Attach predefined IAM policies by ARN.

#### layers
- **Type:** `Input<Input<string>[]>`
- **Description:** Add Lambda layer ARNs (deployment only, not in `sst dev`).

#### logging
- **Type:** `Input<false | Object>`
- **Default:** `{retention: "1 month", format: "text"}`
- **Description:** Configure logging. Options: `json` or `text` format, custom log group, retention periods from 1 day to 10 years.

#### storage
- **Type:** `Input<string>`
- **Default:** `"512 MB"`
- **Range:** 512 MB to 10,240 MB ephemeral storage

#### concurrency
- **Type:** `Input<Object>`
- **Description:** Configure concurrency.
  - `provisioned`: Number of reserved instances (requires versioning enabled)
  - `reserved`: Maximum concurrent executions

#### versioning
- **Type:** `Input<boolean>`
- **Default:** `false`
- **Description:** Enables function versioning (required for provisioned concurrency).

#### streaming
- **Type:** `Input<boolean>`
- **Default:** `false`
- **Description:** Enable response streaming (requires function URL, unsupported in `sst dev`).

#### description
- **Type:** `Input<string>`
- **Description:** Displayed in AWS Console.

#### name
- **Type:** `Input<string>`
- **Description:** Custom function name (must include app/stage to avoid thrashing).

#### role
- **Type:** `Input<string>`
- **Description:** Assign existing IAM role ARN (prevents auto-updates when adding permissions).

#### retries
- **Type:** `Input<number>`
- **Default:** `2`
- **Range:** 0-2 for asynchronous invocations

#### dev
- **Type:** `Input<false>`
- **Default:** `true`
- **Description:** Set to `false` to disable Live execution in `sst dev`.

#### bundle
- **Type:** `Input<string>`
- **Description:** Skip esbuild bundling by specifying source directory path.

#### copyFiles
- **Type:** `Input<Object[]>`
- **Description:** Add additional files to package.
  ```typescript
  { from: "src/file.js", to?: "dest/file.js" }
  ```

#### nodejs
- **Type:** `Input<Object>`
- **Description:** Customize esbuild bundling:
  - `banner`: Insert string at JS file start
  - `esbuild`: Custom BuildOptions
  - `format`: `"cjs"` or `"esm"` (default: `esm`)
  - `install`: Dependencies to exclude from bundle
  - `loader`: Custom loaders for file types
  - `minify`: Boolean (default: `true`)
  - `sourcemap`: Boolean (default: `false`)
  - `splitting`: Boolean for dynamic imports (default: `false`)

#### python
- **Type:** `Input<Object>`
- **Description:** Python-specific configuration.
  - `container`: Deploy as container image (default: `false`)

#### hook
- **Type:** `Object`
- **Description:** Build hooks.
  - `postbuild(dir)`: Callback after Lambda build (not called in `sst dev`)

#### tags
- **Type:** `Input<Record<string, Input<string>>>`
- **Description:** Key-value tags for the function.

#### volume
- **Type:** `Input<Object>`
- **Description:** Mount EFS file system.
  ```typescript
  { efs: fileSystemOrArn, path?: "/mnt/efs" }
  ```

#### transform
- **Type:** `Object`
- **Description:** Transform underlying resources: `function`, `role`, `logGroup`, `eventInvokeConfig`

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `arn` | `Output<string>` | Lambda function ARN |
| `name` | `Output<string>` | Lambda function name |
| `url` | `Output<string>` | Function URL endpoint (if enabled) |
| `nodes.function` | AWS Lambda Function | Underlying Lambda Function resource |
| `nodes.role` | IAM Role | Underlying IAM Role resource |
| `nodes.logGroup` | CloudWatch Log Group | Underlying Log Group resource (optional) |
| `nodes.eventInvokeConfig` | Function Event Invoke Config | Event invoke config (if retries configured) |

## Methods

### addEnvironment(environment)

Add environment variables after function creation.

- **Parameter:** `environment` - `Input<Record<string, Input<string>>>`
- **Returns:** `FunctionEnvironmentUpdate`

```typescript
const fn = new sst.aws.Function("MyFunction", {
  handler: "src/handler.handler",
  url: true,
});
fn.addEnvironment({ URL: fn.url });
```

## Links

When linked to other resources, the Function exposes:
- `name` (string) - Function name
- `url` (string) - Function URL (if enabled)

Access via the SST SDK:
```typescript
import { Resource } from "sst";
console.log(Resource.MyFunction.name);
console.log(Resource.MyFunction.url);
```

## Examples

### Node.js minimal
```typescript
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler"
});
```

### With configuration
```typescript
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  timeout: "3 minutes",
  memory: "1024 MB"
});
```

### With resource linking
```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  link: [bucket]
});
```

### With function URL
```typescript
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  url: true
});
```

### Python example
```typescript
new sst.aws.Function("MyFunction", {
  runtime: "python3.11",
  handler: "functions/src/functions/api.handler"
});
```

### Go example
```typescript
new sst.aws.Function("MyFunction", {
  runtime: "go",
  handler: "./src"
});
```

### With environment variables
```typescript
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  environment: {
    TABLE_NAME: "my-table"
  }
});
```

### With VPC
```typescript
const vpc = new sst.aws.Vpc("MyVpc");
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  vpc
});
```

### With permissions
```typescript
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  permissions: [
    { actions: ["s3:GetObject"], resources: ["arn:aws:s3:::my-bucket/*"] }
  ]
});
```
