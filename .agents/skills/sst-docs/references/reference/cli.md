# SST CLI Reference

> Source: https://sst.dev/docs/reference/cli/

## Overview

The SST CLI helps manage serverless applications. Installation options include npm, a curl script, or package managers (Homebrew for macOS, package repositories for Linux).

## Global Flags

### Stage

Controls which environment your app deploys to. Use `--stage production` or set `SST_STAGE` environment variable. If not specified, the CLI uses your local machine username and stores it in `.sst/stage`.

### Verbose

The `--verbose` flag prints extra information to the log files in the `.sst/` directory. Combine with `--print-logs` to view on screen.

### Print Logs

Display logs to your terminal. Can be set via `SST_PRINT_LOGS=1` environment variable, useful for CI environments.

### Config

Specify a custom path to your configuration file: `sst --config path/to/config.ts [command]`. Helpful for monorepos with multiple SST apps.

### Help

Access command help with `sst [command] --help` or global help via `sst --help`.

## Commands

### init

Initialize a new project, creating `sst.config.ts` and installing providers. Use `--yes` flag to skip interactive confirmation for detected frameworks.

### dev

Run your app in development mode. The multiplexer spawns separate tabs for deployment, functions, frontends, and services. Key behaviors:

- Functions run live
- Task components deploy stubs and run locally
- Frontends don't deploy (run locally instead)
- Services don't deploy, run `dev.command` locally
- Databases link to local versions when `dev` prop is set

Use `--mode=basic` to disable the multiplexer. Use `--mode=mono` to disable the tabbed UI (default for Windows).

### deploy

Deploy your application. Optionally specify `--target ComponentName` to deploy specific components. The `--continue` flag attempts deploying all resources despite errors. The `--dev` flag deploys like `sst dev` would, skipping locally-run components.

Build concurrency can be controlled via environment variables:

- `SST_BUILD_CONCURRENCY_SITE` (default: 1)
- `SST_BUILD_CONCURRENCY_FUNCTION` (default: 4)
- `SST_BUILD_CONCURRENCY_CONTAINER` (default: 1)

### diff

Preview changes before deployment. Shows resources being created, updated, or deleted with property changes. Use `--target ComponentName` for specific components. The `--dev` flag compares against dev mode state.

### add

Install and configure a provider: `sst add aws`. This installs the package, adds it to config, and updates globals. Specify versions in your config as needed.

### install

Install providers listed in your configuration. Run this after adding providers or pulling configuration changes from teammates.

### secret

Manage encrypted secrets stored in S3.

#### set

`sst secret set NameOfSecret value` stores encrypted values. Use `--fallback` to set fallback values for preview stages. Supports multi-line values via file redirection.

#### remove

Delete a secret or its fallback value.

#### load

Import secrets from a file: `sst secret load ./secrets.env`. File should use dotenv or bash format.

#### list

Display all secrets. Optionally filter by `--fallback` or `--stage`.

### shell

Execute commands with all linked resources available in the environment. Examples:

- `sst shell node my-script.js` runs a script
- `sst shell` opens an interactive shell
- `sst shell --target ComponentName` limits scope to specific component

### remove

Delete your application resources. By default removes your personal stage. Respects `removal` settings in your config. Doesn't delete SST state or bootstrap resources.

### unlock

Release deploy locks if a process was interrupted. When you run `sst deploy`, it acquires a lock on your state file to prevent concurrent deploys.

### version

Display current CLI version.

### upgrade

Update to the latest CLI version or specify a target: `sst upgrade 0.10`.

### telemetry

Enable or disable anonymous usage tracking. SST collects version, commands used, and machine info. Disable via `SST_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1` environment variables.

### refresh

Synchronize local state with cloud provider. Compares your local state with the state of the resources in the cloud provider. Any changes that are found are adopted into your local state.

### state

Manage application state.

#### export

Display current state, optionally decrypting sensitive values.

#### remove

Delete a resource reference from state (doesn't remove the actual resource).

#### repair

Fix corrupted state by reordering dependent resources and removing broken dependencies.

### cert

Generate locally-trusted certificates for Console connections. Uses mkcert internally.

### tunnel

Create SSH tunnels to VPC resources when bastion is enabled. Forwards traffic from specified ranges (10.0.0.0/22, etc.). The `tunnel install` subcommand creates necessary network interfaces (requires sudo).

### diagnostic

Generate debugging report combining state, logs, and configuration into a zip file in `.sst/`.

## Environment Variables

Access environment variables in your config file. For example: `ENV_VAR=123 sst deploy` makes `ENV_VAR` available via `process.env.ENV_VAR`.
