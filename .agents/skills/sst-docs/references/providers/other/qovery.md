# Qovery

> Source: https://www.pulumi.com/registry/packages/qovery
> Package: `@ediri/qovery`
> SST Install: `sst add @ediri/qovery`

## Overview

The Qovery Resource Provider enables management of Qovery resources through infrastructure-as-code. Qovery is a platform that simplifies cloud deployment, allowing you to manage clusters, projects, environments, and applications.

## Configuration

Required:
- **Organization ID** - Your Qovery organization identifier
- **AWS Credentials** (for AWS deployments):
  - Access Key ID (stored as secret)
  - Secret Access Key (stored as secret)

## Key Resources

- **AwsCredentials** - Manages AWS authentication credentials
- **Cluster** - Creates and manages compute clusters
- **Project** - Organizes applications and environments
- **Environment** - Defines deployment environments (e.g., Production)
- **Application** - Deploys containerized applications with Git integration
- **Deployment** - Manages the desired state of environment deployments

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as qovery from "@ediri/qovery";

const config = new pulumi.Config();
const organizationId = config.get("organizationId") || "changeme";

const myCluster = new qovery.Cluster("myCluster", {
  organizationId: organizationId,
  name: "TS Demo Cluster",
  cloudProvider: "AWS",
  region: "eu-central-1",
  instanceType: "t3a.medium",
  minRunningNodes: 3,
  maxRunningNodes: 4,
  state: "DEPLOYED",
});

const helloServerDemoApp = new qovery.Application("helloServerDemoApp", {
  name: "hello-server-demo-app",
  environmentId: prodEnvironment.id,
  gitRepository: {
    url: "https://github.com/dirien/hello-server.git",
    branch: "main",
  },
  cpu: 500,
  memory: 256,
  buildMode: "DOCKER",
  ports: [
    {
      internalPort: 8080,
      externalPort: 443,
      protocol: "HTTP",
    },
  ],
});
```
