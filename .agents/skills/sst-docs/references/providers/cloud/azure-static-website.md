# Azure Static Website

> Source: https://www.pulumi.com/registry/packages/azure-static-website
> Package: `azure-static-website`
> SST Install: `sst add azure-static-website`

## Overview

The Azure Static Website package is a Pulumi component that streamlines deploying static websites to Azure. It abstracts the complexity of configuring Azure resources needed for static site hosting, with CDN support and custom domain integration.

- **Current Version:** v0.0.5
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-azure-static-website](https://github.com/pulumi/pulumi-azure-static-website)

## Configuration

### Input Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `sitePath` | string | Yes | Root directory containing website contents |
| `withCDN` | boolean | No | Provision CDN for content distribution |
| `error404` | string | No | Default 404 error page file |
| `index.html` | string | No | Default document (defaults to `index.html`) |
| `domainResourceGroup` | string | No | Resource group for your domain |
| `dnsZoneName` | string | No | Azure DNS zone name for custom domain |
| `subdomain` | string | No | Subdomain (uses apex domain if omitted) |

### Output Properties

| Property | Description |
|----------|-------------|
| `originURL` | Storage URL for the site |
| `cdnURL` | CDN endpoint URL |
| `customDomainURL` | Custom domain access point |
| `resourceGroupName` | Provisioned resource group name |

## Key Resources

### Website

The primary component that creates:

- Azure Storage Account with static website hosting
- CDN endpoint (optional)
- DNS records for custom domain (optional)

### Important Notes

- Custom domain serving requires configuring an Azure DNS zone
- HTTPS setup for root domains requires manual configuration
- Manual CNAME record deletion is necessary before destroying the site

## Example

```typescript
import * as website from "@pulumi/azure-static-website";

const site = new website.Website("site", {
  sitePath: "./site",
});

export const originURL = site.originURL;
```

```yaml
resources:
  site:
    type: azure-static-website:index:Website
    properties:
      sitePath: ./site
outputs:
  originURL: ${site.originURL}
```

### With CDN and Custom Domain

```typescript
const site = new website.Website("site", {
  sitePath: "./site",
  withCDN: true,
  dnsZoneName: "example.com",
  domainResourceGroup: "my-dns-rg",
  subdomain: "www",
});

export const cdnURL = site.cdnURL;
export const customDomainURL = site.customDomainURL;
```
