# Components

> Source: https://sst.dev/docs/components/

## Overview

SST applications are built from **components**, which are logical units representing features like frontends, APIs, databases, or queues. There are two types:

1. Built-in components (created by SST team)
2. Provider components (from cloud providers)

## Background

Cloud providers like AWS consist of low-level resources. Creating a Next.js application requires approximately 70 AWS resources. SST components abstract this complexity, enabling developers beyond DevOps teams to use Infrastructure as Code effectively.

## Built-in Components

### General Usage

SST provides high-level components that simplify infrastructure creation. Example:

```typescript
new sst.aws.Nextjs("MyWeb");
```

Components support extensive configuration:

```typescript
new sst.aws.Nextjs("MyWeb", {
  domain: "my-app.com",
  path: "packages/web",
  imageOptimization: {
    memory: "512 MB"
  },
  buildCommand: "npm run build"
});
```

### AWS Components

Components are namespaced as `sst.aws.*` and utilize Pulumi's AWS provider internally.

### Cloudflare Components

Components are namespaced as `sst.cloudflare.*` and utilize Pulumi's Cloudflare provider.

## Constructor

Component signature:

```typescript
new sst.aws.Function(name: string, args: FunctionArgs, opts?: pulumi.ComponentResourceOptions)
```

### Parameters

**Name**: Must be globally unique across the entire app to enable Resource Linking lookups. Use PascalCase (e.g., `MyBucket`) or kebab-case as preferred.

**Args**: Component-specific configuration object. Most arguments are optional, with common options at the top level.

**Opts**: Optional Pulumi ComponentResourceOptions for advanced configuration.

### Example

```typescript
const fn = new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler"
});
```

## Transform

Most components accept a `transform` property allowing customization of underlying infrastructure creation.

### Transform Structure

For the Function component:

- `function`: Transform the Lambda function
- `logGroup`: Transform the Lambda's LogGroup
- `role`: Transform the assumed role

Transform callbacks accept either configuration objects or functions:

```typescript
// As configuration object (merged with defaults)
{
  transform: {
    role: {
      name: "MyRole"
    }
  }
}

// As function (mutates arguments)
{
  transform: {
    role: (args, opts) => {
      args.name = `${args.name}-MyRole`;
      opts.retainOnDelete = true;
    }
  }
}
```

### Global $transform

Set default properties across all components of a type:

```typescript
$transform(sst.aws.Function, (args, opts) => {
  args.runtime ??= "nodejs18.x";
});

new sst.aws.Function("MyFunctionA", {
  handler: "src/lambdaA.handler"
  // runtime: nodejs18.x (from $transform)
});

new sst.aws.Function("MyFunctionB", {
  handler: "src/lambdaB.handler",
  runtime: "nodejs20.x"
  // runtime: nodejs20.x (overrides $transform)
});
```

Note: `$transform` applies only to components defined after its declaration.

## Properties

Component instances expose properties. Function example properties: `arn`, `name`, `url`, `nodes`.

```typescript
const functionArn = fn.arn;
```

### Links

Some properties are available via resource linking for typesafe access within functions and frontends.

### Nodes

The `nodes` property provides access to underlying infrastructure. These reflect resources configurable via `transform`.

Function component nodes: `function`, `logGroup`, `role`.

## Outputs

Component properties often return `Output<primitive>` types representing values resolved during deployment. These outputs can serve as arguments to other components, enabling concurrent deployment of non-dependent resources.

### Example

```typescript
const myFunction = new sst.aws.Function("MyFunction", {
  url: true,
  handler: "src/lambda.handler"
});

// myFunction.url is Output<string>
new sst.aws.Router("MyRouter", {
  routes: {
    "/api": myFunction.url
  }
});
```

The router depends on the function URL but other components deploy concurrently.

### Apply Method

Outputs require resolution before use in operations:

```typescript
// Invalid: cannot concatenate unresolved output
const newUrl = myFunction.url + "/foo";

// Valid: use apply to resolve
const newUrl = myFunction.url.apply((value) => value + "/foo");
```

### Helper Functions

#### $concat

```typescript
const newUrl = $concat(myFunction.url, "/foo");
```

#### $interpolate

```typescript
const newUrl = $interpolate`${myFunction.url}/foo`;
```

#### $jsonParse

```typescript
const policy = $jsonParse(policyStr);
```

#### $jsonStringify

```typescript
const policy = $jsonStringify(policyObj);
```

#### $resolve

```typescript
$resolve([bucket.name, worker.url]).apply(([bucketName, workerUrl]) => {
  console.log(`Bucket: ${bucketName}`);
  console.log(`Worker: ${workerUrl}`);
});
```

## Versioning

Components evolve with breaking changes managed through versioning. Previous versions remain available with version suffixes (e.g., `Vpc.v1`).

### Continuing with Old Version

```typescript
const vpc = new sst.aws.Vpc.v1("MyVpc");
```

### Updating to Latest Version

Rename the component to trigger recreation:

```typescript
const vpc = new sst.aws.Vpc("MyNewVpc");
```

**Caution**: Removing and recreating components may cause temporary downtime in your app.
