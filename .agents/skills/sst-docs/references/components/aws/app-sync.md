# AppSync

> Source: https://sst.dev/docs/component/aws/app-sync/

## Overview

The `AppSync` component integrates an Amazon AppSync GraphQL API into SST applications, enabling GraphQL API creation with data source and resolver management.

## Constructor

```typescript
new sst.aws.AppSync(name, args, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args` (AppSyncArgs) - Configuration object (required)
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### schema
- **Type:** `Input<string>`
- **Required**
- Path to the GraphQL schema file, relative to `sst.config.ts`.

### domain?
- **Type:** `Input<string | Object>`
- Custom domain configuration for the API.
- Sub-properties:
  - `name` (Input<string>) - Custom domain name
  - `dns?` (`false | sst.aws.dns | sst.cloudflare.dns | sst.vercel.dns`) - DNS provider (defaults to AWS Route 53)
  - `cert?` (Input<string>) - ACM certificate ARN for domain validation

### transform?
- **Type:** `Object`
- Resource transformation options.
- Sub-properties:
  - `api?` - Customize GraphQL API resource
  - `domainName?` - Customize domain name resource

## Properties

### id
- **Type:** `Output<string>`
- GraphQL API identifier.

### url
- **Type:** `Output<string>`
- GraphQL API endpoint URL.

### nodes
- `api` (GraphQLApi) - Underlying AWS AppSync resource

## Methods

### addDataSource(args)

```typescript
addDataSource(args: AppSyncDataSourceArgs): AppSyncDataSource
```

Adds a data source to the AppSync API. Supports Lambda, DynamoDB, RDS, HTTP, EventBridge, OpenSearch, and Elasticsearch.

**AppSyncDataSourceArgs:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Data source identifier |
| `lambda?` | string \| FunctionArgs \| ARN | Lambda function handler or ARN |
| `dynamodb?` | string | DynamoDB table ARN |
| `rds?` | Object | RDS cluster config (`cluster` ARN + `credentials` ARN) |
| `http?` | string | HTTP endpoint URL |
| `eventBridge?` | string | EventBridge event bus ARN |
| `openSearch?` | string | OpenSearch domain ARN |
| `elasticSearch?` | string | Elasticsearch domain ARN |
| `transform?` | Object | Resource customization options |

### addFunction(args)

```typescript
addFunction(args: AppSyncFunctionArgs): AppSyncFunction
```

Adds a reusable function to the AppSync API for pipeline resolvers.

**AppSyncFunctionArgs:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Function identifier |
| `dataSource` | string | Associated data source name |
| `code?` | string | Request/response function code |
| `requestMappingTemplate?` | string | Request template |
| `responseMappingTemplate?` | string | Response template |
| `transform?` | Object | Resource customization |

### addResolver(operation, args)

```typescript
addResolver(operation: string, args: AppSyncResolverArgs): AppSyncResolver
```

Adds a resolver mapping GraphQL operations to data sources. The `operation` parameter format is `"Type field"` (e.g., `"Query user"`, `"Mutation createUser"`).

**AppSyncResolverArgs:**

| Property | Type | Description |
|----------|------|-------------|
| `kind?` | `"unit"` \| `"pipeline"` | Resolver type (default: `"unit"`) |
| `dataSource?` | string | Data source (unit resolvers only) |
| `functions?` | string[] | Functions (pipeline resolvers only) |
| `code?` | string | Function code |
| `requestTemplate?` | string | Request/before template |
| `responseTemplate?` | string | Response/after template |
| `transform?` | Object | Resource customization |

## Links

When linked, the `AppSync` component exposes the following through the SDK `Resource` object:
- `url` (string) - GraphQL API endpoint URL

## Examples

### Basic setup with Lambda data source
```typescript
const api = new sst.aws.AppSync("MyApi", {
  schema: "schema.graphql"
});

api.addDataSource({
  name: "lambdaDS",
  lambda: "src/lambda.handler"
});

api.addResolver("Query user", {
  dataSource: "lambdaDS"
});
```

### With DynamoDB data source
```typescript
api.addDataSource({
  name: "dynamoDS",
  dynamodb: myTable.arn
});
```

### With HTTP data source
```typescript
api.addDataSource({
  name: "httpDS",
  http: "https://api.example.com"
});
```

### Pipeline resolver with functions
```typescript
const fn = api.addFunction({
  name: "myFunction",
  dataSource: "lambdaDS"
});

api.addResolver("Query user", {
  kind: "pipeline",
  functions: [fn.name]
});
```

### Custom domain
```typescript
new sst.aws.AppSync("MyApi", {
  schema: "schema.graphql",
  domain: "graphql.example.com"
});
```

### With Cloudflare DNS
```typescript
new sst.aws.AppSync("MyApi", {
  schema: "schema.graphql",
  domain: {
    name: "graphql.example.com",
    dns: sst.cloudflare.dns()
  }
});
```
