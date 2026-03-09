# F5 BIG-IP

> Source: https://www.pulumi.com/registry/packages/f5bigip
> Package: `f5bigip`
> SST Install: `sst add f5bigip`

## Overview

The F5 BIG-IP provider enables infrastructure-as-code management of F5 BIG-IP configurations. It supports provisioning and management of LTM (Local Traffic Manager), Network, and System objects, with AS3/DO integration. The provider communicates via the iControlREST API and is validated on BIG-IP v12.1.1+ (v16.x+ for AWAF resources).

## Configuration

Required settings (via `Pulumi.yaml` or environment variables):

- **address** - Domain/IP of BIG-IP (env: `BIGIP_HOST`)
- **username** - Authentication user (env: `BIGIP_USER`)
- **password** - Authentication password (env: `BIGIP_PASSWORD`)

Optional:
- `tokenAuth` - Token-based authentication (default: true)
- `port` - Management port (default: 443)
- `apiTimeout`, `tokenTimeout`, `apiRetries` - Request/retry configuration
- `validateCertsDisable` - TLS certificate validation (default: true)
- `trustedCertPath` - Certificate path for validation

## Key Resources

- LTM (Local Traffic Manager) resources
- Network configuration resources
- System management resources
- AS3/DO integration resources

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as f5bigip from "@pulumi/f5bigip";

const config = new pulumi.Config();
// Configure via Pulumi.yaml:
// f5bigip:address: "bigip.example.com"
// f5bigip:username: "admin"
// f5bigip:password: "secret"
```
