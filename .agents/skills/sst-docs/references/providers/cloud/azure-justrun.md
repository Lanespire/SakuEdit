# Azure JustRun

> Source: https://www.pulumi.com/registry/packages/azure-justrun
> Package: `pulumi-azure-justrun`
> SST Install: `sst add pulumi-azure-justrun`

## Overview

The azure-justrun component simplifies deploying straightforward web applications to Azure. It makes it easy to deploy a simple web app to Azure using any of the supported Pulumi programming languages including markup languages like YAML and JSON.

- **Current Version:** v0.2.3
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-azure-justrun](https://github.com/pulumi/pulumi-azure-justrun)
- **Languages:** TypeScript/JavaScript, Python, Go, .NET, YAML, JSON

## Configuration

### Input Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `filePath` | string | Yes | Path to folder containing web files |
| `appSkuName` | string | No | Compute instance SKU name |
| `appSkuTier` | string | No | Compute instance tier level |
| `containerPublicAccess` | string | No | Public access level for BlobContainer |
| `storageSkuName` | string | No | SKU name for storage account |
| `storageAccount` | Resource | No | Existing storage account (auto-created if omitted) |
| `resourceGroup` | Resource | No | Resource group (auto-created if omitted) |
| `namePrefix` | string | No | Prefix for child resources (no dashes) |

### Output Properties

| Property | Description |
|----------|-------------|
| `url` | The website access URL |

## Key Resources

### Webapp

The primary component that creates:

- Azure App Service with the specified web files
- Storage Account (if not provided)
- Resource Group (if not provided)
- Blob Container for website data

## Example

```typescript
import * as justrun from "@pulumi/pulumi-azure-justrun";

const site = new justrun.Webapp("website", {
  filePath: "./www",
});

export const url = site.url;
```

```yaml
resources:
  web:
    type: "azure-justrun:index:webapp"
    properties:
      filePath: "./www"
outputs:
  websiteURL: ${web.url}
```
