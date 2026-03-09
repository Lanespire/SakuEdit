# RunPod

> Source: https://www.pulumi.com/registry/packages/runpod
> Package: `@runpod-infra/pulumi`
> SST Install: `sst add @runpod-infra/pulumi`

## Overview

The RunPod provider enables infrastructure provisioning within the RunPod platform through Pulumi. RunPod is a GPU cloud platform for AI/ML workloads. The provider allows developers to manage GPU pods, container templates, serverless endpoints, and network storage declaratively.

## Configuration

Set the RunPod API token using Pulumi config:

```bash
pulumi config set --secret runpod:token YOUR_API_TOKEN
```

**Pulumi.yaml:**
```yaml
config:
  runpod:token:
    value: YOUR_RUNPOD_API_TOKEN
```

## Key Resources

- `runpod.Pod` - Compute instances with configurable GPU, CPU, memory, and storage
- `runpod.Template` - Container templates for serverless or standard deployments
- `runpod.Endpoint` - Scalable inference endpoints with worker management
- `runpod.NetworkStorage` - Persistent storage volumes across data centers

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as runpod from "@runpod-infra/pulumi";

const myTemplate = new runpod.Template("testTemplate", {
  containerDiskInGb: 5,
  dockerArgs: "python handler.py",
  imageName: "runpod/serverless-hello-world:latest",
  isServerless: true,
  name: "Testing Pulumi V1",
});

const myPod = new runpod.Pod("myPod", {
  cloudType: "ALL",
  gpuCount: 1,
  gpuTypeId: "NVIDIA GeForce RTX 4090",
  name: "RunPod Pytorch",
  imageName: "runpod/pytorch:latest",
});
```
