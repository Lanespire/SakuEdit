# Random

> Source: https://www.pulumi.com/registry/packages/random
> Package: `random`
> SST Install: `sst add random`

## Overview

The Random provider allows the use of randomness within Pulumi configurations. It is a logical provider that generates random values during resource creation and maintains those values until inputs change. The provider uses resource "keepers" -- optional map arguments containing arbitrary key/value pairs that determine when new random values should be generated.

**Important:** This provider's results are NOT sufficiently random for cryptographic use.

## Configuration

No provider-level configuration is required. Randomness is controlled through resource-level `keepers` properties.

## Key Resources

- `random.RandomId` - Generate random base64/hex IDs
- `random.RandomString` - Generate random strings with character constraints
- `random.RandomPassword` - Generate random passwords (marked sensitive)
- `random.RandomInteger` - Generate random integers within a range
- `random.RandomUuid` - Generate random UUIDs
- `random.RandomPet` - Generate random pet names
- `random.RandomShuffle` - Produce a random permutation of a list

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

const server = new random.RandomId("server", {
  keepers: {
    ami_id: amiId,
  },
  byteLength: 8,
});

const serverInstance = new aws.ec2.Instance("server", {
  tags: {
    Name: pulumi.interpolate`web-server ${server.hex}`,
  },
  ami: server.keepers.apply(keepers => keepers?.amiId),
});
```
