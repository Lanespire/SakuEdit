# Google Cloud Platform (GCP)

> Source: https://www.pulumi.com/registry/packages/gcp/
> Package: `gcp`
> SST Install: `sst add gcp`

## Overview

The GCP provider enables infrastructure provisioning across Google Cloud Platform services. It can provision many of the cloud resources available in Google Cloud, including compute, storage, networking, databases, serverless functions, Kubernetes, and more.

## Configuration

### Google Cloud CLI (Recommended for local development)

```bash
gcloud auth application-default login
pulumi config set gcp:project <your-gcp-project-id>
```

### Service Account

```bash
pulumi config set gcp:project <your-gcp-project-id>
pulumi config set gcp:credentials <path-to-service-account-key.json>
```

### Environment Variables

```bash
export GOOGLE_PROJECT=<your-gcp-project-id>
export GOOGLE_CREDENTIALS=<path-to-service-account-key.json>
export GOOGLE_REGION=us-central1
export GOOGLE_ZONE=us-central1-a
```

Alternative project environment variables: `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`, `CLOUDSDK_CORE_PROJECT`.

### Key Configuration Options

| Option | Description |
|--------|-------------|
| `project` | GCP project ID (required) |
| `region` | Default region for resources |
| `zone` | Default zone for resources |
| `credentials` | Path to service account JSON key file |
| `accessToken` | Temporary OAuth 2.0 access token |

### Advanced Authentication

- **OIDC**: Configure between Pulumi and GCP for dynamic credentials
- **Pulumi ESC**: Centralized environment configuration with automatic credential exposure

## Key Resources

- **Compute**: `gcp.compute.Instance`, `gcp.compute.Network`, `gcp.compute.Firewall`
- **Storage**: `gcp.storage.Bucket`, `gcp.storage.BucketObject`
- **Cloud Functions**: `gcp.cloudfunctions.Function`, `gcp.cloudfunctionsv2.Function`
- **Cloud Run**: `gcp.cloudrun.Service`
- **GKE**: `gcp.container.Cluster`, `gcp.container.NodePool`
- **BigQuery**: `gcp.bigquery.Dataset`, `gcp.bigquery.Table`
- **Cloud SQL**: `gcp.sql.DatabaseInstance`, `gcp.sql.Database`
- **Pub/Sub**: `gcp.pubsub.Topic`, `gcp.pubsub.Subscription`
- **IAM**: `gcp.serviceaccount.Account`, `gcp.projects.IAMBinding`
- **Firestore**: `gcp.firestore.Database`, `gcp.firestore.Document`

## Example

```typescript
import * as gcp from "@pulumi/gcp";

// Create a Cloud Storage bucket
const bucket = new gcp.storage.Bucket("my-bucket", {
  location: "US",
  uniformBucketLevelAccess: true,
});

// Create a Cloud Function
const fn = new gcp.cloudfunctionsv2.Function("myFunction", {
  location: "us-central1",
  buildConfig: {
    runtime: "nodejs20",
    entryPoint: "handler",
    source: {
      storageSource: {
        bucket: bucket.name,
        object: "function-source.zip",
      },
    },
  },
  serviceConfig: {
    maxInstanceCount: 1,
    availableMemory: "256M",
  },
});

export const bucketName = bucket.name;
export const functionUrl = fn.serviceConfig.apply(sc => sc?.uri);
```
