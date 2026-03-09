# Stripe

> Source: https://github.com/georgegebbett/pulumi-stripe
> Package: `stripe`
> SST Install: `sst add stripe`

## Overview

The Stripe provider enables management of Stripe resources through Pulumi infrastructure-as-code. It is a bridged provider based on the Terraform Stripe provider by @lukasaron, allowing developers to define and manage Stripe products, prices, webhooks, and other resources programmatically.

## Configuration

**Pulumi.yaml:**
```yaml
config:
  stripe:apiKey:
    value: YOUR_STRIPE_API_KEY
```

**Environment Variable:**
```bash
export STRIPE_API_KEY="sk_test_..."
```

**Configuration Variables:**
- `apiKey` (String, required) - Stripe API key (env: `STRIPE_API_KEY`)

**Installation:**
```bash
npm install pulumi-stripe
# or
yarn add pulumi-stripe
# or
pnpm add pulumi-stripe
```

## Key Resources

- `stripe.Product` - Manage Stripe products
- `stripe.Price` - Manage pricing for products
- `stripe.WebhookEndpoint` - Configure webhook endpoints
- `stripe.Coupon` - Manage discount coupons
- `stripe.TaxRate` - Tax rate configuration

## Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as stripe from "pulumi-stripe";

const product = new stripe.Product("my-product", {
  name: "My Product",
  description: "A product managed by Pulumi",
});
```
