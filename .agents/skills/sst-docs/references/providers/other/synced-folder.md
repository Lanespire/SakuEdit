# Synced Folder

> Source: https://www.pulumi.com/registry/packages/synced-folder
> Package: `synced-folder`
> SST Install: `sst add synced-folder`

## Overview

The Synced Folder is a Pulumi component that synchronizes the contents of a local folder to any Amazon S3 bucket, Azure Blob Storage container, or Google Cloud Storage bucket. It simplifies publishing static content to cloud storage providers.

**Two management modes:**
- **Managed Objects** (default) - Files are managed as individual Pulumi cloud resources
- **Unmanaged Objects** (`managedObjects: false`) - Uses cloud provider CLIs (`aws s3 sync`, `az storage blob sync`, `gsutil rsync`)

## Configuration

No provider-level configuration is required. Cloud provider credentials (AWS, Azure, or GCP) must be configured separately.

## Key Resources

- `synced-folder.S3BucketFolder` - Sync local folder to Amazon S3 bucket
- `synced-folder.AzureBlobFolder` - Sync local folder to Azure Blob Storage
- `synced-folder.GoogleCloudFolder` - Sync local folder to Google Cloud Storage

## Example

```typescript
import * as aws from "@pulumi/aws";
import * as synced from "@pulumi/synced-folder";

const bucket = new aws.s3.Bucket("my-bucket", {
  acl: aws.s3.PublicReadAcl,
});

const folder = new synced.S3BucketFolder("synced-folder", {
  path: "./my-folder",
  bucketName: bucket.bucket,
  acl: aws.s3.PublicReadAcl,
});
```
