# OpenSearch

> Source: https://sst.dev/docs/component/aws/open-search/

## Overview

The `OpenSearch` component integrates Amazon OpenSearch Service into SST applications. Provides managed search and analytics capabilities with configurable instance types, storage, and authentication.

**Pricing (default config):**
- Single-AZ (t3.small, on-demand + 10GB gp3 storage): ~$27/month

## Constructor

```typescript
new sst.aws.OpenSearch(name, args?, opts?)
```

**Parameters:**
- `name` - `string` - Component identifier
- `args?` - `OpenSearchArgs` - Configuration object
- `opts?` - `ComponentResourceOptions` - Pulumi resource options

## Props

### instance?

**Type:** `Input<string>`
**Default:** `"t3.small"`

The instance type for the OpenSearch domain.

### version?

**Type:** `Input<string>`
**Default:** `"OpenSearch_2.17"`

The OpenSearch engine version.

### username?

**Type:** `Input<string>`
**Default:** `"admin"`

Master user username.

### password?

**Type:** `Input<string>`
**Default:** Randomly generated

Master user password.

### storage?

**Type:** `Input<string>`
**Default:** `"10 GB"`

Storage limit for the domain. Format: `"${number} GB"` or `"${number} TB"`.

### dev?

**Type:** `Object`

Configure how this component works in `sst dev`. Connect to a local OpenSearch instance.

- `dev.url?` - `Input<string>` - Default: `"http://localhost:9200"`
- `dev.username?` - `Input<string>` - Default: inherits top-level username
- `dev.password?` - `Input<string>` - Default: inherits top-level password

### transform?

**Type:** `Object`

Customize underlying AWS resources:

- `transform.domain?` - `DomainArgs | function` - Customize the OpenSearch domain
- `transform.policy?` - `PolicyDocument | function` - Customize the domain policy

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `Output<string>` | Component identifier |
| `url` | `Output<string>` | The endpoint URL of the domain |
| `username` | `Output<string>` | Master user username |
| `password` | `Output<string>` | Master user password |
| `nodes` | `Object` | Underlying Pulumi resources |
| `nodes.domain` | `Domain \| undefined` | OpenSearch Domain resource |

## Methods

### static get(name, id, opts?)

Reference an existing OpenSearch domain by ARN. Useful for sharing domains across stages.

```typescript
static get(name: string, id: Input<string>, opts?: ComponentResourceOptions): OpenSearch
```

## Links

When linked, the following properties are accessible via the `Resource` object in the SDK:

- `url` - `string` - Domain endpoint URL
- `username` - `string` - Master user username
- `password` - `string` - Master user password

## Examples

### Basic creation

```typescript
const search = new sst.aws.OpenSearch("MySearch");
```

### Link to a resource

```typescript
new sst.aws.Nextjs("MyWeb", {
  link: [search]
});
```

### Connect in application code

```typescript
import { Resource } from "sst";
import { Client } from "@opensearch-project/opensearch";

const client = new Client({
  node: Resource.MySearch.url,
  auth: {
    username: Resource.MySearch.username,
    password: Resource.MySearch.password
  }
});
```

### Local development configuration

```typescript
const opensearch = new sst.aws.OpenSearch("MyOpenSearch", {
  dev: {
    url: "http://localhost:9200",
    username: "admin",
    password: "^Passw0rd^"
  }
});
```

### Cross-stage sharing

```typescript
const search = $app.stage === "frank"
  ? sst.aws.OpenSearch.get("MyOpenSearch", "arn:aws:es:us-east-1:123456789012:domain/my-domain")
  : new sst.aws.OpenSearch("MyOpenSearch");
```
