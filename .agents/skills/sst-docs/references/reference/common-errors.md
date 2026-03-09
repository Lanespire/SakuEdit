# Common Errors

> Source: https://sst.dev/docs/common-errors/

## Overview

This documentation page catalogs frequent issues developers encounter while using SST. Error messages in the CLI reference this guide directly.

---

## TooManyCacheBehaviors

**Error Message:**

> "TooManyCacheBehaviors: Your request contains more CacheBehaviors than are allowed per distribution"

### Affected Components

This issue commonly impacts `SvelteKit`, `SolidStart`, `Nuxt`, and `Analog` components.

### Root Cause

CloudFront distributions enforce a strict **25 cache behaviors maximum per distribution**. Each top-level asset (file or directory) in your frontend's asset directory generates an individual cache behavior.

### Example Problem Structure

For a SvelteKit project with assets in `static/`:

```
static/
├── icons/       # Creates cache behavior
└── logo.png     # Creates cache behavior
```

Multiple top-level items quickly consume the limit.

### Solutions

#### Option 1: Request Limit Increase

Contact AWS Support to request a higher cache behavior limit for your CloudFront distribution.

#### Option 2: Restructure Assets

Consolidate top-level assets into subdirectories. This approach reduces cache behaviors since nested items within a single directory create only one behavior.

**Restructured Example:**

```
static/
└── images/      # Single cache behavior
    ├── icons/
    └── logo.png
```

### Reference Materials

Learn more about CloudFront limitations in the [AWS CloudFront Limits documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html#limits-web-distributions).
