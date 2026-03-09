# Splunk

> Source: https://www.pulumi.com/registry/packages/splunk
> Package: `splunk`
> SST Install: `sst add splunk`

## Overview

The Splunk provider enables interaction with resources supported by Splunk Enterprise and Splunk Cloud. Splunk is a platform for searching, monitoring, and analyzing machine-generated data. This provider allows you to manage Splunk configurations, indexes, inputs, saved searches, and other resources through infrastructure as code.

## Configuration

### Environment Variables

- `SPLUNK_URL` - The Splunk instance endpoint (required)
- `SPLUNK_USERNAME` - Username for authentication (optional)
- `SPLUNK_PASSWORD` - Password for authentication (optional)
- `SPLUNK_AUTH_TOKEN` - Bearer token authentication (optional, takes priority over username/password)
- `SPLUNK_INSECURE_SKIP_VERIFY` - Skip SSL verification (defaults to `true`)
- `SPLUNK_TIMEOUT` - Request timeout in seconds (defaults to `60`)

### Pulumi Config

```yaml
config:
  splunk:url:
    value: 'localhost:8089'
  splunk:username:
    value: 'admin'
  splunk:password:
    value: 'changeme'
  splunk:insecureSkipVerify:
    value: true
```

## Key Resources

- **InputsHttpEventCollector** - HTTP Event Collector (HEC) inputs
- **InputsMonitor** - File/directory monitoring inputs
- **InputsTcpRaw** / **InputsTcpCooked** - TCP data inputs
- **InputsUdp** - UDP data inputs
- **IndexesManager** - Index management
- **SavedSearches** - Saved search configurations
- **OutputsTcpDefault** / **OutputsTcpServer** - Forwarding outputs
- **ConfigsConf** - Configuration file management
- **AdminSamlGroups** - SAML group management
- **AuthorizationRoles** - Role-based access control

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as splunk from "@pulumi/splunk";

// Create an HTTP Event Collector input
const hec = new splunk.InputsHttpEventCollector("my-hec", {
  name: "my-hec-token",
  index: "main",
  indexes: ["main", "summary"],
  sourcetype: "httpevent",
  disabled: false,
  useAck: 0,
});

// Create a saved search
const savedSearch = new splunk.SavedSearches("error-search", {
  name: "Error Rate Monitor",
  search: "index=main sourcetype=app ERROR | stats count by host",
  isScheduled: true,
  cronSchedule: "*/15 * * * *",
});
```
