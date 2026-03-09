# TLS

> Source: https://www.pulumi.com/registry/packages/tls
> Package: `tls`
> SST Install: `sst add tls`

## Overview

The TLS provider provides utilities for working with Transport Layer Security keys and certificates. It enables developers to create private keys, certificates, and certificate requests as part of Pulumi deployments. TLS and SSL are equivalent when considering the resources managed by this provider. This tool pairs well with other providers to establish TLS services or provision certificates.

## Configuration

The provider supports an optional proxy configuration:

- `fromEnv` (Boolean) - Discover proxy settings from environment variables (default: `true`)
- `url` (String) - Proxy connection URL (`http`, `https`, or `socks5` schemes)
- `username` (String) - Basic authentication credential
- `password` (String, Sensitive) - Basic authentication credential

## Key Resources

- `tls.PrivateKey` - Create cryptographic private keys (RSA, ECDSA, ED25519)
- `tls.SelfSignedCert` - Generate self-signed TLS certificates
- `tls.CertRequest` - Create certificate signing requests (CSR)
- `tls.LocallySignedCert` - Sign certificates with a local CA
- `tls.GetCertificate` - Retrieve certificate data from external endpoints (data source)

## Example

```typescript
import * as tls from "@pulumi/tls";

const example = new tls.PrivateKey("example", {
  algorithm: "ECDSA",
});

const exampleCert = new tls.SelfSignedCert("example", {
  privateKeyPem: example.privateKeyPem,
  validityPeriodHours: 12,
  earlyRenewalHours: 3,
  allowedUses: [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ],
  dnsNames: ["example.com", "example.net"],
  subject: {
    commonName: "example.com",
    organization: "ACME Examples, Inc",
  },
});
```
