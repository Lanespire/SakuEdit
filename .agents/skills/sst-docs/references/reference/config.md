# SST Config Reference

> Source: https://sst.dev/docs/reference/config/

## Overview

The `sst.config.ts` file configures your SST app and its resources using the `$config` function, which accepts a `Config` object containing three main parts: `app`, `run`, and optionally `console`.

## Config Structure

### Basic Example

```typescript
export default $config({
  app(input) {
    return {
      name: "my-sst-app",
      home: "aws"
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket("MyBucket");
    return {
      bucket: bucket.name
    };
  },
  console: {
    autodeploy: {
      runner: { compute: "large" }
    }
  }
});
```

## Config Properties

### `app(input)` - Required

Returns an `App` object defining your application configuration. Evaluated when the app loads. Cannot contain component or resource definitions.

**Parameters:**

- `input: AppInput` - Contains the current stage

**Returns:** `App` object or Promise

**Example:**

```typescript
app(input) {
  return {
    name: "my-sst-app",
    home: "aws",
    providers: {
      aws: true,
      cloudflare: {
        accountId: "6fef9ed9089bb15de3e4198618385de2"
      }
    },
    removal: input.stage === "production" ? "retain" : "remove"
  };
}
```

### `run()` - Required

Async function defining your application resources using SST and Pulumi components. Optionally returns an object displayed as CLI output and written to `.sst/outputs.json`.

**Example:**

```typescript
async run() {
  const bucket = new sst.aws.Bucket("MyBucket");
  return {
    bucket: bucket.name
  };
}
```

### `console?` (Optional)

Configures how your app integrates with the SST Console. Contains autodeploy settings for automatic deployments when pushing to your repository.

#### `console.autodeploy`

Enables automatic deployments using AWS CodeBuild. Includes three optional customization functions:

- **`target(event)`** - Determines which stage receives the deployment based on git events
- **`runner(stage)`** - Configures build machine specifications
- **`workflow({ $, event })`** - Defines custom build commands

**Default behavior:**

- Branches deploy to sanitized branch name stages
- Pull requests deploy to `pr-<number>` stages
- Tags don't auto-deploy by default
- Uses medium compute, x86_64 architecture, 1-hour timeout

**Runner Configuration Example:**

```typescript
runner: {
  engine: "codebuild",
  architecture: "x86_64",
  compute: "medium",
  timeout: "1 hour",
  cache: {
    paths: ["node_modules"]
  },
  vpc: {
    id: "vpc-xxx",
    subnets: ["subnet-xxx"],
    securityGroups: ["sg-xxx"]
  }
}
```

**Custom Workflow Example:**

```typescript
async workflow({ $, event }) {
  await $`npm i -g pnpm`;
  await $`pnpm i`;
  await $`pnpm test`;
  event.action === "removed"
    ? await $`pnpm sst remove`
    : await $`pnpm sst deploy`;
}
```

---

## App Configuration Properties

### `home` - Required

Specifies where SST stores your app's state. Options: `"aws"`, `"cloudflare"`, `"local"`

The state tracks resources and secrets, backed up in your cloud provider (or locally).

### `name` - Required

String identifying your app. Used to prefix resource names.

**Warning:** Changing this causes a redeploy with new resources; old ones become orphaned.

### `protect?` (Optional)

Boolean preventing `sst remove` execution. Useful for protecting production stages.

```typescript
protect: input.stage === "production"
```

### `providers?` (Optional)

Specifies cloud providers used in your app. Defaults to the `home` provider.

```typescript
providers: {
  aws: "6.27.0",
  cloudflare: "5.37.1"
}
```

Can include configuration:

```typescript
providers: {
  aws: {
    region: "us-west-2"
  }
}
```

### `removal?` (Optional)

Configures resource deletion behavior. Options:

- `"remove"` - Deletes all resources
- `"retain"` - Preserves S3, DynamoDB; deletes others (default)
- `"retain-all"` - Preserves all resources

```typescript
removal: input.stage === "production" ? "retain" : "remove"
```

### `version?` (Optional)

Specifies supported SST version. CLI fails if mismatched.

```typescript
version: "3.2.49"        // Exact version
version: ">= 3.2.49"     // Semver range
```

---

## Input Types

### `AppInput`

- **`stage`** (`string`) - Current deployment stage

### `RunnerInput`

- **`stage`** (`string`) - Deployment stage for the runner

---

## Git Event Types

### `BranchEvent`

Triggered when branches are pushed or deleted.

**Properties:**

- `type: "branch"`
- `action: "pushed" | "removed"`
- `branch: string` - Branch name
- `commit: { id: string; message: string }`
- `repo: { id: number; owner: string; repo: string }`
- `sender: { id: number; username: string }`

### `PullRequestEvent`

Triggered on PR updates or closure.

**Properties:**

- `type: "pull_request"`
- `action: "pushed" | "removed"`
- `number: number` - PR number
- `base: string` - Target branch
- `head: string` - Source branch
- `title: string` - PR title
- `commit: { id: string; message: string }`
- `repo: { id: number; owner: string; repo: string }`
- `sender: { id: number; username: string }`

### `TagEvent`

Triggered on tag creation or deletion.

**Properties:**

- `type: "tag"`
- `action: "pushed" | "removed"`
- `tag: string` - Tag name (e.g., "v1.5.2")
- `commit: { id: string; message: string }`
- `repo: { id: number; owner: string; repo: string }`
- `sender: { id: number; username: string }`

### `UserEvent`

Triggered on manual Console deployments.

**Properties:**

- `type: "user"`
- `action: "deploy" | "remove"`
- `ref: string` - Branch, tag, or commit hash
- `commit: { id: string; message: string }`
- `repo: { id: number; owner: string; repo: string }`

---

## Runner Configuration

### `Runner` Object Properties

#### `engine` - Required

Currently only `"codebuild"` is supported.

#### `architecture?` (Optional)

Machine architecture: `"x86_64"` (default) or `"arm64"`

#### `compute?` (Optional)

Compute size: `"small" | "medium" | "large" | "xlarge" | "2xlarge"`

**x86_64 sizes:**

| Size | Memory | vCPUs |
|------|--------|-------|
| small | 3 GB | 2 |
| medium | 7 GB | 4 |
| large | 15 GB | 8 |
| xlarge | 70 GB | 36 |
| 2xlarge | 145 GB | 72 |

**arm64 sizes:**

| Size | Memory | vCPUs |
|------|--------|-------|
| small | 4 GB | 2 |
| medium | 8 GB | 4 |
| large | 16 GB | 8 |
| xlarge | 64 GB | 32 |
| 2xlarge | 96 GB | 48 |

#### `timeout?` (Optional)

Build duration limit: `"${number} minute(s)"` or `"${number} hour(s)"` (5 minutes to 36 hours; default: 1 hour)

#### `cache?` (Optional)

```typescript
cache: {
  paths: ["node_modules", "/path/to/cache"]
}
```

Defaults to caching `.git` directory.

#### `vpc?` (Optional)

```typescript
vpc: {
  id: "vpc-0be8fa4de860618bb",
  subnets: ["subnet-xxx"],
  securityGroups: ["sg-xxx"]
}
```

Runs build inside specified VPC for database access during builds.

---

## Environment Variables

### `.env` Files

Place `.env` and `.env.<stage>` in the same directory as `sst.config.ts`. They load as environment variables accessible via `process.env`.

**Priority:** `.env.<stage>` overrides `.env`

**Warning:** Restart `sst dev` after modifying `.env` files.

---

## Workflow Input Type

### `WorkflowInput`

**Properties:**

- **`$`** - Bun Shell instance for bash-like scripting
- **`event`** - Git event (`BranchEvent | TagEvent | PullRequestEvent | UserEvent`)

**Usage Example:**

```typescript
async workflow({ $, event }) {
  await $`npm i`;
  if (event.type === "pull_request") {
    await $`npm run test`;
  }
  event.action === "removed"
    ? await $`pnpm sst remove`
    : await $`pnpm sst deploy`;
}
```

---

## Target Configuration

### `Target` Object

- **`stage: string | string[]`** - Stage or stages for deployment

Returns `undefined` to skip the deployment.

---

## Key Notes

- TypeScript 5+ required for type checking
- Cannot import provider packages; SST handles this
- `app` function evaluates first; `run` function defines resources
- Outputs written to `.sst/outputs.json` after successful deployment
- Autodeploy matches stage names against Console environments
- Default autodeploy skips tag events
- VPC configuration enables database queries during builds
