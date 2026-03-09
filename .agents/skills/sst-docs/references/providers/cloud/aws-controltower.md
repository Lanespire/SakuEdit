# AWS Control Tower

> Source: https://www.pulumi.com/registry/packages/awscontroltower
> Package: `@lbrlabs/pulumi-awscontroltower`
> SST Install: `sst add @lbrlabs/pulumi-awscontroltower`

## Overview

The AWS Control Tower provider enables provisioning of AWS accounts using AWS Control Tower. It allows creating and managing AWS accounts within Control Tower, supporting organizational unit assignment, email configuration, SSO setup, and account deletion policies.

## Configuration

The provider must be configured with the required permissions to manage AWS accounts in AWS Control Tower. Standard AWS credentials with Control Tower permissions are required.

## Key Resources

- **ControlTowerAwsAccount** - Creates and manages AWS accounts within Control Tower with organizational unit assignment, SSO configuration, and deletion policies

## Example

```typescript
import * as controltower from "@lbrlabs/pulumi-awscontroltower";

const account = new controltower.ControlTowerAwsAccount("account", {
  organizationalUnit: "Production",
  email: "mail@example.com",
  name: "Some User",
  organizationalUnitIdOnDelete: "ou-48hfnvbc-ufo",
  closeAccountOnDelete: true,
  sso: {
    firstName: "Some",
    lastName: "User",
    email: "mail@example.com",
  },
});
```
