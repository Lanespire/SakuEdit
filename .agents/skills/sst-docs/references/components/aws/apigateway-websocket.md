# ApiGatewayWebSocket

> Source: https://sst.dev/docs/component/aws/apigateway-websocket/

## Overview

The `ApiGatewayWebSocket` component integrates an Amazon API Gateway WebSocket API into your SST application, enabling real-time bidirectional communication.

## Constructor

```typescript
new sst.aws.ApiGatewayWebSocket(name, args?, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args?` (ApiGatewayWebSocketArgs) - Configuration options
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### accessLog?
- **Type:** `Input<Object>`
- **Default:** `{retention: "1 month"}`
- Configures CloudWatch logging for API Gateway access.
- Sub-properties:
  - `retention?` - Log retention duration. Options: `"1 day"` through `"10 years"` or `"forever"`

### domain?
- **Type:** `Input<string | Object>`
- Establishes custom domain routing. Supports Route 53, Cloudflare, or Vercel.
- Sub-properties:
  - `name?` (Input<string>) - Custom domain name
  - `cert?` (Input<string>) - ACM certificate ARN for manual validation
  - `dns?` - DNS provider adapter (defaults to Route 53)
  - `nameId?` (Input<string>) - Existing API Gateway domain identifier
  - `path?` (Input<string>) - URL base path suffix

### transform?
- **Type:** `Object`
- Customizes underlying resource creation.
- Sub-properties:
  - `accessLog?` - CloudWatch LogGroup configuration
  - `api?` - API Gateway WebSocket API resource
  - `domainName?` - Domain name resource
  - `route?` - Route handler and arguments (set defaults for all routes)
  - `stage?` - API stage resource

## Properties

### url
- **Type:** `Output<string>`
- The API endpoint URL. Uses custom domain if configured; otherwise, the auto-generated URL.

### managementEndpoint
- **Type:** `Output<string>`
- The management API endpoint for sending messages to connected WebSocket clients.

### nodes
Underlying AWS resources:
- `api` - API Gateway V2 API resource
- `logGroup` - CloudWatch LogGroup for access logs
- `domainName` - API Gateway domain name resource

## Methods

### route(route, handler, args?)

```typescript
route(route: string, handler: Input<string | FunctionArgs>, args?: ApiGatewayWebSocketRouteArgs): ApiGatewayWebSocketRoute
```

Adds routes to the WebSocket API.

**Predefined routes:**
- `$connect` - Client connection handler
- `$disconnect` - Client/server disconnection handler
- `$default` - Catch-all route

**ApiGatewayWebSocketRouteArgs:**
- `auth?` (Input<false | Object>) - Authorization configuration:
  - `iam?` (boolean) - AWS IAM Signature Version 4 verification
  - `jwt?` (Object) - `{ authorizer: string, scopes?: string[] }`
  - `lambda?` (string) - Custom Lambda authorizer ID
- `transform?` - Customizes route resources

### addAuthorizer(name, args)

```typescript
addAuthorizer(name: string, args: ApiGatewayWebSocketAuthorizerArgs): ApiGatewayV2Authorizer
```

Configures authorization mechanisms for the API.

**ApiGatewayWebSocketAuthorizerArgs:**

- `jwt?` - JWT authorizer configuration:
  - `issuer` (Input<string>) - Identity provider domain
  - `audiences` (Input<Input<string>[]>) - Valid JWT recipients
  - `identitySource?` (Input<string>) - Extraction location (default: `"route.request.header.Authorization"`)
- `lambda?` - Lambda authorizer configuration:
  - `function` (Input<string | FunctionArgs>) - Handler path or FunctionArgs
  - `identitySources?` (Input<string[]>) - Identity extraction points (default: `"route.request.header.Authorization"`)
  - `payload?` (`"1.0"` | `"2.0"`) - JWT version (default: `"2.0"`)
  - `response?` (`"simple"` | `"iam"`) - Response type (default: `"simple"`)

## Links

When linked, the `ApiGatewayWebSocket` component exposes the following through the SDK `Resource` object:
- `url` (string) - The API endpoint URL
- `managementEndpoint` (string) - Management API endpoint for sending messages to clients

## Examples

### Basic setup
```typescript
const api = new sst.aws.ApiGatewayWebSocket("MyApi");
```

### Custom domain
```typescript
new sst.aws.ApiGatewayWebSocket("MyApi", {
  domain: "api.example.com"
});
```

### With Cloudflare DNS
```typescript
new sst.aws.ApiGatewayWebSocket("MyApi", {
  domain: {
    name: "api.example.com",
    dns: sst.cloudflare.dns()
  }
});
```

### Adding routes
```typescript
api.route("$connect", "src/connect.handler");
api.route("$disconnect", "src/disconnect.handler");
api.route("$default", "src/default.handler");
api.route("sendMessage", "src/sendMessage.handler");
```

### Route with custom function config
```typescript
api.route("sendMessage", {
  handler: "src/sendMessage.handler",
  memory: "2048 MB"
});
```

### Lambda authorizer
```typescript
api.addAuthorizer("myAuthorizer", {
  lambda: { function: "src/authorizer.index" }
});
```

### JWT authorizer
```typescript
const authorizer = api.addAuthorizer("myAuthorizer", {
  jwt: {
    issuer: "https://issuer.com/",
    audiences: ["https://api.example.com"]
  }
});

api.route("GET /", "src/get.handler", {
  auth: { jwt: { authorizer: authorizer.id } }
});
```
