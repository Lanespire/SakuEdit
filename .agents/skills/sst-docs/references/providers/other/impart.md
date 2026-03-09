# Impart Security

> Source: https://www.pulumi.com/registry/packages/impart/
> Package: `@impart-security/pulumi-impart`
> SST Install: `sst add @impart-security/pulumi-impart`

## Overview

The Impart Resource Provider enables infrastructure-as-code management of Impart Security resources, including API specifications, API bindings, and log bindings for API security monitoring and protection.

## Configuration

Refer to the installation & configuration page for provider setup and authentication details.

## Key Resources

- **Spec** - Defines API specifications with optional source file hashing for change tracking
- **ApiBinding** - Manages API endpoint bindings with hostname, port, and base path configuration
- **LogBinding** - Handles log pattern parsing using grok pattern types

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as impart from "@impart-security/pulumi-impart";
import * as crypto from "crypto";
import * as fs from "fs";

const hashSum = crypto.createHash("sha256");
const specSource = fs.readFileSync(`./spec.yaml`).toString();

const spec = new impart.Spec("spec", {
  name: "example_spec",
  sourceFile: "spec.yaml",
  sourceHash: hashSum.update(specSource).digest("hex"),
});

const apiBinding = new impart.ApiBinding("api_binding", {
  name: "api_binding_example",
  port: 8080,
  hostname: "example.com",
  basePath: "/",
  specId: spec.id,
});
```
