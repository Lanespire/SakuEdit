# ApiGatewayV2

> Source: https://sst.dev/docs/component/aws/apigatewayv2/

## Overview

The `ApiGatewayV2` component integrates an Amazon API Gateway HTTP API into your SST application, enabling you to create and manage HTTP endpoints.

## Constructor

```typescript
new sst.aws.ApiGatewayV2(name, args?, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args?` (ApiGatewayV2Args) - Configuration options
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### accessLog
- **Type:** `Input<Object>`
- **Default:** `{retention: "1 month"}`
- Configures CloudWatch logging for API access.
- Sub-properties:
  - `retention?` - Duration logs are preserved. Options: `"1 day"`, `"3 days"`, `"5 days"`, `"1 week"`, `"2 weeks"`, `"1 month"`, `"2 months"`, `"3 months"`, `"4 months"`, `"5 months"`, `"6 months"`, `"1 year"`, `"13 months"`, `"18 months"`, `"2 years"`, `"3 years"`, `"5 years"`, `"6 years"`, `"7 years"`, `"8 years"`, `"9 years"`, `"10 years"`, `"forever"`

### cors
- **Type:** `Input<boolean | Object>`
- **Default:** `true`
- Manages cross-origin resource sharing.
- When set to `true`, defaults are applied. When set to an object:
  - `allowCredentials?` (boolean) - Allow credentials
  - `allowHeaders?` (string[]) - Allowed headers
  - `allowMethods?` (string[]) - HTTP methods or wildcard `"*"`
  - `allowOrigins?` (string[]) - Origin domains or wildcard `"*"`
  - `exposeHeaders?` (string[]) - Headers exposed to the browser
  - `maxAge?` (string) - Preflight cache duration

### domain
- **Type:** `Input<string | Object>`
- Sets a custom domain for the API.
- Sub-properties:
  - `name?` (Input<string>) - Domain name
  - `cert?` (Input<string>) - ACM certificate ARN
  - `dns?` - DNS provider (Route 53, Cloudflare, Vercel). Defaults to Route 53.
  - `nameId?` (Input<string>) - Existing API Gateway domain name ID
  - `path?` (Input<string>) - Base path suffix for the API URL

### link
- **Type:** `Input<any[]>`
- Resources to link to all API routes.

### transform
- **Type:** `Object`
- Customizes resource creation.
- Sub-properties:
  - `api` - Transform the API Gateway HTTP API resource
  - `domainName` - Transform the domain name resource
  - `logGroup` - Transform the CloudWatch LogGroup
  - `route` - Transform route handler and arguments (set default props for all routes)
  - `stage` - Transform the API stage
  - `vpcLink` - Transform the VPC link

### vpc
- **Type:** `Vpc | Input<Object>`
- Connects API to private VPC resources.
- Sub-properties:
  - `securityGroups` (Input<Input<string>[]>) - Security group IDs
  - `subnets` (Input<Input<string>[]>) - Subnet IDs

## Properties

### nodes
Underlying AWS resources:
- `api` - API Gateway HTTP API resource
- `logGroup` - CloudWatch LogGroup for access logs
- `vpcLink?` - VPC link (when configured)
- `domainName` - Domain name resource

### url
- **Type:** `Output<string>`
- Full API endpoint URL. Uses custom domain if configured, otherwise auto-generated.

## Methods

### addAuthorizer(args)

```typescript
addAuthorizer(args: ApiGatewayV2AuthorizerArgs): ApiGatewayV2Authorizer
```

Adds an authentication mechanism to API routes.

**ApiGatewayV2AuthorizerArgs:**

- `name` (string) - Authorizer identifier
- `jwt?` - JWT authorizer configuration:
  - `audiences` (Input<Input<string>[]>) - Target audience list
  - `identitySource?` (Input<string>) - JWT extraction location (default: `"$request.header.Authorization"`)
  - `issuer` (Input<string>) - Identity provider base domain
- `lambda?` - Lambda authorizer configuration:
  - `function` (Input<string | FunctionArgs>) - Handler path or function configuration
  - `identitySources?` (Input<string[]>) - Identity extraction points
  - `payload?` (`"1.0"` | `"2.0"`) - Payload version
  - `response?` (`"simple"` | `"iam"`) - Response type
  - `ttl?` (Input<string>) - Authorization caching duration

### route(rawRoute, handler, args?)

```typescript
route(rawRoute: string, handler: Input<string | FunctionArgs>, args?: ApiGatewayV2RouteArgs): ApiGatewayV2LambdaRoute
```

Adds an HTTP route combining method + path.
- Route format: `"METHOD /path"` (e.g., `"GET /"`, `"POST /notes/{id}"`)
- Catch-all route: `"$default"`
- Greedy paths: `"/notes/{proxy+}"`

**ApiGatewayV2RouteArgs:**

- `auth?` (Input<false | Object>) - Authentication options:
  - `iam?` (boolean) - Enable AWS IAM signing
  - `jwt?` (Object) - `{ authorizer: string, scopes?: string[] }`
  - `lambda?` (string) - Custom authorizer ID
- `transform?` - Customizes route integration and route resources

### routePrivate(rawRoute, arn, args?)

```typescript
routePrivate(rawRoute: string, arn: string, args?: ApiGatewayV2PrivateRouteArgs): ApiGatewayV2PrivateRoute
```

Connects routes to private resources (Load Balancers, Cloud Map services) via VPC link.

### routeUrl(rawRoute, url, args?)

```typescript
routeUrl(rawRoute: string, url: string, args?: ApiGatewayV2UrlRouteArgs): ApiGatewayV2UrlRoute
```

Proxies requests to external URLs.

## Links

When linked, the `ApiGatewayV2` component exposes the following through the SDK `Resource` object:
- `url` (string) - The API endpoint URL

## Examples

### Basic setup
```typescript
const api = new sst.aws.ApiGatewayV2("MyApi");
api.route("GET /", "src/get.handler");
```

### Custom domain
```typescript
new sst.aws.ApiGatewayV2("MyApi", {
  domain: "api.example.com"
});
```

### With JWT authentication
```typescript
const authorizer = api.addAuthorizer({
  name: "myAuthorizer",
  jwt: {
    issuer: "https://issuer.com/",
    audiences: ["https://api.example.com"]
  }
});
api.route("GET /", "src/get.handler", {
  auth: { jwt: { authorizer: authorizer.id } }
});
```

### Default route props via transform
```typescript
new sst.aws.ApiGatewayV2("MyApi", {
  transform: {
    route: {
      handler: (args) => { args.memory ??= "2048 MB"; }
    }
  }
});
```

### With VPC
```typescript
new sst.aws.ApiGatewayV2("MyApi", {
  vpc: myVpc
});
```

### Route to private resource
```typescript
api.routePrivate("GET /", "arn:aws:elasticloadbalancing:...");
```

### Proxy to external URL
```typescript
api.routeUrl("GET /", "https://some-external-service.com");
```
