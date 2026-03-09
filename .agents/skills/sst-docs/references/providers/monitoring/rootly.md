# Rootly

> Source: https://www.pulumi.com/registry/packages/rootly
> Package: `@rootly/pulumi`
> SST Install: `sst add @rootly/pulumi`

## Overview

The Rootly provider for Pulumi can be used to provision resources available in Rootly. Rootly is an incident management platform that helps teams automate incident response workflows, define severity levels, manage services, track incident causes, and coordinate resolution across teams. It integrates with tools like Slack, PagerDuty, and Jira for end-to-end incident lifecycle management.

## Configuration

### Environment Variables

- `ROOTLY_API_TOKEN` - Rootly API token (required, format: `cu_xxx`)

### Pulumi Config

```bash
pulumi config set rootly:apiToken cu_xxx --secret
```

**Important:** Always use the `--secret` flag when setting the API token to ensure it is encrypted.

## Key Resources

- **Severity** - Incident severity levels (SEV0, SEV1, etc.)
- **Service** - Service definitions for incident tracking
- **Functionality** - Feature/functionality definitions
- **Team** - Team management
- **WorkflowGroup** - Workflow grouping
- **WorkflowTask** - Automated workflow tasks
- **IncidentRole** - Incident role definitions
- **Cause** - Incident cause tracking
- **Environment** - Environment definitions
- **CustomField** - Custom field definitions for incidents

## Example

```typescript
import * as rootly from "@rootly/pulumi";

// Create severity levels
const sev0 = new rootly.Severity("sev0", {
  name: "SEV0",
  color: "#FF0000",
});

const sev1 = new rootly.Severity("sev1", {
  name: "SEV1",
  color: "#FFA500",
});

// Create a service
const elasticsearchProd = new rootly.Service("elasticsearch_prod", {
  name: "elasticsearch-prod",
  color: "#800080",
});

// Create a functionality
const addItemsToCart = new rootly.Functionality("add_items_to_cart", {
  name: "Add items to cart",
  color: "#FFFFFF",
});

// Create a team
const sre = new rootly.Team("sre", {
  name: "SRE Team",
  color: "#0000FF",
});
```
