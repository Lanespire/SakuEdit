# StepFunctions

> Source: https://sst.dev/docs/component/aws/step-functions/

## Overview

The `StepFunctions` component enables state machine creation using AWS Step Functions. Currently in **beta**, it supports defining workflows through chained state objects and uses JSONata for data transformation between states.

## Constructor

```typescript
new sst.aws.StepFunctions(name, args, opts?)
```

**Parameters:**
- `name` (string) - Component identifier
- `args` (StepFunctionsArgs) - Configuration object (required)
- `opts?` (ComponentResourceOptions) - Pulumi resource options

## Props

### definition
- **Type:** `State`
- **Required**
- State machine definition using chained State objects (created via static methods).

### logging?
- **Type:** `false | Object`
- **Default:** `{retention: "1 month", level: "error", includeData: false}`
- CloudWatch execution logs configuration.
- Set to `false` to disable logging.
- Sub-properties:
  - `level?` (`"all"` | `"error"` | `"fatal"`) - Log level (default: `"error"`)
  - `includeData?` (boolean) - Include execution data in logs (default: `false`)
  - `retention?` - Log retention duration. Options: `"1 day"` through `"10 years"` or `"forever"` (default: `"1 month"`)

### type?
- **Type:** `"standard"` | `"express"`
- **Default:** `"standard"`
- Workflow type. Standard for long-running workflows, express for workflows under 5 minutes.

### transform?
- **Type:** `Object`
- Resource transformation options.
- Sub-properties:
  - `logGroup?` - Customize CloudWatch LogGroup resource
  - `stateMachine?` - Customize StateMachine resource

## Properties

### arn
- **Type:** `Output<string>`
- The State Machine ARN.

### nodes
- `stateMachine` (StateMachine) - Underlying Pulumi StateMachine resource

## Static Methods (State Builders)

### StepFunctions.pass(args)
Returns: `Pass` state
- Pass/transform input to next state.

### StepFunctions.succeed(args)
Returns: `Succeed` state
- Mark execution as successful.

### StepFunctions.fail(args)
Returns: `Fail` state
- Terminate execution with failure status.

### StepFunctions.wait(args)
Returns: `Wait` state
- Delay execution by time or timestamp.

### StepFunctions.choice(args)
Returns: `Choice` state
- Conditional branching based on matched conditions.

### StepFunctions.map(args)
Returns: `Map` state
- Iterate over list items executing tasks.

### StepFunctions.parallel(args)
Returns: `Parallel` state
- Execute multiple branches concurrently.

### StepFunctions.task(args)
Returns: `Task` state
- Generic AWS resource invocation.

### StepFunctions.lambdaInvoke(args)
Returns: `Task` state
- Invoke a Lambda function.
- Args: `{ name, function }`

### StepFunctions.sqsSendMessage(args)
Returns: `Task` state
- Send SQS queue message.

### StepFunctions.snsPublish(args)
Returns: `Task` state
- Publish SNS topic message.

### StepFunctions.eventBridgePutEvents(args)
Returns: `Task` state
- Send events to EventBridge buses.

### StepFunctions.ecsRunTask(args)
Returns: `Task` state
- Run ECS task via Task component.

## State Chaining

All states support `.next(state)` for chaining states together into a workflow definition.

## Links

When linked, the `StepFunctions` component exposes the following through the SDK `Resource` object:
- `arn` (string) - State Machine ARN

## Examples

### Minimal setup
```typescript
const foo = sst.aws.StepFunctions.pass({ name: "Foo" });
const bar = sst.aws.StepFunctions.succeed({ name: "Bar" });

new sst.aws.StepFunctions("MyStateMachine", {
  definition: foo.next(bar)
});
```

### Lambda invocation
```typescript
const myFunc = new sst.aws.Function("MyFunction", {
  handler: "src/index.handler"
});

const invoke = sst.aws.StepFunctions.lambdaInvoke({
  name: "InvokeMyFunction",
  function: myFunc
});

new sst.aws.StepFunctions("MyStateMachine", {
  definition: invoke.next(
    sst.aws.StepFunctions.succeed({ name: "Done" })
  )
});
```

### Express workflow
```typescript
new sst.aws.StepFunctions("MyStateMachine", {
  type: "express",
  definition: foo.next(bar)
});
```

### Disable logging
```typescript
new sst.aws.StepFunctions("MyStateMachine", {
  logging: false,
  definition: foo.next(bar)
});
```

### Custom log retention
```typescript
new sst.aws.StepFunctions("MyStateMachine", {
  logging: {
    retention: "1 year",
    level: "all",
    includeData: true
  },
  definition: foo.next(bar)
});
```

### Choice state (conditional branching)
```typescript
const checkResult = sst.aws.StepFunctions.choice({
  name: "CheckResult",
  choices: [
    {
      condition: "{% $states.input.status = 'success' %}",
      next: successState
    }
  ],
  default: failState
});
```

### Parallel execution
```typescript
const parallel = sst.aws.StepFunctions.parallel({
  name: "RunParallel",
  branches: [branch1, branch2]
});
```
