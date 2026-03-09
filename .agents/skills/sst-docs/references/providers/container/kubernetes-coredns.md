# Kubernetes CoreDNS

> Source: https://www.pulumi.com/registry/packages/kubernetes-coredns
> Package: `kubernetes-coredns`
> SST Install: `sst add kubernetes-coredns`

## Overview

The Kubernetes CoreDNS package enables easy management of CoreDNS installations as a package available in all Pulumi languages. CoreDNS is a flexible, extensible DNS server that can serve as the Kubernetes cluster DNS.

- **Current Version:** v0.1.0
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-kubernetes-coredns](https://github.com/pulumi/pulumi-kubernetes-coredns)
- **Languages:** TypeScript/JavaScript, Python

## Configuration

CoreDNS is configured through server definitions that specify zones and plugins:

### Server Configuration

| Parameter | Description |
|-----------|-------------|
| `servers` | Array of DNS server configurations |
| `servers[].zones` | DNS zones with scheme specifications (e.g., `tls://`, `dns://`) |
| `servers[].port` | Custom port assignments |
| `servers[].plugins` | Extensible plugin architecture |

### Zone Options

- `zone` - DNS zone name
- `scheme` - Protocol scheme (`dns://`, `tls://`)
- `use_tcp` - Enable TCP protocol

### Plugin System

CoreDNS uses a plugin-based architecture. Common plugins:

- `kubernetes` - Kubernetes service discovery
- `forward` - DNS forwarding
- `cache` - DNS response caching
- `log` - Query logging
- `errors` - Error logging
- `health` - Health check endpoint
- `ready` - Readiness check endpoint

## Key Resources

### CoreDNS

The primary component that deploys and configures CoreDNS in a Kubernetes cluster with customizable server configurations, zones, and plugins.

## Example

```typescript
import * as coredns from "@pulumi/kubernetes-coredns";

const dns = new coredns.CoreDNS("coredns", {
  servers: [
    {
      zones: [{ zone: "." }],
      port: 53,
      plugins: [
        { name: "errors" },
        { name: "health" },
        { name: "ready" },
        {
          name: "kubernetes",
          parameters: "cluster.local in-addr.arpa ip6.arpa",
        },
        {
          name: "forward",
          parameters: ". /etc/resolv.conf",
        },
        { name: "cache", parameters: "30" },
        { name: "loop" },
        { name: "reload" },
        { name: "loadbalance" },
      ],
    },
  ],
});
```

```python
import pulumi_kubernetes_coredns as coredns

dns = coredns.CoreDNS("coredns",
    servers=[{
        "zones": [{"zone": "."}],
        "port": 53,
        "plugins": [
            {"name": "errors"},
            {"name": "health"},
            {"name": "ready"},
            {"name": "kubernetes", "parameters": "cluster.local in-addr.arpa ip6.arpa"},
            {"name": "forward", "parameters": ". /etc/resolv.conf"},
            {"name": "cache", "parameters": "30"},
            {"name": "loop"},
            {"name": "reload"},
            {"name": "loadbalance"},
        ],
    }],
)
```
