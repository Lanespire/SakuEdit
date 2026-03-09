# Talos Linux

> Source: https://www.pulumi.com/registry/packages/talos
> Package: `@pulumiverse/talos`
> SST Install: `sst add @pulumiverse/talos`

## Overview

The Talos Linux provider enables provisioning of Talos Linux machines and activation of Kubernetes clusters running on top of them. Talos is a minimal, immutable Linux distribution designed specifically for running Kubernetes.

## Configuration

Refer to the installation & configuration page for provider setup.

## Key Resources

- **machine.Secrets** - Generates machine and client configuration credentials
- **machine.ConfigurationApply** - Applies machine configurations to nodes with patches
- **machine.Bootstrap** - Initializes the Talos cluster
- **machine.GetConfiguration** - Generates machine configurations (data source)
- **client.GetKubeconfig** - Retrieves Kubernetes configuration files

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as talos from "@pulumiverse/talos";

const secrets = new talos.machine.Secrets("secrets", {});

const configuration = talos.machine.getConfigurationOutput({
  clusterName: "exampleCluster",
  machineType: "controlplane",
  clusterEndpoint: "https://cluster.local:6443",
  machineSecrets: secrets.machineSecrets,
});

const configurationApply = new talos.machine.ConfigurationApply(
  "configurationApply",
  {
    clientConfiguration: secrets.clientConfiguration,
    machineConfigurationInput: configuration.machineConfiguration,
    node: "10.5.0.2",
    configPatches: [
      JSON.stringify({
        machine: {
          install: {
            disk: "/dev/sdd",
          },
        },
      }),
    ],
  }
);

const bootstrap = new talos.machine.Bootstrap(
  "bootstrap",
  {
    node: "10.5.0.2",
    clientConfiguration: secrets.clientConfiguration,
  },
  {
    dependsOn: [configurationApply],
  }
);
```
