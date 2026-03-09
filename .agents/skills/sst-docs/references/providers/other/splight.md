# Splight

> Source: https://www.pulumi.com/registry/packages/splight
> Package: `@splightplatform/pulumi-splight`
> SST Install: `sst add @splightplatform/pulumi-splight`

## Overview

The Splight provider enables interaction with resources supported by the Splight platform. It allows infrastructure-as-code management of Splight assets and services, including assets with geographic data.

## Configuration

Refer to the installation & configuration page for provider setup and authentication details.

## Key Resources

- **Asset** - Create and manage Splight assets with name, description, and geographic geometry data (GeoJSON)

## Example

```typescript
import * as splight from "@splightplatform/pulumi-splight";

new splight.Asset("MyAsset", {
  name: "MyAsset",
  description: "My Asset Description",
  geometry: JSON.stringify({
    type: "GeometryCollection",
    geometries: [
      {
        type: "GeometryCollection",
        geometries: [
          {
            type: "Point",
            coordinates: [0, 0],
          },
        ],
      },
    ],
  }),
});
```
