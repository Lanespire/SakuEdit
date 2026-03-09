# ACME (Automated Certificate Management Environment)

> Source: https://www.pulumi.com/registry/packages/acme
> Package: `@pulumiverse/acme`
> SST Install: `sst add @pulumiverse/acme`

## Overview

The ACME provider enables automated certificate management through the ACME standard. It facilitates domain-validated certificate acquisition by registering with certificate authorities (like Let's Encrypt), answering domain ownership challenges via HTTP or DNS, and requesting certificates -- all without manual intervention.

## Configuration

Refer to the installation & configuration page for provider setup. The provider works with Let's Encrypt and any ACME-compliant CA.

## Key Resources

- **Registration** - Establishes an account with the ACME CA using an account key and email address
- **Certificate** - Requests domain certificates with support for subject alternative names and DNS challenge providers

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as acme from "@pulumiverse/acme";
import * as tls from "@pulumi/tls";

const privateKey = new tls.index.PrivateKey("privateKey", { algorithm: "RSA" });

const reg = new acme.index.Registration("reg", {
  accountKeyPem: privateKey.privateKeyPem,
  emailAddress: "nobody@example.com",
});

const certificate = new acme.index.Certificate("certificate", {
  accountKeyPem: reg.accountKeyPem,
  commonName: "www.example.com",
  subjectAlternativeNames: ["www2.example.com"],
  dnsChallenge: [{ provider: "route53" }],
});
```
