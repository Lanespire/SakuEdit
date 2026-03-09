# Time

> Source: https://www.pulumi.com/registry/packages/time
> Package: `@pulumiverse/time`
> SST Install: `sst add @pulumiverse/time`

## Overview

The Time provider is designed to interact with time-based resources. It enables managing time-based rotation schedules and date offset calculations within Pulumi infrastructure-as-code projects.

## Configuration

The provider has no configuration options. Simply instantiate it:

```typescript
const provider = new time.Provider("provider", {});
```

## Key Resources

- **Rotating** - Manages time-based rotation with configurable rotation days and trigger support
- **Offset** - Handles date offset calculations with offset days parameter

Both resources output time values in multiple formats (Unix timestamps, RFC3339 strings, and individual date components).

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as time from "@pulumiverse/time";

export = async () => {
  const config = new pulumi.Config();
  const timeTrigger = config.require("time-trigger");

  const provider = new time.Provider("provider", {});
  const rotating = new time.Rotating("rotating", {
    rotationDays: 30,
    triggers: { trigger1: timeTrigger },
  });
  const offset = new time.Offset("offset", { offsetDays: 7 });

  return {
    "rotating-output-unix": rotating.unix,
    "rotating-output-rfc3339": rotating.rfc3339,
    "offset-date": pulumi.interpolate`${offset.day}-${offset.month}-${offset.year}`,
  };
};
```
