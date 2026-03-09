# Strata Cloud Manager (SCM)

> Source: https://www.pulumi.com/registry/packages/scm
> Package: `scm`
> SST Install: `sst add scm`

## Overview

The SCM provider enables management of Palo Alto Networks' Strata Cloud Manager infrastructure, covering NGFW and Prisma Access functionality. It manages and queries Strata Cloud Manager resources for network security configurations.

**Note:** This is a pre-release/beta provider and may be substantially modified or withdrawn.

## Configuration

Required settings:

- **clientId** (String) - OAuth client identifier (env: `SCM_CLIENT_ID`)
- **clientSecret** (String, sensitive) - OAuth credential (env: `SCM_CLIENT_SECRET`)
- **host** (String) - API endpoint hostname (default: `api.sase.paloaltonetworks.com`)
- **authUrl** (String) - Token endpoint (default: `https://auth.apps.paloaltonetworks.com/auth/v1/oauth2/access_token`)
- **scope** (String) - Client scope for authentication

Optional: `authFile`, `headers`, `logging`, `port`, `protocol`

Priority order: static provider config > environment variables > JSON config file.

## Key Resources

- **Networking** - Ethernet interfaces, VLAN interfaces, tunnel interfaces, loopback interfaces
- **Security Rules** - Security rules, NAT rules, decryption rules, QoS rules
- **Profiles** - Decryption profiles, vulnerability protection, antispyware, file blocking
- **Infrastructure** - Zones, logical routers, service connections, IKE gateways, BGP routing
- **Settings** - General settings, VPN settings, session settings, bandwidth allocation

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as scm from "@pulumi/scm";

// Configuration via Pulumi.yaml:
// scm:clientId: "your-client-id"
// scm:clientSecret: "your-client-secret"
// scm:host: "api.sase.paloaltonetworks.com"
```
