# StrongDM

> Source: https://www.pulumi.com/registry/packages/sdm/
> Package: `@pierskarsenbarg/sdm`
> SST Install: `sst add @pierskarsenbarg/sdm`

## Overview

The StrongDM provider enables provisioning of cloud resources available in StrongDM. StrongDM provides secure infrastructure access management, and this provider allows managing user accounts, roles, and access policies through infrastructure as code.

## Configuration

The provider must be configured with credentials to deploy and update resources in StrongDM. Refer to the installation & configuration page for detailed setup.

## Key Resources

- **Account** - Manage user accounts within StrongDM with user details (name, email)

## Example

```typescript
import * as sdm from "@pierskarsenbarg/sdm";

const account = new sdm.Account("account", {
  user: {
    firstName: "Alice",
    lastName: "Bob",
    email: "alicebob@email.com",
  },
});
```
