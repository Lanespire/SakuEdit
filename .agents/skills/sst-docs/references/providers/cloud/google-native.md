# Google Cloud Native

> Source: https://www.pulumi.com/registry/packages/google-native/
> Package: `google-native`
> SST Install: `sst add google-native`

## Overview

The Google Cloud Native provider enables infrastructure provisioning across many of the cloud resources available in Google Cloud. It provides auto-generated resources based on the Google Cloud API discovery documents.

- **Current Version:** v0.32.0
- **Status:** Developer Preview (active development paused; breaking changes may occur in minor version releases)
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-google-native](https://github.com/pulumi/pulumi-google-native)
- **Languages:** TypeScript/JavaScript, Python, Go, C#, YAML

**Important Note:** Google Cloud Classic (`@pulumi/gcp`) remains the fully supported alternative recommended for production deployments.

## Configuration

The provider requires Google Cloud credential setup before deploying resources. Configuration is handled through standard Google Cloud authentication methods:

- Service Account JSON key file
- Application Default Credentials (ADC)
- Workload Identity Federation
- `project` configuration parameter is required

## Key Resources

The provider covers a wide range of Google Cloud services including but not limited to:

- **Storage** - Buckets, Objects (via `google-native/storage/v1`)
- **Compute** - Instances, Networks, Firewalls (via `google-native/compute/v1`)
- **Container** - GKE clusters (via `google-native/container/v1`)
- **CloudFunctions** - Serverless functions
- **BigQuery** - Data warehouse resources
- **IAM** - Identity and access management

Resources are versioned by API version (e.g., `v1`, `v1beta1`).

## Example

```typescript
import * as storage from "@pulumi/google-native/storage/v1";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config("google-native");
const project = config.require("project");

const bucket = new storage.Bucket("my-bucket", {
  name: "pulumi-goog-native-ts-01",
  bucket: "pulumi-goog-native-ts-01",
  project: project,
});

export const bucketName = bucket.selfLink;
```

```python
from pulumi_google_native.storage import v1 as storage
import pulumi

config = pulumi.Config()
project = config.require("project")

bucket = storage.Bucket("my-bucket",
    name="pulumi-goog-native-bucket-py-01",
    bucket="pulumi-goog-native-bucket-py-01",
    project=project,
)

pulumi.export("bucket", bucket.self_link)
```

```yaml
config:
  google-native:project:
    type: string
resources:
  my-bucket:
    type: google-native:storage/v1:Bucket
    properties:
      name: pulumi-goog-native-yaml-01
      bucket: pulumi-goog-native-yaml-01
      project: ${google-native:project}
outputs:
  bucketName: ${my-bucket.selfLink}
```
