# Consul

> Source: https://www.pulumi.com/registry/packages/consul
> Package: `consul`
> SST Install: `sst add consul`

## Overview

The Consul provider enables interaction with HashiCorp Consul clusters through Pulumi. Consul is a service networking platform providing service discovery, service mesh, and application configuration capabilities. The provider allows managing key-value stores, services, ACL policies, intentions, and other Consul resources as infrastructure-as-code.

## Configuration

### Environment Variables

Aligned with official Consul CLI environment variables:

| Variable | Description |
|----------|-------------|
| `CONSUL_HTTP_ADDR` | HTTP(S) API endpoint (default: `127.0.0.1:8500`) |
| `CONSUL_HTTP_TOKEN` | ACL token for authentication |
| `CONSUL_HTTP_AUTH` | Basic authentication credentials |
| `CONSUL_SCHEME` | URL scheme (`http` or `https`) |
| `CONSUL_DATACENTER` | Target datacenter |
| `CONSUL_CACERT` | CA certificate file path |
| `CONSUL_CLIENT_CERT` | Client certificate file path |
| `CONSUL_CLIENT_KEY` | Client key file path |

### Pulumi Config

```bash
pulumi config set consul:address https://consul.example.com:8500
pulumi config set consul:token XXXXXXXXXXXXXX --secret
pulumi config set consul:datacenter dc1
```

### Key Parameters

- `address` - HTTP(S) API endpoint (default: `127.0.0.1:8500`)
- `scheme` - URL scheme (`http` or `https`)
- `datacenter` - Target datacenter
- `token` - ACL token for authentication
- `httpAuth` - Basic authentication credentials
- `caFile` / `caPem` - CA certificate (file path or PEM)
- `certFile` / `certPem` - Client certificate (file path or PEM)
- `keyFile` / `keyPem` - Client key (file path or PEM)
- JWT and AWS IAM authentication methods also supported

## Key Resources

- `consul.Keys` - Manage key-value store entries
- `consul.Service` - Register and manage services
- `consul.AclPolicy` - Manage ACL policies
- `consul.AclToken` - Manage ACL tokens
- `consul.Intention` - Manage service mesh intentions
- `consul.ConfigEntry` - Manage configuration entries
- `consul.Node` - Register catalog nodes
- `consul.PreparedQuery` - Manage prepared queries

### Key Functions

- `consul.getKeys` - Read values from the key-value store
- `consul.getService` - Look up service information
- `consul.getNodes` - List catalog nodes

## Example

```typescript
import * as consul from "@pulumi/consul";
import * as aws from "@pulumi/aws";

// Read configuration from Consul KV store
const appConfig = consul.getKeys({
  keys: [{
    name: "ami",
    path: "service/app/launch_ami",
    default: "ami-1234",
  }, {
    name: "instanceType",
    path: "service/app/instance_type",
    default: "t3.micro",
  }],
});

// Use Consul values to configure AWS resources
const appInstance = new aws.ec2.Instance("app", {
  ami: appConfig.then(c => c.var?.ami),
  instanceType: appConfig.then(c => c.var?.instanceType),
});

// Register a service
const webService = new consul.Service("web", {
  name: "web",
  port: 80,
  tags: ["production", "v1"],
  checks: [{
    checkId: "web-health",
    http: "http://localhost:80/health",
    interval: "10s",
    timeout: "1s",
  }],
});

// Manage KV pairs
const config = new consul.Keys("app-config", {
  keys: [{
    path: "service/app/config",
    value: JSON.stringify({ debug: false, logLevel: "info" }),
  }],
});
```
