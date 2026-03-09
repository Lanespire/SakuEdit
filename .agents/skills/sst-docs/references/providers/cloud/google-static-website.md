# Google Cloud Static Website

> Source: https://www.pulumi.com/registry/packages/google-cloud-static-website/
> Package: `google-cloud-static-website`
> SST Install: `sst add google-cloud-static-website`

## Overview

The Google Cloud Static Website component simplifies deploying static websites to Google Cloud using Pulumi's infrastructure-as-code approach. Supports optional Google Cloud CDN and custom domains.

- **Current Version:** v0.0.3
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-google-cloud-static-website](https://github.com/pulumi/pulumi-google-cloud-static-website)

## Configuration

### Input Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `sitePath` | string | Yes | Root directory containing website contents |
| `withCDN` | boolean | No | Enable Google Cloud CDN for content delivery |
| `error404` | string | No | Default error page (defaults to `error.html`) |
| `index.html` | string | No | Default document (defaults to `index.html`) |
| `domain` | string | No | Website domain |
| `subdomain` | string | No | Subdomain for website access |

### Output Properties

| Property | Description |
|----------|-------------|
| `originURL` | Direct website URL via storage bucket endpoint |
| `cdnURL` | CDN-served site URL |
| `customDomainURL` | Custom domain access point |

## Key Resources

### Website

The primary component that creates:

- Google Cloud Storage bucket with website hosting configuration
- Google Cloud CDN (optional)
- DNS records for custom domain (optional)
- SSL certificate (when CDN + domain configured)

### Important Notes

- SSL certificate provisioning requires 60-90 minutes after deployment
- During initial deployment, temporary certificate validity issues may occur when accessing via HTTPS

## Example

```typescript
import { Website } from "@pulumi/google-cloud-static-website";

const site = new Website("site", {
  sitePath: "./site",
});

export const originURL = site.originURL;
```

```yaml
resources:
  site:
    type: google-cloud-static-website:index:Website
    properties:
      sitePath: ./site
outputs:
  originURL: ${site.originURL}
```

### With CDN and Custom Domain

```typescript
const site = new Website("site", {
  sitePath: "./site",
  withCDN: true,
  domain: "example.com",
  subdomain: "www",
});

export const cdnURL = site.cdnURL;
export const customDomainURL = site.customDomainURL;
```
