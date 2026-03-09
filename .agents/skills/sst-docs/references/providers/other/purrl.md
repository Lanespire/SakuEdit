# Purrl

> Source: https://www.pulumi.com/registry/packages/purrl
> Package: `@pulumiverse/purrl`
> SST Install: `sst add @pulumiverse/purrl`

## Overview

The Purrl provider is designed to be a flexible extension of your Pulumi code to make API calls to your target endpoint. It serves as a workaround when standard Pulumi providers lack needed resources or data sources, enabling direct HTTP API interactions through the Purrl resource.

## Configuration

No provider-level configuration required. All settings are specified per-resource.

## Key Resources

- **Purrl** - The main resource for making HTTP API calls with create, read, and delete operations. Supports custom headers, response code validation, and separate delete endpoints.

## Example

```typescript
import * as purrl from "@pulumiverse/purrl";

const purrlCommand = new purrl.Purrl("purrl", {
  name: "httpbin",
  url: "https://httpbin.org/get",
  method: "GET",
  headers: {
    test: "test",
  },
  responseCodes: ["200"],
  deleteMethod: "DELETE",
  deleteUrl: "https://httpbin.org/delete",
  deleteResponseCodes: ["200"],
});

export const url = purrlCommand.response;
```
