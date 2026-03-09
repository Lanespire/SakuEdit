# Kubernetes NGINX Ingress Controller

> Source: https://www.pulumi.com/registry/packages/kubernetes-ingress-nginx/
> Package: `kubernetes-ingress-nginx`
> SST Install: `sst add kubernetes-ingress-nginx`

## Overview

The NGINX Ingress Controller is a Pulumi package that enables easy management of NGINX Ingress Controller installations in Kubernetes clusters. It streamlines the deployment and configuration of NGINX ingress controllers for routing external traffic to cluster services.

- **Current Version:** v0.1.3
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-kubernetes-ingress-nginx](https://github.com/pulumi/pulumi-kubernetes-ingress-nginx)
- **Languages:** TypeScript/JavaScript, Python

## Configuration

### Controller Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `controller` | object | Controller configuration block |
| `controller.publishService.enabled` | boolean | Publish load balancer IP to Ingress objects |

### Helm Options

The component wraps a Helm chart and supports standard Helm configuration values for the NGINX Ingress Controller chart.

## Key Resources

### IngressController

The primary resource that manages installation and setup of the NGINX controller. Creates:

- NGINX Ingress Controller Deployment/DaemonSet
- Service (LoadBalancer or NodePort)
- ConfigMap for NGINX configuration
- RBAC roles and bindings
- Admission webhooks (optional)

### Works With

- **Services** - For exposing applications
- **Deployments** - For running application replicas
- **Ingress** - For routing traffic based on host/path rules

## Example

```typescript
import * as nginx from "@pulumi/kubernetes-ingress-nginx";
import * as k8s from "@pulumi/kubernetes";

// Install the NGINX Ingress Controller
const controller = new nginx.IngressController("nginx", {
  controller: {
    publishService: {
      enabled: true,
    },
  },
});

// Deploy an application
const appLabels = { app: "my-app" };

const deployment = new k8s.apps.v1.Deployment("my-app", {
  spec: {
    replicas: 2,
    selector: { matchLabels: appLabels },
    template: {
      metadata: { labels: appLabels },
      spec: {
        containers: [
          {
            name: "my-app",
            image: "nginx:latest",
            ports: [{ containerPort: 80 }],
          },
        ],
      },
    },
  },
});

const service = new k8s.core.v1.Service("my-app-svc", {
  spec: {
    selector: appLabels,
    ports: [{ port: 80, targetPort: 80 }],
  },
});

// Route traffic via Ingress
const ingress = new k8s.networking.v1.Ingress("my-app-ingress", {
  metadata: {
    annotations: {
      "kubernetes.io/ingress.class": "nginx",
    },
  },
  spec: {
    rules: [
      {
        host: "app.example.com",
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: service.metadata.name,
                  port: { number: 80 },
                },
              },
            },
          ],
        },
      },
    ],
  },
});
```

```python
import pulumi_kubernetes_ingress_nginx as nginx

controller = nginx.IngressController("nginx",
    controller={
        "publishService": {
            "enabled": True,
        },
    },
)
```
