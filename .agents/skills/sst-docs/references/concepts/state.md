# State

> Source: https://sst.dev/docs/state/

## Overview

SST creates a local state file to track infrastructure state, enabling differential deployments of only changed resources.

## State Components

The state includes:

1. **State file**: A JSON file tracking resources
2. **Passphrase**: Encrypts secrets within the state

## Cloud Backup Resources

State is backed up using:

1. **Bucket**: Named `sst-state-<hash>`, created in your home region
2. **SSM Parameter**: Stores passphrase at `/sst/passphrase/<app>/<stage>`

**Critical Warning**: Do not delete the SSM parameter that stores the passphrase for your app. The passphrase is used to encrypt any secrets and sensitive information. Without it SST won't be able to read the state file and deploy your app.

## Home Provider

Your `sst.config.ts` designates a home provider (AWS or Cloudflare) for state storage:

```typescript
{ home: "aws" }
```

Specifying home automatically includes that provider in your configuration.

## Bootstrap Resources

When deploying resources like Lambda functions or Docker containers, SST creates:

1. Assets bucket (`sst-asset-<hash>`)
2. ECR repository (`sst-asset`)
3. SSM parameter storing bootstrap resource locations
4. AppSync Events API endpoint for Live functionality

### Reset Bootstrap

If bootstrap resources are accidentally removed:

1. Remove resources listed in the SSM parameter
2. Delete the SSM parameter itself
3. Re-run SST CLI to re-bootstrap

## State Synchronization Process

Deployment workflow:

1. Components convert to low-level resource definitions
2. Definitions compared against state file
3. Differences trigger appropriate API calls (create/update/delete)
4. State file updates to reflect new resource state

## Out-of-Sync Scenarios

**Problem**: Manual cloud provider changes desynchronize config, state, and resources.

### Example Scenarios

**Resource Modified**: Changing timeout via AWS Console leaves state outdated; subsequent deploys won't reflect the change.

**Config Changed**: Updating configuration and deploying re-synchronizes everything.

**Resource Deleted**: Manual deletion while state retains it causes deployment failures. State becomes inconsistent with reality.

## Refresh Command

```bash
sst refresh
```

This command:

1. Iterates through all state resources
2. Queries cloud provider for current state
3. Updates state when configs differ
4. Removes resources no longer existing in cloud

**Note**: The `sst refresh` does not make changes to the resources in the cloud provider.

The command resolves synchronization issues without modifying actual cloud resources.

## Best Practice

Manual resource changes in cloud providers are not recommended due to sync risks. Use `sst refresh` when desynchronization occurs.
