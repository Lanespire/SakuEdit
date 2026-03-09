# Vector

> Source: https://sst.dev/docs/component/aws/vector/

## Overview

The `Vector` component enables storage and retrieval of vector data using a vector database powered by RDS Postgres Serverless v2. It provides an SDK for querying, storing, and removing vector data.

## Constructor

```typescript
new sst.aws.Vector(name, args, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args` (VectorArgs) - Configuration object (required)
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### Required

#### dimension
- **Type:** `Input<number>`
- **Maximum:** 2000
- **Description:** The dimension size of each vector. Changing the dimension will cause the data to be cleared.

### Optional

#### transform
- **Type:** `Object`
- **Description:** Transform how the component creates underlying resources.
  - `postgres`: `PostgresArgs` or transformation function

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `clusterID` | `Output<string>` | The ID of the RDS Postgres Cluster |
| `nodes.postgres` | Postgres | The underlying Postgres database instance |

## Methods

None on the component itself. Use the SDK client methods below.

## SDK: VectorClient

### VectorClient(name)

Creates a client to interact with the Vector database.

```typescript
import { VectorClient } from "sst";
const client = VectorClient("MyVectorDB");
```

**Returns:** `VectorClientResponse`

### VectorClientResponse Methods

#### put(event: PutEvent)

Store a vector into the database.

- **Returns:** `Promise<void>`
- **Parameters:**
  - `vector` (`number[]`) - The vector to store
  - `metadata` (`Record<string, any>`) - JSON metadata for filtering

```typescript
await client.put({
  vector: [32.4, 6.55, 11.2, 10.3, 87.9],
  metadata: { type: "movie", genre: "comedy" }
});
```

#### query(event: QueryEvent)

Query vectors that are similar to the given vector.

- **Returns:** `Promise<QueryResponse>`
- **Parameters:**
  - `vector` (`number[]`) - Vector used to query
  - `include` (`Record<string, any>`) - Metadata filter (required)
  - `exclude?` (`Record<string, any>`) - Metadata to exclude
  - `count?` (`number`) - Results to return (default: 10)
  - `threshold?` (`number`) - Similarity threshold 0-1 (default: 0)

```typescript
const result = await client.query({
  vector: [32.4, 6.55, 11.2, 10.3, 87.9],
  include: { type: "movie" },
  count: 5,
  threshold: 0.5
});
```

#### QueryResponse

```typescript
{
  results: Array<{
    metadata: Record<string, any>;
    score: number;  // Similarity score
  }>
}
```

#### remove(event: RemoveEvent)

Remove vectors from the database.

- **Returns:** `Promise<void>`
- **Parameters:**
  - `include` (`Record<string, any>`) - Metadata filter for removal

```typescript
await client.remove({
  include: { type: "movie" }
});
```

### static get(name, clusterID)

Reference an existing Vector database. Useful when you create a Vector database in one stage and want to share it in another.

- `name` (string) - Component name
- `clusterID` (`Input<string>`) - Existing cluster ID

**Returns:** `Vector` instance

## Links

When linked to other resources, the Vector exposes access to the underlying database. Use the `VectorClient` SDK to interact.

## Examples

### Create vector database
```typescript
const vector = new sst.aws.Vector("MyVectorDB", {
  dimension: 1536
});
```

### Link to resource
```typescript
const vector = new sst.aws.Vector("MyVectorDB", {
  dimension: 1536
});

new sst.aws.Nextjs("MyWeb", {
  link: [vector]
});
```

### Store vectors
```typescript
import { VectorClient } from "sst";

const client = VectorClient("MyVectorDB");

await client.put({
  vector: [32.4, 6.55, 11.2, 10.3, 87.9],
  metadata: { type: "movie", genre: "comedy" }
});
```

### Query vectors
```typescript
import { VectorClient } from "sst";

const result = await VectorClient("MyVectorDB").query({
  vector: [32.4, 6.55, 11.2, 10.3, 87.9],
  include: { type: "movie" },
  count: 10,
  threshold: 0.5
});

console.log(result.results);
```

### Remove vectors
```typescript
import { VectorClient } from "sst";

const client = VectorClient("MyVectorDB");

await client.remove({
  include: { type: "movie" }
});
```

### Share across stages
```typescript
const vector = $app.stage === "frank"
  ? sst.aws.Vector.get("MyVectorDB", "app-dev-myvectordb")
  : new sst.aws.Vector("MyVectorDB", {
      dimension: 1536
    });
```
