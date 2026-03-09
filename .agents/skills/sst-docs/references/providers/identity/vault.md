# HashiCorp Vault

> Source: https://www.pulumi.com/registry/packages/vault
> Package: `vault`
> SST Install: `sst add vault`

## Overview

The HashiCorp Vault provider enables Pulumi to read from, write to, and configure HashiCorp Vault. It facilitates credential management by allowing operators to obtain temporary credentials from Vault rather than storing them directly in configurations. Vault provides secrets management, encryption as a service, and privileged access management. Version: v7.7.0.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VAULT_ADDR` | Vault server URL (required) |
| `VAULT_TOKEN` | Authentication token |
| `VAULT_TOKEN_NAME` | Display name for child tokens (default: "pulumi") |
| `VAULT_SKIP_VERIFY` | Disable TLS verification (dev only) |
| `VAULT_CACERT` | Path to CA certificate |
| `VAULT_MAX_RETRIES` | Retry attempts for 5xx errors (default: 2) |

### Pulumi Config

```yaml
config:
  vault:address:
    value: https://vault.example.com:8200
  vault:token:
    value: <vault-token>
```

### Supported Authentication Methods

Userpass, AWS, TLS Certificate, GCP, Kerberos, Radius, OCI, OIDC, JWT, Azure, Token File.

### Key Security Parameters

- `skipChildToken` - Disable intermediate token creation (not recommended)
- `maxLeaseTtlSeconds` - Duration limit for issued tokens (default: 20 minutes)
- `caCertFile` / `caCertDir` - TLS validation certificates
- `tlsServerName` - SNI hostname specification

## Key Resources

### Authentication Modules
- **appRole** - Application role authentication
- **aws** / **azure** / **gcp** - Cloud provider auth integrations
- **github** / **ldap** / **okta** - Identity provider integrations
- **jwt** / **kubernetes** - Token-based authentication
- **tokenauth** - Token authentication management
- **saml** - SAML authentication

### Secrets Modules
- **kv** - Key-value secret storage
- **database** - Database credential management
- **secrets** - General secret handling
- **transit** - Data encryption and signing
- **pkiSecret** - Public key infrastructure
- **ssh** - SSH secret engine

### Infrastructure Modules
- **consul** - Consul integration
- **mongodbatlas** / **rabbitMq** - Service-specific backends
- **identity** - Identity management
- **transform** - Data transformation
- **kmip** - Key Management Interoperability Protocol

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as vault from "@pulumi/vault";

// Create a generic secret
const secret = new vault.generic.Secret("example", {
  path: "secret/foo",
  dataJson: JSON.stringify({
    foo: "bar",
    pizza: "cheese",
  }),
});

// Enable a secrets engine
const kvEngine = new vault.Mount("kv", {
  path: "kv",
  type: "kv-v2",
  description: "KV Version 2 secret engine",
});

// Create an AppRole auth backend
const approle = new vault.AuthBackend("approle", {
  type: "approle",
});

// Create a policy
const policy = new vault.Policy("my-policy", {
  name: "my-policy",
  policy: `
    path "secret/data/*" {
      capabilities = ["read", "list"]
    }
  `,
});
```
