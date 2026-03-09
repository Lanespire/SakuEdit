# Azure Classic

> Source: https://www.pulumi.com/registry/packages/azure/
> Package: `azure`
> SST Install: `sst add azure`

## Overview

The Azure Classic provider enables provisioning of cloud resources available in Azure through Pulumi. It manages and provisions resources using the Azure Resource Manager (ARM) APIs. **Note:** The `azure-native` provider is now the recommended option, as Azure Classic has fewer resources and resource options and receives new Azure features more slowly than Azure Native.

## Configuration

### Azure CLI (Recommended for local development)

```bash
az login
pulumi config set azure:location westus2
```

### Service Principal

```bash
pulumi config set azure:clientId <clientId>
pulumi config set azure:clientSecret <clientSecret> --secret
pulumi config set azure:tenantId <tenantId>
pulumi config set azure:subscriptionId <subscriptionId>
```

### Environment Variables

```bash
export ARM_CLIENT_ID=<clientId>
export ARM_CLIENT_SECRET=<clientSecret>
export ARM_TENANT_ID=<tenantId>
export ARM_SUBSCRIPTION_ID=<subscriptionId>
```

### Key Configuration Options

| Option | Description |
|--------|-------------|
| `subscriptionId` | Azure subscription ID |
| `tenantId` | Azure AD tenant ID |
| `clientId` | Service principal client ID |
| `clientSecret` | Service principal secret |
| `location` | Default resource location |
| `environment` | Azure cloud environment |

## Key Resources

- **Core**: `azure.core.ResourceGroup`
- **Compute**: `azure.compute.VirtualMachine`
- **App Service**: `azure.appservice.AppService`, `azure.appservice.Plan`
- **Storage**: `azure.storage.Account`, `azure.storage.Container`
- **Functions**: `azure.appservice.FunctionApp`
- **Networking**: `azure.network.VirtualNetwork`, `azure.network.Subnet`
- **Databases**: `azure.sql.Server`, `azure.cosmosdb.Account`

## Example

```typescript
import * as azure from "@pulumi/azure";

// Create a resource group
const resourceGroup = new azure.core.ResourceGroup("my-group", {
  location: "westus2",
});

// Create a storage account
const storageAccount = new azure.storage.Account("mystorage", {
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
  accountTier: "Standard",
  accountReplicationType: "LRS",
});

export const resourceGroupName = resourceGroup.name;
export const storageAccountName = storageAccount.name;
```
