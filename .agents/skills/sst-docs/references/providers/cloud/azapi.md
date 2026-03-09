# AzAPI

> Source: https://www.pulumi.com/registry/packages/azapi
> Package: `@ediri/azapi`
> SST Install: `sst add @ediri/azapi`

## Overview

The AzAPI Resource Provider enables management of Azure resources through Pulumi, leveraging the Azure API provider capabilities for infrastructure-as-code deployments. It provides direct access to Azure resource types using their full API versions.

- **Current Version:** v1.12.2
- **Publisher:** dirien
- **Repository:** [dirien/pulumi-azapi](https://github.com/dirien/pulumi-azapi)
- **Languages:** TypeScript/JavaScript, Python, Go, C#

## Configuration

Core configuration options:

| Property | Description | Example |
|----------|-------------|---------|
| `type` | Azure resource type with API version | `"Microsoft.Web/serverfarms@2020-06-01"` |
| `name` | Resource identifier | `"my-app-plan"` |
| `parentId` | Parent resource reference | Resource group ID |
| `ignoreCasing` | Case-sensitivity handling | `true` / `false` |
| `body` | JSON-serialized resource properties | `JSON.stringify({...})` |
| `responseExportValues` | Response fields to export | `["properties.hostNames"]` |
| `identity` | Resource identity configuration | `{ type: "SystemAssigned" }` |

## Key Resources

### azapi.Resource

Creates and manages Azure resources with JSON body configurations. Supports any Azure resource type by specifying the full API version.

### azapi.UpdateResource

Updates existing Azure resources with new property values without recreating them.

## Example

```typescript
import * as azapi from "@ediri/azapi";

const appServicePlan = new azapi.Resource("appServicePlan", {
  type: "Microsoft.Web/serverfarms@2020-06-01",
  name: "my-app-plan",
  parentId: resourceGroup.id,
  body: JSON.stringify({
    kind: "app",
    sku: {
      name: "B1",
      tier: "Basic",
    },
    properties: {},
  }),
});

const webApp = new azapi.Resource("webApp", {
  type: "Microsoft.Web/sites@2020-06-01",
  name: "my-web-app",
  parentId: resourceGroup.id,
  body: JSON.stringify({
    kind: "app",
    properties: {
      serverFarmId: appServicePlan.id,
    },
  }),
  identity: {
    type: "SystemAssigned",
  },
  responseExportValues: ["properties.hostNames"],
});
```
