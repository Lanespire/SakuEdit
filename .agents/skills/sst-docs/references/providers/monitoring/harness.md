# Harness

> Source: https://www.pulumi.com/registry/packages/harness
> Package: `harness`
> SST Install: `sst add harness`

## Overview

The Harness provider enables infrastructure-as-code management for Harness resources through Pulumi. Harness is a software delivery platform that provides continuous integration, continuous delivery, feature flags, cloud cost management, and service reliability management. The provider supports both FirstGen and NextGen Harness platforms, allowing developers to provision and manage Harness configurations programmatically.

## Configuration

### Environment Variables

- `HARNESS_ACCOUNT_ID` - Your Harness account identifier (required)
- `HARNESS_API_KEY` - API key for FirstGen resources
- `HARNESS_PLATFORM_API_KEY` - API key for NextGen resources
- `HARNESS_ENDPOINT` - Custom API endpoint (defaults to `https://app.harness.io/gateway`)

### Pulumi Config

```yaml
config:
  harness:accountId:
    value: 'your-account-id'
  harness:platformApiKey:
    value: 'your-platform-api-key'
  harness:endpoint:
    value: 'https://app.harness.io/gateway'
```

## Key Resources

### NextGen (platform module)

- **platform.Project** - Project management
- **platform.Organization** - Organization management
- **platform.Pipeline** - CI/CD pipeline definitions
- **platform.Service** - Service definitions
- **platform.Environment** - Environment configurations
- **platform.Connector** - Connectors (Git, Docker, Kubernetes, AWS, GCP, etc.)
- **platform.Secret** - Secret management
- **platform.UserGroup** - User group management
- **platform.RoleAssignment** - Role-based access control
- **platform.MonitoredService** - Service reliability monitoring

### FirstGen

- **Application** - Application definitions
- **Environment** - Environment configurations
- **Service** - Service definitions
- **CloudProvider** - Cloud provider connectors

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as harness from "@pulumi/harness";

// Create an organization
const org = new harness.platform.Organization("my-org", {
  identifier: "my_org",
  name: "My Organization",
});

// Create a project
const project = new harness.platform.Project("my-project", {
  identifier: "my_project",
  name: "My Project",
  orgId: org.identifier,
});

// Create a Kubernetes connector
const k8sConnector = new harness.platform.ConnectorKubernetes("k8s", {
  identifier: "k8s_cluster",
  name: "K8s Cluster",
  orgId: org.identifier,
  projectId: project.identifier,
  inheritFromDelegate: {
    delegateSelectors: ["my-delegate"],
  },
});

// Create a monitored service
const monitoredService = new harness.platform.MonitoredService("my-service", {
  orgId: org.identifier,
  projectId: project.identifier,
  identifier: "my_service",
  serviceRef: "my_svc_ref",
  environmentRef: "my_env_ref",
  type: "Application",
});
```
