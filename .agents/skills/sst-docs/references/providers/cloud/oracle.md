# Oracle Cloud Infrastructure (OCI)

> Source: https://www.pulumi.com/registry/packages/oci/
> Package: `oci`
> SST Install: `sst add oci`

## Overview

The Oracle Cloud Infrastructure (OCI) provider for Pulumi can be used to provision any of the resources available in OCI. It integrates with Pulumi's multi-language framework to manage Oracle Cloud infrastructure declaratively, including compute, networking, storage, databases, containers, and identity resources.

## Configuration

### Pulumi Config (Recommended)

```bash
pulumi config set oci:tenancyOcid "ocid1.tenancy.oc1..<unique_ID>" --secret
pulumi config set oci:userOcid "ocid1.user.oc1..<unique_ID>" --secret
pulumi config set oci:fingerprint "<key_fingerprint>" --secret
pulumi config set oci:region "us-ashburn-1"
cat ~/.oci/oci_api_key.pem | pulumi config set oci:privateKey --secret
```

### Environment Variables

```bash
export TF_VAR_tenancy_ocid=ocid1.tenancy.oc1..<unique_ID>
export TF_VAR_user_ocid=ocid1.user.oc1..<unique_ID>
export TF_VAR_fingerprint=<key_fingerprint>
export TF_VAR_region=us-ashburn-1
export TF_VAR_private_key_path=~/.oci/oci_api_key.pem
```

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `tenancyOcid` | `TF_VAR_tenancy_ocid` | Tenancy identifier (required) |
| `userOcid` | `TF_VAR_user_ocid` | User identifier for API calls |
| `fingerprint` | `TF_VAR_fingerprint` | API key pair fingerprint |
| `region` | `TF_VAR_region` | Target OCI region |
| `privateKey` | `TF_VAR_private_key` | Private key contents (takes precedence) |
| `privateKeyPath` | `TF_VAR_private_key_path` | Path to private key file |
| `configFileProfile` | `TF_VAR_config_file_profile` | Custom `.oci/config` profile |

**Important:** Always use the `--secret` flag when storing sensitive credentials.

## Key Resources

- **Identity**: `oci.identity.User`, `oci.identity.Group`, `oci.identity.Policy`
- **Compute**: `oci.core.Instance`, `oci.core.Image`
- **Networking**: `oci.core.Vcn`, `oci.core.Subnet`, `oci.core.SecurityList`
- **Storage**: `oci.objectstorage.Bucket`, `oci.core.Volume`
- **Databases**: `oci.database.DbSystem`, `oci.database.AutonomousDatabase`
- **Containers**: `oci.containerengine.Cluster`, `oci.containerengine.NodePool`
- **Functions**: `oci.functions.Application`, `oci.functions.Function`
- **Load Balancing**: `oci.loadbalancer.LoadBalancer`

## Example

```typescript
import * as oci from "@pulumi/oci";

// Create a user
const user = new oci.identity.User("myUser", {
  compartmentId: tenancyOcid,
  description: "Pulumi managed user",
  email: "user@example.com",
  definedTags: {
    "Operations.CostCenter": "42",
  },
  freeformTags: {
    Department: "Finance",
  },
});

// Create a VCN
const vcn = new oci.core.Vcn("myVcn", {
  compartmentId: compartmentOcid,
  cidrBlock: "10.0.0.0/16",
  displayName: "my-vcn",
});

export const userId = user.id;
export const vcnId = vcn.id;
```
