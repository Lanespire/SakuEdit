# Zscaler Private Access (ZPA)

> Source: https://www.pulumi.com/registry/packages/zpa/
> Package: `@bdzscaler/pulumi-zpa`
> SST Install: `sst add @bdzscaler/pulumi-zpa`

## Overview

The ZPA provider enables provisioning of cloud resources available in Zscaler Private Access. It allows managing ZPA cloud resources for secure private application access, including segment groups, application segments, and access policies.

## Configuration

The provider must be configured with credentials. Refer to the installation & configuration page for authentication setup.

## Key Resources

- **ZPASegmentGroup** - Create and manage segment groups with properties like name, description, enabled status, and TCP keep-alive configuration

## Example

```typescript
import * as zpa from "@bdzscaler/pulumi-zpa";

const segmentGroup = new zpa.ZPASegmentGroup("segment-group", {
  name: "Pulumi Segment Group",
  description: "Pulumi Segment Group",
  enabled: true,
  policyMigrated: true,
  tcpKeepAliveEnabled: "1",
});
```
