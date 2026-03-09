# Kubernetes Cert Manager

> Source: https://www.pulumi.com/registry/packages/kubernetes-cert-manager
> Package: `kubernetes-cert-manager`
> SST Install: `sst add kubernetes-cert-manager`

## Overview

The Kubernetes Cert Manager is a Pulumi component that simplifies deployment and management of cert-manager, a Kubernetes add-on that automates the management and issuance of TLS certificates from various issuing sources. It ensures certificates remain valid and renews them appropriately before expiration.

The underlying cert-manager project originated from Jetstack and is now a CNCF Member Project.

- **Current Version:** v0.2.0
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-kubernetes-cert-manager](https://github.com/pulumi/pulumi-kubernetes-cert-manager)

## Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installCRDs` | boolean | No | Install Custom Resource Definitions |
| `helmOptions` | ReleaseArgs | No | Helm deployment settings (e.g., namespace) |

### Helm Options

The `helmOptions` parameter accepts standard Pulumi Helm Release arguments:

- `namespace` - Kubernetes namespace to deploy into
- `values` - Custom Helm chart values
- `version` - Specific chart version

## Key Resources

### CertManager

The primary component that installs and configures cert-manager in the Kubernetes cluster. This includes:

- cert-manager controller deployment
- Webhook for validating and mutating resources
- cainjector for injecting CA bundles
- Custom Resource Definitions (CRDs) for Certificate, Issuer, ClusterIssuer, etc.

### Supported Certificate Sources

- Let's Encrypt (ACME)
- HashiCorp Vault
- Venafi
- Self-signed certificates
- Internal CA issuers

## Example

```typescript
import * as certmanager from "@pulumi/kubernetes-cert-manager";
import * as k8s from "@pulumi/kubernetes";

const ns = new k8s.core.v1.Namespace("cert-manager-ns", {
  metadata: { name: "cert-manager" },
});

const manager = new certmanager.CertManager("cert-manager", {
  installCRDs: true,
  helmOptions: {
    namespace: ns.metadata.name,
  },
});
```

```python
import pulumi_kubernetes as k8s
from pulumi_kubernetes_cert_manager import CertManager, ReleaseArgs

ns = k8s.core.v1.Namespace("cert-manager-ns",
    metadata={"name": "cert-manager"},
)

manager = CertManager("cert-manager",
    install_crds=True,
    helm_options=ReleaseArgs(namespace=ns.metadata["name"]),
)
```
