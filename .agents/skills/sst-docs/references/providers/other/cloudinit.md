# Cloud-init

> Source: https://www.pulumi.com/registry/packages/cloudinit
> Package: `cloudinit`
> SST Install: `sst add cloudinit`

## Overview

The cloud-init provider renders multipart MIME configurations for use with cloud-init. Cloud-init is the industry standard for cross-platform cloud instance initialization. This provider generates properly formatted cloud-init user data that can be passed to cloud instances during launch.

## Configuration

This provider requires no configuration. It can be used immediately after installation without any setup steps or environment variables.

## Key Resources

- `cloudinit.Config` - Renders a multipart MIME configuration for cloud-init, combining multiple content parts (shell scripts, cloud-config YAML, etc.) into a single user data payload

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as cloudinit from "@pulumi/cloudinit";

const config = new cloudinit.Config("example", {
  gzip: false,
  base64Encode: false,
  parts: [
    {
      contentType: "text/x-shellscript",
      content: "#!/bin/bash\necho 'Hello World'",
      filename: "init.sh",
    },
    {
      contentType: "text/cloud-config",
      content: "packages:\n  - nginx\n",
    },
  ],
});
```
