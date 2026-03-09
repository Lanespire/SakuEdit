# Cron

> Source: https://sst.dev/docs/component/aws/cron/

## Overview

The `Cron` component enables scheduled job execution via Amazon EventBridge, supporting both Lambda functions and ECS Fargate container tasks on defined schedules. Cron jobs persist running even after exiting development mode.

## Constructor

```typescript
new sst.aws.Cron(name, args, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args` (CronArgs) - Configuration object
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### Required

#### schedule
- **Type:** `"rate(${string})"` | `"cron(${string})"`
- **Description:** Scheduling expression using rate or cron syntax.
  - Rate: `"rate(1 minute)"`, `"rate(5 hours)"`, `"rate(1 day)"`
  - Cron: `"cron(0 12 * * ? *)"` (standard cron expression)

### Optional

#### function
- **Type:** `string | FunctionArgs | ARN`
- **Description:** Lambda handler to execute. Accepts file path, full function props, or ARN.

#### task
- **Type:** `Task`
- **Description:** ECS Fargate task to execute when triggered.

#### event
- **Type:** `Record<string, string>`
- **Description:** Custom event data passed to function/task. Appears as event parameter for Lambda or `SST_EVENT` env var for ECS.

#### enabled
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Controls whether the cron job executes.

#### transform
- **Type:** `Object`
- **Description:** Resource customization for underlying resources.
  - `rule`: Customize EventBridge Rule resource
  - `target`: Customize EventBridge Target resource

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `nodes.rule` | EventRule | The EventBridge Rule resource managing the schedule |
| `nodes.target` | EventTarget | The EventBridge Target resource routing events |
| `nodes.function` | `Output<Function>` | Lambda function invoked by the cron trigger |
| `nodes.job` | `Output<Function>` | Alias for function property |

## Methods

None.

## Links

The Cron component does not directly expose linked properties. The underlying function or task can be linked separately.

## Examples

### Basic function-based cron
```typescript
new sst.aws.Cron("MyCronJob", {
  function: "src/cron.handler",
  schedule: "rate(1 minute)"
});
```

### Container task execution
```typescript
const myCluster = new sst.aws.Cluster("MyCluster");
const myTask = new sst.aws.Task("MyTask", { cluster: myCluster });
new sst.aws.Cron("MyCronJob", {
  task: myTask,
  schedule: "rate(1 day)"
});
```

### Enhanced function configuration
```typescript
new sst.aws.Cron("MyCronJob", {
  schedule: "rate(1 minute)",
  function: {
    handler: "src/cron.handler",
    timeout: "60 seconds"
  }
});
```

### With custom event data
```typescript
new sst.aws.Cron("MyCronJob", {
  function: "src/cron.handler",
  schedule: "rate(1 hour)",
  event: {
    foo: "bar"
  }
});
```

### Disabled cron
```typescript
new sst.aws.Cron("MyCronJob", {
  function: "src/cron.handler",
  schedule: "rate(1 day)",
  enabled: false
});
```
