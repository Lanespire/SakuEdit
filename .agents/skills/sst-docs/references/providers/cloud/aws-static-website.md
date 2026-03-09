# AWS Static Website

> Source: https://www.pulumi.com/registry/packages/aws-static-website
> Package: `aws-static-website`
> SST Install: `sst add aws-static-website`

## Overview

This Pulumi component simplifies deploying static websites to AWS S3 with optional CloudFront distribution support. Compatible with TypeScript, YAML, JSON, and other Pulumi languages.

- **Current Version:** v0.4.0
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-aws-static-website](https://github.com/pulumi/pulumi-aws-static-website)

## Configuration

### Input Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `sitePath` | string | Yes | Root directory containing website contents |
| `withCDN` | boolean | No | Enables CloudFront CDN distribution |
| `targetDomain` | string | No | Domain for serving content (requires Route53 hosted zone) |
| `index.html` | string | No | Default document (defaults to `index.html`) |
| `error404` | string | No | Custom 404 error page |
| `certificateARN` | string | No | ACM certificate ARN for HTTPS (auto-created if omitted) |
| `cacheTTL` | number | No | Cache duration in seconds |
| `withLogs` | boolean | No | Creates S3 bucket for access logs |
| `priceClass` | number | No | CDN price class (defaults to 100) |

### Output Properties

| Property | Description |
|----------|-------------|
| `bucketName` | S3 bucket containing website contents |
| `bucketWebsiteURL` | S3 website endpoint URL |
| `cdnDomainName` | CloudFront domain (when CDN enabled) |
| `cdnURL` | CloudFront endpoint URL (when CDN enabled) |
| `logsBucketName` | S3 bucket for access logs (when logging enabled) |
| `websiteURL` | Primary website access URL |

## Key Resources

### Website

The primary component that creates:

- S3 bucket with website hosting configuration
- CloudFront distribution (optional)
- Route53 DNS records (when `targetDomain` is specified)
- ACM certificate (auto-provisioned if not provided)
- S3 logs bucket (optional)

## Example

```typescript
import * as staticwebsite from "@pulumi/aws-static-website";

const site = new staticwebsite.Website("website", {
  sitePath: "../website/build",
});

export const websiteURL = site.websiteURL;
```

```yaml
resources:
  web:
    type: "aws-static-website:index:Website"
    properties:
      sitePath: "../website/build"
outputs:
  websiteURL: ${web.websiteURL}
```

### With CDN and Custom Domain

```typescript
const site = new staticwebsite.Website("website", {
  sitePath: "../website/build",
  withCDN: true,
  targetDomain: "www.example.com",
  withLogs: true,
  cacheTTL: 600,
});
```
