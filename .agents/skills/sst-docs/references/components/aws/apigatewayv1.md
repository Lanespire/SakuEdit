# ApiGatewayV1

> Source: https://sst.dev/docs/component/aws/apigatewayv1/

## Overview

The `ApiGatewayV1` component integrates an Amazon API Gateway REST API into SST applications, enabling REST endpoint creation and management.

## Constructor

```typescript
new sst.aws.ApiGatewayV1(name, args?, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args?` (ApiGatewayV1Args) - Configuration object
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### accessLog
- **Type:** `Input<Object>`
- **Default:** `{retention: "1 month"}`
- Configures CloudWatch logging.
- Sub-properties:
  - `retention?` - Log retention duration. Options: `"1 day"` through `"10 years"` or `"forever"`

### cors
- **Type:** `Input<boolean>`
- **Default:** `true`
- Enables/disables Cross-Origin Resource Sharing.

### domain
- **Type:** `Input<string | Object>`
- Custom domain configuration. Supports Route 53, Cloudflare, or Vercel DNS providers.
- Sub-properties:
  - `name` (Input<string>) - Domain name
  - `cert?` (Input<string>) - ACM certificate ARN
  - `dns?` - DNS provider adapter (defaults to Route 53)
  - `nameId?` (Input<string>) - Existing API Gateway domain name ID
  - `path?` (Input<string>) - URL base path suffix (e.g., `/v1`)

### endpoint
- **Type:** `Input<Object>`
- **Default:** `{type: "edge"}`
- API endpoint type configuration.
- Sub-properties:
  - `type` - `"edge"` (CloudFront), `"regional"`, or `"private"`
  - `vpcEndpointIds?` (Input<Input<string>[]>) - Required for private endpoints

### transform
- **Type:** `Object`
- Customizes resource creation.
- Sub-properties:
  - `accessLog` - Transform CloudWatch LogGroup
  - `api` - Transform RestApi resource
  - `deployment` - Transform API deployment
  - `domainName` - Transform domain name resource
  - `route` - Transform route handler and arguments (set defaults for all routes)
  - `stage` - Transform API stage

## Properties

### nodes
Underlying AWS resources:
- `api` - RestApi resource
- `logGroup` - CloudWatch LogGroup (if logging enabled)
- `stage` - API Gateway stage
- `domainName` - API Gateway domain name resource

### url
- **Type:** `Output<string>`
- The deployed API endpoint URL.

## Methods

### route(route, handler, args?)

```typescript
route(route: string, handler: Input<string | FunctionArgs>, args?: ApiGatewayV1RouteArgs): ApiGatewayV1LambdaRoute
```

Adds a REST endpoint. Route format: `"{METHOD} /{path}"`.
- Supported methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`, `ANY`
- Path supports: literals (`/notes`), parameters (`/{id}`), greedy segments (`/{proxy+}`)

**ApiGatewayV1RouteArgs:**
- `auth?` (Input<false | Object>) - Authentication options:
  - `iam?` (boolean) - Enable AWS IAM auth
  - `custom?` (string) - Custom authorizer ID
  - `cognito?` (Object) - `{ authorizer: string, scopes?: string[] }`
- `apiKey?` (Input<boolean>) - Default `false`. When `true`, enforces API key requirement.
- `transform?` - Customizes `method` and `integration` resources

### routeIntegration(route, integration, args?)

```typescript
routeIntegration(route: string, integration: ApiGatewayV1IntegrationArgs, args?: ApiGatewayV1RouteArgs): ApiGatewayV1IntegrationRoute
```

Adds AWS service integrations (Step Functions, custom services).

**ApiGatewayV1IntegrationArgs:**
- `type` - `"aws"`, `"http"`, `"aws-proxy"`, `"mock"`, `"http-proxy"`
- `uri` (string) - Target service endpoint
- `integrationHttpMethod` (string) - HTTP verb for backend call
- `credentials?` (string) - IAM role ARN for AWS services
- `requestTemplates?` (Record<string, string>) - VTL mapping templates
- `passthroughBehavior?` - `"when-no-match"`, `"never"`, `"when-no-templates"`

### addAuthorizer(args)

```typescript
addAuthorizer(args: ApiGatewayV1AuthorizerArgs): ApiGatewayV1Authorizer
```

Attaches an authorization layer.

**ApiGatewayV1AuthorizerArgs:**
- `name` (string) - Required. Authorizer identifier.
- `tokenFunction?` (string) - Lambda token authorizer handler path/ARN
- `requestFunction?` (string) - Lambda request authorizer handler path/ARN
- `userPools?` (Input<Input<string>[]>) - Cognito User Pool ARNs
- `identitySource?` (string) - Header extraction (default: `"method.request.header.Authorization"`)
- `ttl?` (number) - Cache duration in seconds (default: 300)

### addUsagePlan(name, args)

```typescript
addUsagePlan(name: string, args: ApiGatewayV1UsagePlanArgs): ApiGatewayV1UsagePlan
```

Creates a usage/quota plan.

**ApiGatewayV1UsagePlanArgs:**
- `throttle?` - Rate limiting:
  - `rate` (number) - Requests/second baseline
  - `burst` (number) - Peak request allowance
- `quota?` - Request quotas:
  - `limit` (number) - Maximum requests in period
  - `period` (`"day"` | `"week"` | `"month"`) - Reset period
  - `offset?` (number) - Period reset day

### deploy()

```typescript
deploy(): void
```

Finalizes route deployment. **Required** to be called after adding all routes.

## Links

When linked, the `ApiGatewayV1` component exposes the following through the SDK `Resource` object:
- `url` (string) - The API endpoint URL

## Examples

### Basic setup
```typescript
const api = new sst.aws.ApiGatewayV1("MyApi");
api.route("GET /", "src/get.handler");
api.route("POST /", "src/post.handler");
api.deploy();
```

### With authentication
```typescript
api.route("GET /public", "src/public.handler");
api.route("POST /secure", "src/secure.handler", { auth: { iam: true } });
```

### With custom domain
```typescript
new sst.aws.ApiGatewayV1("MyApi", {
  domain: "api.example.com"
});
```

### Default route transforms
```typescript
new sst.aws.ApiGatewayV1("MyApi", {
  transform: {
    route: {
      handler: (args) => { args.memory ??= "2048 MB"; }
    }
  }
});
```

### Usage plan integration
```typescript
const plan = api.addUsagePlan("Premium", {
  throttle: { rate: 100, burst: 200 },
  quota: { limit: 1000, period: "month" }
});
const key = plan.addApiKey("ClientKey");
```

### With endpoint type
```typescript
new sst.aws.ApiGatewayV1("MyApi", {
  endpoint: { type: "regional" }
});
```

### Route with API key required
```typescript
api.route("GET /", "src/get.handler", { apiKey: true });
```
