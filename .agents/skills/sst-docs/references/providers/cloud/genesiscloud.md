# Genesis Cloud

> Source: https://www.pulumi.com/registry/packages/genesiscloud/
> Package: `@genesiscloud/pulumi-genesiscloud`
> SST Install: `sst add @genesiscloud/pulumi-genesiscloud`

## Overview

The Genesis Cloud provider enables infrastructure provisioning through Pulumi for cloud resources available on the Genesis Cloud platform. Genesis Cloud specializes in GPU-accelerated cloud computing, offering high-performance instances with NVIDIA GPUs for machine learning, AI workloads, rendering, and other compute-intensive tasks.

## Configuration

### Environment Variables

```bash
export GENESISCLOUD_TOKEN=<your-api-token>
```

### Pulumi Config

```bash
pulumi config set genesiscloud:token <your-api-token> --secret
```

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `token` | `GENESISCLOUD_TOKEN` | Genesis Cloud API token (required) |
| `endpoint` | - | Custom API endpoint |

## Key Resources

- **Instances**: `genesiscloud.Instance`
- **SSH Keys**: `genesiscloud.SSHKey`
- **Security Groups**: `genesiscloud.SecurityGroup`
- **Volumes**: `genesiscloud.Volume`
- **Snapshots**: `genesiscloud.Snapshot`
- **Floating IPs**: `genesiscloud.FloatingIP`
- **Images**: `genesiscloud.Image`

## Example

```typescript
import * as genesiscloud from "@genesiscloud/pulumi-genesiscloud";

// Create an SSH key
const sshKey = new genesiscloud.SSHKey("ssh-key", {
  name: "my-ssh-key",
  publicKey: "<YOUR_SSH_PUBLIC_KEY>",
});

// Create a security group allowing SSH
const allowSSH = new genesiscloud.SecurityGroup("allow-ssh", {
  name: "allow-ssh",
  region: "ARC-IS-HAF-1",
  rules: [{
    direction: "ingress",
    protocol: "tcp",
    portRangeMin: 22,
    portRangeMax: 22,
  }],
});

// Create a GPU instance
const instance = new genesiscloud.Instance("gpu-instance", {
  name: "ml-training-instance",
  region: "ARC-IS-HAF-1",
  image: "ubuntu-ml-nvidia-pytorch",
  type: "vcpu-4_memory-12g_disk-80g_nvidia3080-1",
  sshKeyIds: [sshKey.id],
  securityGroupIds: [allowSSH.id],
});

export const instanceId = instance.id;
```
