# SST Global Reference

> Source: https://sst.dev/docs/reference/global/

## Overview

The Global library provides `$` functions and variables accessible within the `run` function of `sst.config.ts`. These utilities manage app context and component outputs without requiring explicit imports.

**Key Note:** The Global library is only available in the `run` function of your `sst.config.ts`.

---

## Variables

### $app

An object containing deployment context:

- **name** (`string`): Current app identifier
- **stage** (`string`): Active deployment stage for conditional resource creation
- **protect** (`boolean`): Prevents `sst remove` execution when true
- **removal** (`string`): Removal policy -- "remove", "retain", or "retain-all" (defaults to "retain")
- **providers** (`object`): Currently configured providers

### $dev

A boolean indicator returning `true` during `sst dev` execution.

### $util

Convenience reference to Pulumi's utility module, enabling asset creation without direct SDK installation.

---

## Functions

### $asset(assetPath)

Converts files or directories into Pulumi assets for resource deployment. Directories are automatically zipped; files are returned as-is. Paths resolve relative to the app root.

**Returns:** `FileArchive` or `FileAsset`

### $concat(params)

Concatenates Output values and plain values into stringified results, handling Output resolution automatically.

**Returns:** `Output<string>`

### $interpolate(literals, placeholders)

Enables template string interpolation on Output values without manual resolution.

**Returns:** `Output<string>`

**Example:**

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
const description = $interpolate`This is bucket ${bucket.name}`;
```

### $jsonParse(text, reviver?)

Converts Output values or strings into JSON objects using `JSON.parse`.

**Returns:** `Output<any>`

### $jsonStringify(obj, replacer?, space?)

Serializes Output values or objects to JSON strings using `JSON.stringify`.

**Returns:** `Output<string>`

### $resolve(val)

Waits for multiple Output values to resolve before applying a function.

**Returns:** `Output<Record>`

**Example:**

```typescript
$resolve({ bucketName: bucket.name, tableName: table.name }).apply(({ bucketName, tableName }) => {
  // Use resolved values
});
```

### $transform(resource, cb)

Registers a callback for component instantiation, enabling global default configuration. The callback receives arguments, options, and component name.

**Note:** Only applies to components created after registration.

**Example:**

```typescript
$transform(sst.aws.Function, (args, opts) => {
  args.runtime = "nodejs20.x";
  args.memory = "512 MB";
});
```

---

## AWS Utilities

### iamEdit(policy, cb)

Modifies AWS IAM policy documents in a type-safe manner. The IAM policy document is normally in the form of a JSON string. The helper decodes and passes it to a callback for modification.

**Returns:** `Output<string>`

**Example:**

```typescript
iamEdit(role.assumeRolePolicy, (policy) => {
  policy.Statement.push({
    Effect: "Allow",
    Principal: { Service: "lambda.amazonaws.com" },
    Action: "sts:AssumeRole"
  });
});
```
