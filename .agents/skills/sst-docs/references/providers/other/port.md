# Port

> Source: https://www.pulumi.com/registry/packages/port
> Package: `@port-labs/port`
> SST Install: `sst add @port-labs/port`

## Overview

The Port Resource Provider enables management of Port resources through Pulumi. Port is an internal developer portal platform that lets you define blueprints and entities to model your software catalog.

## Configuration

Refer to the installation & configuration page for provider setup and authentication details.

## Key Resources

- **Blueprint** - Defines the structure and schema for entities, including property definitions and defaults
- **Entity** - Represents individual Port entities with properties like identifier, title, blueprint association, and custom properties

## Example

```typescript
import * as port from "@port-labs/port";

export const blueprint = new port.Blueprint("microservice", {
  identifier: "microservice",
  title: "Microservice",
  properties: {
    stringProps: {
      language: {
        default: "Go",
      },
    },
  },
});

export const entity = new port.Entity("monolith", {
  identifier: "monolith",
  title: "monolith",
  blueprint: blueprint.identifier,
  properties: {
    stringProps: {
      language: "Node",
    },
  },
});
```
