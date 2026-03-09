# Kubernetes

> Source: https://www.pulumi.com/registry/packages/kubernetes
> Package: `kubernetes`
> SST Install: `sst add kubernetes`

## Overview

The Pulumi Kubernetes provider exposes the entire Kubernetes resource API as an SDK, enabling you to provision any Kubernetes API resources and manage containerized application workloads. It allows using real programming languages instead of YAML/JSON/DSLs, applying standard software development practices to infrastructure. Pulumi never sends any authentication secrets or credentials to the Pulumi Cloud.

## Configuration

### Kubeconfig Setup

The provider automatically searches for kubeconfig files in standard locations:
1. Environment variable: `$KUBECONFIG`
2. Default directory: `~/.kube/config`

Verify cluster connectivity before deploying: `kubectl get pods`

### Pulumi Config

```bash
pulumi config set kubernetes:context my-context
pulumi config set kubernetes:kubeconfig /path/to/kubeconfig
pulumi config set kubernetes:namespace my-namespace
```

### Key Parameters

- `kubeconfig` - Contents of a kubeconfig file or path
- `context` - Kubeconfig context to use
- `cluster` - Cluster identifier
- `namespace` - Default namespace for resources
- `enableDryRun` - Enable server-side dry-run validation
- `suppressDeprecationWarnings` - Suppress API deprecation warnings
- `suppressHelmHookWarnings` - Suppress Helm hook warnings

### Related Packages

- `@pulumi/eks` - Amazon EKS cluster management
- `@pulumi/awsx` - AWS Crosswalk patterns
- Pulumi Kubernetes Operator for CI/CD integration

## Key Resources

- `kubernetes.apps.v1.Deployment` - Manage Deployments
- `kubernetes.core.v1.Service` - Manage Services
- `kubernetes.core.v1.ConfigMap` - Manage ConfigMaps
- `kubernetes.core.v1.Secret` - Manage Secrets
- `kubernetes.core.v1.Namespace` - Manage Namespaces
- `kubernetes.networking.v1.Ingress` - Manage Ingress rules
- `kubernetes.helm.v3.Chart` - Deploy Helm charts
- `kubernetes.yaml.ConfigFile` - Deploy from YAML files
- `kubernetes.yaml.ConfigGroup` - Deploy multiple YAML files

## Example

```typescript
import * as k8s from "@pulumi/kubernetes";

// Create a namespace
const ns = new k8s.core.v1.Namespace("app-ns", {
  metadata: { name: "my-app" },
});

// Create a deployment
const deployment = new k8s.apps.v1.Deployment("app", {
  metadata: {
    namespace: ns.metadata.name,
    name: "nginx",
  },
  spec: {
    replicas: 3,
    selector: { matchLabels: { app: "nginx" } },
    template: {
      metadata: { labels: { app: "nginx" } },
      spec: {
        containers: [{
          name: "nginx",
          image: "nginx:latest",
          ports: [{ containerPort: 80 }],
        }],
      },
    },
  },
});

// Expose via a Service
const service = new k8s.core.v1.Service("app-svc", {
  metadata: {
    namespace: ns.metadata.name,
    name: "nginx",
  },
  spec: {
    selector: { app: "nginx" },
    ports: [{ port: 80, targetPort: 80 }],
    type: "LoadBalancer",
  },
});
```
