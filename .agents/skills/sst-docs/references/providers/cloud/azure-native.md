# Azure Native

> Source: https://www.pulumi.com/registry/packages/azure-native/
> Package: `azure-native`
> SST Install: `sst add azure-native`

## Overview

The Azure Native provider enables infrastructure provisioning across Azure's complete cloud resource catalog. It provisions all cloud resources available in Azure by leveraging the Azure Resource Manager (ARM) APIs for resource management and deployment. This is the recommended provider for Azure (over the classic `azure` provider).

## Configuration

### Authentication Methods

The provider supports five authentication approaches:

#### 1. Azure CLI (Default)

```bash
az login
pulumi config set azure-native:location westus2
```

For government or China clouds: `az cloud set --name AzureUSGovernment`

#### 2. Default Azure Credential

```bash
pulumi config set azure-native:useDefaultAzureCredential true
pulumi config set azure-native:subscriptionId <subscriptionId>
```

Or via environment variables: `ARM_USE_DEFAULT_AZURE_CREDENTIAL=true` and `ARM_SUBSCRIPTION_ID`.

#### 3. OpenID Connect (OIDC)

```bash
pulumi config set azure-native:useOidc true
```

Or `ARM_USE_OIDC=true` environment variable.

#### 4. Service Principal

Configure using client ID, secret/certificate, and tenant ID:

```bash
pulumi config set azure-native:clientId <clientId>
pulumi config set azure-native:clientSecret <clientSecret> --secret
pulumi config set azure-native:tenantId <tenantId>
pulumi config set azure-native:subscriptionId <subscriptionId>
```

#### 5. Managed Service Identity (MSI)

```bash
pulumi config set azure-native:useMsi true
```

Or `ARM_USE_MSI=true` environment variable.

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `subscriptionId` | `ARM_SUBSCRIPTION_ID` | Azure subscription ID |
| `tenantId` | `ARM_TENANT_ID` | Azure AD tenant ID |
| `clientId` | `ARM_CLIENT_ID` | Service principal client ID |
| `clientSecret` | `ARM_CLIENT_SECRET` | Service principal secret |
| `location` | - | Default resource location |
| `environment` | `ARM_ENVIRONMENT` | Azure cloud (`AzureCloud`, `AzureUSGovernment`, `AzureChinaCloud`) |

## Key Resources

- **Resources**: `resources.ResourceGroup`
- **Compute**: `compute.VirtualMachine`, `compute.VirtualMachineScaleSet`
- **Storage**: `storage.StorageAccount`, `storage.BlobContainer`
- **Networking**: `network.VirtualNetwork`, `network.Subnet`, `network.NetworkSecurityGroup`
- **Web**: `web.WebApp`, `web.AppServicePlan`
- **Containers**: `containerservice.ManagedCluster` (AKS), `containerregistry.Registry`
- **Databases**: `sql.Server`, `dbformysql.Server`, `cosmosdb.DatabaseAccount`
- **Functions**: `web.WebApp` (with function app configuration)

## Example

```typescript
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";

// Create a resource group
const resourceGroup = new resources.ResourceGroup("myResourceGroup");

// Create a storage account
const storageAccount = new storage.StorageAccount("mystorage", {
  resourceGroupName: resourceGroup.name,
  sku: {
    name: "Standard_LRS",
  },
  kind: "StorageV2",
});

export const resourceGroupName = resourceGroup.name;
export const storageAccountName = storageAccount.name;
```
