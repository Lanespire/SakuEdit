# Dynamo

> Source: https://sst.dev/docs/component/aws/dynamo/

## Overview

The `Dynamo` component adds an Amazon DynamoDB table to your app. It provides a managed way to create and configure DynamoDB tables with support for global/local indexes, streams, and TTL.

## Constructor

```typescript
new sst.aws.Dynamo(name, args, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args` (DynamoArgs) - Configuration object (required)
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### Required

#### fields
- **Type:** `Input<Record<string, "string" | "number" | "binary">>`
- **Description:** Object defining table fields used for indexes. Only `string`, `number`, and `binary` types work for indexes, though other field types can exist in items. Field types cannot be changed after creation.

#### primaryIndex
- **Type:** `Input<Object>`
- **Description:** Defines the table's primary index (only one allowed).
  - `hashKey` (string) - Required. Partition key field name.
  - `rangeKey?` (string) - Optional. Sort key field name.

### Optional

#### deletionProtection
- **Type:** `Input<boolean>`
- **Description:** Prevents table deletion when enabled.

#### globalIndexes
- **Type:** `Input<Record<string, Input<Object>>>`
- **Description:** Up to 20 global secondary indexes per table. Each index has:
  - `hashKey` (string) - Required. Partition key.
  - `rangeKey?` (string) - Optional. Sort key.
  - `projection?` (`"all"` | `"keys-only"` | `string[]`) - Default: `"all"`. Fields to project into the index.

#### localIndexes
- **Type:** `Input<Record<string, Input<Object>>>`
- **Description:** Up to 5 local secondary indexes per table. Uses same hashKey as primaryIndex. Each index has:
  - `rangeKey` (string) - Required. Sort key.
  - `projection?` (`"all"` | `"keys-only"` | `string[]`) - Default: `"all"`. Fields to project.

#### stream
- **Type:** `"keys-only"` | `"new-image"` | `"old-image"` | `"new-and-old-images"`
- **Default:** Disabled
- **Description:** Enables DynamoDB Streams. Captures modifications and sends to subscriber functions.

#### ttl
- **Type:** `Input<string>`
- **Description:** Field name to store TTL timestamp (number type). Items are deleted when TTL is reached.

#### transform
- **Type:** `Object`
- **Description:** Allows customization of underlying DynamoDB Table resource.
  - `table`: Customize the DynamoDB Table

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `arn` | `Output<string>` | The ARN of the DynamoDB Table |
| `name` | `Output<string>` | The name of the DynamoDB Table |
| `nodes.table` | DynamoDB Table | The underlying AWS DynamoDB Table resource |

## Methods

### subscribe(name, subscriber, args?)

Subscribe to DynamoDB Stream (requires `stream` to be enabled).

- `name` (string) - Subscriber name
- `subscriber` (string | FunctionArgs | Lambda ARN) - Handler function
- `args?` (DynamoSubscriberArgs):
  - `filters?` - Array of filter policies (up to 5). Filters records by DynamoDB keys/attributes.
  - `transform?` - Object with optional `eventSourceMapping` for customizing Lambda Event Source Mapping

**Returns:** `Output<DynamoLambdaSubscriber>`

### static get(name, tableName, opts?)

Reference an existing DynamoDB Table by name. Useful for sharing tables across stages.

- `name` (string) - Component name
- `tableName` (`Input<string>`) - Existing table name
- `opts?` (ComponentResourceOptions)

**Returns:** `Dynamo` instance

### static subscribe(name, streamArn, subscriber, args?)

Subscribe to DynamoDB stream of externally-created table.

- `name` (string) - Subscriber name
- `streamArn` (`Input<string>`) - Stream ARN
- `subscriber` (string | FunctionArgs | Lambda ARN) - Handler function
- `args?` (DynamoSubscriberArgs)

**Returns:** `Output<DynamoLambdaSubscriber>`

## Links

When linked to other resources, the Dynamo exposes:
- `name` (string) - The name of the DynamoDB Table

Access via the SST SDK:
```typescript
import { Resource } from "sst";
console.log(Resource.MyTable.name);
```

## Examples

### Minimal table creation
```typescript
const table = new sst.aws.Dynamo("MyTable", {
  fields: {
    userId: "string",
    noteId: "string"
  },
  primaryIndex: {
    hashKey: "userId",
    rangeKey: "noteId"
  }
});
```

### With global index
```typescript
new sst.aws.Dynamo("MyTable", {
  fields: {
    userId: "string",
    noteId: "string",
    createdAt: "number"
  },
  primaryIndex: {
    hashKey: "userId",
    rangeKey: "noteId"
  },
  globalIndexes: {
    CreatedAtIndex: {
      hashKey: "userId",
      rangeKey: "createdAt"
    }
  }
});
```

### With local index
```typescript
new sst.aws.Dynamo("MyTable", {
  fields: {
    userId: "string",
    noteId: "string",
    createdAt: "number"
  },
  primaryIndex: {
    hashKey: "userId",
    rangeKey: "noteId"
  },
  localIndexes: {
    CreatedAtIndex: {
      rangeKey: "createdAt"
    }
  }
});
```

### Enable streams and subscribe
```typescript
const table = new sst.aws.Dynamo("MyTable", {
  fields: {
    userId: "string",
    noteId: "string"
  },
  primaryIndex: {
    hashKey: "userId",
    rangeKey: "noteId"
  },
  stream: "new-and-old-images"
});

table.subscribe("MySubscriber", "src/subscriber.handler");
```

### Subscribe with filter
```typescript
table.subscribe("MySubscriber", "src/subscriber.handler", {
  filters: [{
    dynamodb: {
      Keys: {
        CustomerName: {
          S: ["AnyCompany Industries"]
        }
      }
    }
  }]
});
```

### Enable TTL
```typescript
new sst.aws.Dynamo("MyTable", {
  fields: {
    userId: "string",
    noteId: "string"
  },
  primaryIndex: {
    hashKey: "userId",
    rangeKey: "noteId"
  },
  ttl: "expireAt"
});
```

### Link to Next.js app
```typescript
const table = new sst.aws.Dynamo("MyTable", {
  fields: {
    userId: "string",
    noteId: "string"
  },
  primaryIndex: {
    hashKey: "userId",
    rangeKey: "noteId"
  }
});

new sst.aws.Nextjs("MyWeb", {
  link: [table]
});
```

### Query linked table
```typescript
import { Resource } from "sst";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient();
await client.send(new QueryCommand({
  TableName: Resource.MyTable.name,
  KeyConditionExpression: "userId = :userId",
  ExpressionAttributeValues: {
    ":userId": { S: "my-user-id" }
  }
}));
```

### Share table across stages
```typescript
const table = $app.stage === "frank"
  ? sst.aws.Dynamo.get("MyTable", "app-dev-mytable")
  : new sst.aws.Dynamo("MyTable", {
      fields: {
        userId: "string",
        noteId: "string"
      },
      primaryIndex: {
        hashKey: "userId",
        rangeKey: "noteId"
      }
    });
```

### Subscribe to external table stream
```typescript
const streamArn = "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable/stream/2024-01-01T00:00:00.000";
sst.aws.Dynamo.subscribe("MySubscriber", streamArn, "src/subscriber.handler");
```
