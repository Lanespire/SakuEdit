# Nomad

> Source: https://www.pulumi.com/registry/packages/nomad
> Package: `nomad`
> SST Install: `sst add nomad`

## Overview

The Nomad provider enables interaction with HashiCorp Nomad clusters through Pulumi. Nomad is an application scheduler and orchestrator for deploying and managing containers and non-containerized applications. The provider exposes resources to manage jobs, ACL policies, namespaces, and other Nomad entities as infrastructure-as-code.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NOMAD_ADDR` | HTTP(S) API endpoint (default: `http://127.0.0.1:4646`) |
| `NOMAD_REGION` | Target Nomad region |
| `NOMAD_HTTP_AUTH` | Basic authentication credentials |
| `NOMAD_TOKEN` | ACL token for secured clusters |
| `NOMAD_CACERT` | CA certificate file path |
| `NOMAD_CLIENT_CERT` | Client certificate file path |
| `NOMAD_CLIENT_KEY` | Client key file path |

### Pulumi Config

```bash
pulumi config set nomad:address https://nomad.example.com:4646
pulumi config set nomad:secretId XXXXXXXXXXXXXX --secret
```

### Key Parameters

- `address` - HTTP(S) API endpoint (default: `http://127.0.0.1:4646`)
- `region` - Target Nomad region
- `httpAuth` - Basic authentication credentials
- `secretId` - ACL token for secured clusters
- `caFile` / `caPem` - CA certificate (file path or PEM)
- `certFile` / `certPem` - Client certificate (file path or PEM)
- `keyFile` / `keyPem` - Client key (file path or PEM)
- `skipVerify` - Skip TLS verification
- `headers` - Custom request headers
- `authJwt` - JWT authentication with `authMethod` and `loginToken`

## Key Resources

- `nomad.Job` - Register and manage Nomad jobs
- `nomad.Namespace` - Manage Nomad namespaces
- `nomad.AclPolicy` - Manage ACL policies
- `nomad.AclToken` - Manage ACL tokens
- `nomad.SentinelPolicy` - Manage Sentinel policies (Enterprise)
- `nomad.Volume` - Manage CSI volumes
- `nomad.QuoteSpecification` - Manage resource quotas

## Example

```typescript
import * as nomad from "@pulumi/nomad";

// Deploy a job using HCL jobspec
const webApp = new nomad.Job("web-app", {
  jobspec: `
job "web" {
  datacenters = ["dc1"]
  type = "service"

  group "web" {
    count = 3

    task "nginx" {
      driver = "docker"
      config {
        image = "nginx:latest"
        ports = ["http"]
      }
      resources {
        cpu    = 500
        memory = 256
      }
    }

    network {
      port "http" {
        to = 80
      }
    }
  }
}
`,
});

// Create a namespace
const ns = new nomad.Namespace("production", {
  name: "production",
  description: "Production workloads",
});
```
