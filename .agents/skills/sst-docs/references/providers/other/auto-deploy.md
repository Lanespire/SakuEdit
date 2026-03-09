# Auto Deploy

> Source: https://www.pulumi.com/registry/packages/auto-deploy
> Package: `auto-deploy`
> SST Install: `sst add auto-deploy`

## Overview

The Pulumi Auto Deploy package is a Pulumi Component for configuring automated updates of dependent stacks using Pulumi Deployments. It enables users to express stack dependencies and automatically creates the necessary Deployment Webhooks. When a stack is updated, it triggers automatic updates of all configured downstream stacks. Each configured stack requires Deployment Settings. Currently in preview.

## Configuration

No provider-level configuration is required. Requires Pulumi CLI installation and Pulumi Deployments to be enabled for the organization.

## Key Resources

- `auto-deploy.AutoDeployer` - Configure automatic deployment cascades between stacks
  - `organization` - Pulumi organization name
  - `project` - Project name
  - `stack` - Stack identifier
  - `downstreamRefs` - Array of dependent stack references

## Example

```typescript
import * as autodeploy from "@pulumi/auto-deploy";
import * as pulumi from "@pulumi/pulumi";

const organization = pulumi.getOrganization();
const project = "dependency-example";

export const deployer = new autodeploy.AutoDeployer("auto-deployer-a", {
  organization,
  project,
  stack: "a",
  downstreamRefs: [
    {
      organization,
      project,
      stack: "b",
    },
    {
      organization,
      project,
      stack: "c",
    },
  ],
});
```
