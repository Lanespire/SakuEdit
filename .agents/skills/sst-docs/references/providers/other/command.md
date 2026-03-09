# Command

> Source: https://www.pulumi.com/registry/packages/command/
> Package: `command`
> SST Install: `sst add command`

## Overview

The Pulumi Command provider enables execution of commands and scripts locally or remotely as part of infrastructure deployment. It supports running scripts on `create`, `update`, and `destroy` operations, supporting stateful command execution. Key use cases include:

- Registering/deregistering resources with external services
- Remote command execution via SSH
- File copying via SSH
- Cleanup operations during resource lifecycle events

## Configuration

No provider-level configuration is required. Connection details for remote operations are specified per-resource.

**Remote connection properties (`ConnectionArgs`):**
- `host` - Remote server address
- `user` - SSH username
- `privateKey` - SSH private key
- `password` - SSH password (alternative to private key)
- `port` - SSH port (default: 22)

## Key Resources

- `local.Command` - Execute scripts locally during create/update/destroy
- `remote.Command` - Execute scripts on remote hosts via SSH
- `remote.CopyToRemote` - Transfer files/archives to remote systems

## Example

```typescript
import { local, remote } from "@pulumi/command";

// Local command execution
const random = new local.Command("random", {
  create: "openssl rand -hex 16",
});

export const output = random.stdout;

// Remote command execution
const remoteCmd = new remote.Command("remoteCmd", {
  connection: {
    host: "example.com",
    user: "deploy",
    privateKey: privateKey,
  },
  create: "echo 'Hello from remote!'",
});
```
