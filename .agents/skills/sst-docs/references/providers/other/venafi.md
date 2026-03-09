# Venafi

> Source: https://www.pulumi.com/registry/packages/venafi
> Package: `venafi`
> SST Install: `sst add venafi`

## Overview

The Venafi provider streamlines the process of acquiring SSL/TLS keys and certificates from Venafi services, giving assurance of compliance with Information Security policies. It enables automated certificate lifecycle management across two Venafi platforms: Venafi Control Plane (cloud-based) and Venafi Trust Protection Platform (on-premises). As of v0.18.0, it automatically retires associated certificates when infrastructure is decommissioned.

## Configuration

**Pulumi.yaml:**
```yaml
config:
  venafi:apiKey:
    value: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  venafi:zone:
    value: "Business App\\Enterprise CIT"
```

**Configuration Variables:**
- `zone` (String, required) - Policy folder or application/template reference
- `apiKey` (String) - API key for Venafi Control Plane
- `url` (String) - Platform endpoint (defaults to US Control Plane; regional variants: EU, AU, UK, SG, CA)
- `accessToken` (String) - Token for Trust Protection Platform
- `trustBundle` (String) - PEM certificate for self-signed servers
- `devMode` (Boolean) - Testing without live connections
- `skipRetirement` (Boolean) - Prevent automatic certificate retirement

**Environment Variables:** Corresponding `VENAFI_*` variables available for all config options.

## Key Resources

- `venafi.Certificate` - Generate key pairs and request certificates from Venafi services

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as venafi from "@pulumi/venafi";

const webserver = new venafi.Certificate("webserver", {
  commonName: "web.example.com",
  sanDns: ["web01.example.com", "web02.example.com"],
  algorithm: "RSA",
  rsaBits: 2048,
});
```
