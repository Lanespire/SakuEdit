# Buildkite

> Source: https://www.pulumi.com/registry/packages/buildkite
> Package: `@pulumiverse/buildkite`
> SST Install: `sst add @pulumiverse/buildkite`

## Overview

The Buildkite provider enables provisioning and management of Buildkite CI/CD platform resources through Pulumi. It is maintained by Pulumiverse and allows infrastructure-as-code management of pipelines, agent tokens, and other Buildkite components.

## Configuration

### Authentication

Uses a Buildkite API Access Token with GraphQL access and `write_pipelines` / `read_pipelines` scopes. Credentials are never sent to pulumi.com.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `BUILDKITE_API_TOKEN` | API Access Token with GraphQL access |
| `BUILDKITE_ORGANIZATION` | Buildkite organization slug |
| `BUILDKITE_GRAPHQL_URL` | Custom GraphQL endpoint (optional) |
| `BUILDKITE_REST_URL` | Custom REST endpoint (optional) |

### Pulumi Config

```bash
pulumi config set buildkite:apiToken XXXXXXXXXXXXXX --secret
pulumi config set buildkite:organization my-org
```

## Key Resources

- `buildkite.agent.AgentToken` - Create agent authentication tokens
- `buildkite.pipeline.Pipeline` - Manage CI/CD pipelines
- `buildkite.pipeline.Schedule` - Schedule pipeline builds
- `buildkite.team.Team` - Manage teams
- `buildkite.cluster.Cluster` - Manage agent clusters

## Example

```typescript
import * as buildkite from "@pulumiverse/buildkite";

// Create an agent token
const agentToken = new buildkite.agent.AgentToken("token", {
  description: "Production agent token",
});

// Create a pipeline
const pipeline = new buildkite.pipeline.Pipeline("my-pipeline", {
  name: "my-pipeline",
  repository: "https://github.com/org/repo.git",
  steps: `
steps:
  - label: ":pipeline:"
    command: "buildkite-agent pipeline upload"
`,
});
```
