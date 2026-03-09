# Event Store Cloud

> Source: https://www.pulumi.com/registry/packages/eventstorecloud/
> Package: `@eventstore/pulumi-eventstorecloud`
> SST Install: `sst add @eventstore/pulumi-eventstorecloud`

## Overview

The Event Store Cloud provider enables provisioning of resources available in Event Store Cloud. It uses the Event Store Cloud API to manage and provision resources such as projects and networks for event-sourced applications.

## Configuration

The provider must be configured with credentials before deploying resources. Refer to the installation & configuration page for credential setup.

## Key Resources

- **Project** - Create and manage Event Store Cloud projects
- **Network** - Establish network infrastructure within projects across cloud providers and regions

## Example

```typescript
import * as eventstore from "@eventstore/pulumi-eventstorecloud";

const project = new eventstore.Project("sample-project", {
  name: "Improved Chicken Window",
});

const network = new eventstore.Network("sample-network", {
  name: "Chicken Window Net",
  projectId: project.id,
  resourceProvider: "aws",
  region: "eu-west1",
  cidrBlock: "172.21.0.0/16",
});
```
