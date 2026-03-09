# SST SDK Reference

> Source: https://sst.dev/docs/reference/sdk/

## Overview

The SST SDK enables runtime code to interact with infrastructure in a type-safe manner. It works across functions, frontends, and container applications, providing access to linked component resources and specialized SDK clients.

**Current language support:** JavaScript/TypeScript, Python, Golang, and Rust. Additional languages are planned.

---

## Node.js

### Installation

```bash
npm install sst
```

### Accessing Linked Resources

Import `Resource` to retrieve linked infrastructure:

```typescript
import { Resource } from "sst";
console.log(Resource.MyBucket.name);
```

The `Resource` object provides type-safe autocomplete for available resources in your editor.

#### Example Configuration

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Function("MyFunction", {
  handler: "src/lambda.handler",
  link: [bucket]
});
```

### Default Resources

The `Resource` object automatically includes `Resource.App`:

- `App.name`: Application name
- `App.stage`: Current deployment stage

```typescript
import { Resource } from "sst";
console.log(Resource.App.name, Resource.App.stage);
```

### Component Clients

Certain components provide specialized clients. For example, `Realtime`:

```typescript
import { realtime } from "sst/aws/realtime";
export const handler = realtime.authorizer(async (token) => {
  // Validate the token
});
```

### Implementation Details

Resources are injected during `sst dev` and `sst deploy` operations. For functions, injection uses `globalThis` via esbuild. Frontends receive values through `process.env`. The SDK checks `process.env` first, then `globalThis`.

---

## Python

### Setup

SST uses [uv](https://docs.astral.sh/uv/) for Python function packaging. Functions must exist in a uv workspace.

Add the SDK to your `pyproject.toml`:

```toml
[tool.uv.sources]
sst = { git = "https://github.com/sst/sst.git", subdirectory = "sdk/python", branch = "dev" }
```

### Usage

```python
from sst import Resource
def handler(event, context):
    print(Resource.MyBucket.name)
```

### Configuration Example

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Function("MyFunction", {
  handler: "functions/src/functions/api.handler",
  runtime: "python3.11",
  link: [bucket]
});
```

**Note:** Client functions are not yet supported in Python.

---

## Golang

### Package Import

```go
import "github.com/sst/sst/v3/sdk/golang/resource"
```

### Accessing Resources

```go
resource.Get("MyBucket", "name")
```

### App Information

```go
resource.Get("App", "name")
resource.Get("App", "stage")
```

### Configuration Example

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
new sst.aws.Function("MyFunction", {
  handler: "./src",
  link: [bucket]
});
```

**Note:** Client functions are not supported in Go.

---

## Rust

### Dependencies

```toml
sst_sdk = "0.1.0"
```

### Type-Safe Access

```rust
use sst_sdk::Resource;

#[derive(serde::Deserialize, Debug)]
struct Bucket {
    name: String,
}

fn main() {
    let resource = Resource::init().unwrap();
    let Bucket { name } = resource.get("MyBucket").unwrap();
}
```

### Weak Typing

```rust
let openai_key: serde_json::Value = resource.get("OpenaiSecret").unwrap();
```

### Configuration Example

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
const openai = new sst.Secret("OpenaiSecret");

new sst.aws.Function("MyFunction", {
  handler: "./",
  link: [bucket, openai],
  runtime: "rust"
});
```

**Note:** Client functions are not supported in Rust.
