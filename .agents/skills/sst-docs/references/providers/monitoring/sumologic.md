# Sumo Logic

> Source: https://www.pulumi.com/registry/packages/sumologic
> Package: `sumologic`
> SST Install: `sst add sumologic`

## Overview

The Sumo Logic provider manages resources supported by Sumo Logic, a cloud-native machine data analytics platform that provides real-time continuous intelligence from structured, semi-structured, and unstructured data. This provider enables you to configure collectors, sources, dashboards, and alerting through infrastructure as code.

**Note:** The previous `@pulumi/sumologic` package is no longer maintained. Install via `pulumi package add terraform-provider sumologic/sumologic`.

## Configuration

### Environment Variables

- `SUMOLOGIC_ACCESSID` - Sumo Logic Access ID (required)
- `SUMOLOGIC_ACCESSKEY` - Sumo Logic Access Key (required)
- `SUMOLOGIC_ENVIRONMENT` - API endpoint designation, e.g., `us2` (required)

### Pulumi Config

```yaml
config:
  sumologic:accessId:
    value: 'your-access-id'
  sumologic:accessKey:
    value: 'your-access-key'
  sumologic:environment:
    value: 'us2'
```

## Key Resources

- **Collector** - Hosted and installed collectors
- **CloudfrontSource** - AWS CloudFront log source
- **CloudtrailSource** - AWS CloudTrail log source
- **ElbSource** - AWS ELB log source
- **S3Source** / **S3AuditSource** - AWS S3 log sources
- **HttpSource** - HTTP log/metric source
- **Dashboard** - Dashboard management
- **Monitor** / **MonitorFolder** - Alert monitors
- **Field** / **FieldExtractionRule** - Field management
- **Role** / **User** - Access management
- **Content** - Content library management

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as sumologic from "@pulumi/sumologic";

// Create a hosted collector
const collector = new sumologic.Collector("collector", {
  name: "my-collector",
  description: "Production log collector",
});

// Create an HTTP source
const httpSource = new sumologic.HttpSource("http-source", {
  name: "my-http-source",
  collectorId: collector.id,
  category: "prod/app/logs",
});
```
