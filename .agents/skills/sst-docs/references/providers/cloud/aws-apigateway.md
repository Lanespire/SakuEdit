# AWS API Gateway

> Source: https://www.pulumi.com/registry/packages/aws-apigateway
> Package: `aws-apigateway`
> SST Install: `sst add aws-apigateway`

## Overview

Pulumi AWS API Gateway simplifies the creation of AWS API Gateway REST APIs by exposing "Crosswalk for AWS" functionality. It provides a streamlined approach to building REST APIs across all Pulumi programming languages, eliminating complexity in manual API setup and configuration.

- **Current Version:** v3.0.0
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-aws-apigateway](https://github.com/pulumi/pulumi-aws-apigateway)

## Configuration

The package requires AWS credentials to be configured before deployment. Language-specific installation is handled through standard Pulumi package management. Python requires explicit file-system handler functions due to closure serialization limitations.

## Key Resources

### RestAPI

The primary component for building REST APIs:

- Route definition with path and HTTP method specification
- Lambda function integration as event handlers
- Automatic URL generation and export

### RouteArgs

Configuration structure:

- `path` - API route path
- `method` - HTTP method (GET, POST, PUT, DELETE, etc.)
- `eventHandler` - Lambda function handler attachment

## Example

```typescript
import * as apigateway from "@pulumi/aws-apigateway";
import * as aws from "@pulumi/aws";

const api = new apigateway.RestAPI("api", {
  routes: [
    {
      path: "/",
      method: "GET",
      eventHandler: new aws.lambda.CallbackFunction("fn", {
        callback: async (ev, ctx) => {
          return {
            statusCode: 200,
            body: "Hello, API Gateway!",
          };
        },
      }),
    },
  ],
});

export const url = api.url;
```

```python
import pulumi
import pulumi_aws_apigateway as apigateway

api = apigateway.RestAPI("api", routes=[
    apigateway.RouteArgs(
        path="/",
        method="GET",
        event_handler=aws.lambda_.Function("fn",
            runtime="python3.9",
            handler="handler.handler",
            code=pulumi.AssetArchive({".": pulumi.FileArchive("./handler")}),
        ),
    ),
])

pulumi.export("url", api.url)
```
