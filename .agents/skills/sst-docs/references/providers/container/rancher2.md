# Rancher2

> Source: https://www.pulumi.com/registry/packages/rancher2
> Package: `rancher2`
> SST Install: `sst add rancher2`

## Overview

The Rancher2 provider enables interaction with resources supported by Rancher v2, a complete Kubernetes management platform. It operates in two modes: Admin mode (default) for managing Rancher resources, and Bootstrap mode for initial system configuration including admin password setup and initial cluster registration.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `RANCHER_URL` | Rancher API URL (required) |
| `RANCHER_TOKEN_KEY` | Rancher API token key |
| `RANCHER_ACCESS_KEY` | Rancher API access key |
| `RANCHER_SECRET_KEY` | Rancher API secret key |
| `RANCHER_CA_CERTS` | CA certificates for TLS |
| `RANCHER_INSECURE` | Allow insecure connections |

### Pulumi Config

```bash
pulumi config set rancher2:apiUrl https://rancher.example.com
pulumi config set rancher2:tokenKey XXXXXXXXXXXXXX --secret
```

### Key Parameters

- `apiUrl` - Rancher API URL (required)
- `tokenKey` - API token key (alternative to access/secret key pair)
- `accessKey` / `secretKey` - API key pair authentication
- `caCerts` - CA certificates for Rancher server TLS
- `insecure` - Allow insecure connections (self-signed certs)
- `bootstrap` - Enable bootstrap mode (`true`/`false`)
- `timeout` - API timeout (default: `120s`)

## Key Resources

- `rancher2.Bootstrap` - Initial system setup (admin password, URL)
- `rancher2.Cluster` - Manage Kubernetes clusters
- `rancher2.ClusterV2` - Manage clusters (v2 API)
- `rancher2.NodePool` - Manage node pools
- `rancher2.Catalog` - Manage Helm chart catalogs
- `rancher2.Namespace` - Manage namespaces
- `rancher2.Project` - Manage Rancher projects
- `rancher2.App` - Deploy applications

## Example

```typescript
import * as rancher2 from "@pulumi/rancher2";

// Bootstrap Rancher (first-time setup)
const admin = new rancher2.Bootstrap("admin", {
  password: "my-secure-password",
  telemetry: true,
});

// Add a catalog
const catalog = new rancher2.Catalog("my-catalog", {
  name: "my-catalog",
  url: "https://charts.example.com",
});

// Create a project
const project = new rancher2.Project("my-project", {
  name: "my-project",
  clusterId: "local",
  description: "Managed by Pulumi",
});
```
