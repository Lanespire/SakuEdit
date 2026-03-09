# Live

> Source: https://sst.dev/docs/live/

## Overview

Live is a feature of SST that lets you test changes made to your AWS Lambda functions in milliseconds. Your changes work without having to redeploy.

By default, `sst dev` runs all functions in the app in "live" mode. The system works by proxying requests from AWS to your local machine, executing locally, and returning responses.

## Advantages

The live setup enables several benefits:

- **Fast reloading**: Changes reload in under 10ms
- **Debugging**: Set breakpoints in your preferred IDE
- **Remote invocation**: Functions can be triggered remotely (APIs, cron jobs, async events)
- **Webhook testing**: Easy testing since you provide the API endpoint
- **All trigger types supported**: No event mocking needed
- **Correct IAM permissions**: Matches production behavior

## How It Works

Live uses AWS AppSync Events for communication between local machines and remote Lambda functions.

**Process flow:**

1. `sst dev` deploys the app and replaces Lambda functions with stub versions
2. A local WebSocket client connects to the AppSync API endpoint
3. When invoked, the Lambda function publishes an event containing the request payload
4. The local WebSocket client receives the event and acknowledges receipt
5. The local function version runs as a Node.js Worker and publishes the response
6. The stub Lambda receives the event and returns the payload

### Quirks

**Runtime change:** The deployed stub uses a different runtime for speed optimization. The Lambda Console may not reflect your config runtime changes until you run `sst deploy`.

**Live mode persists:** Killing the `sst dev` CLI leaves stub functions in AWS. Requests will timeout attempting to proxy to your machine. Running `sst deploy` fixes this, but redeployment takes minutes. Best practice: use `sst dev` only in personal stages.

### Live Mode Environment Variable

When running live, the `SST_DEV` environment variable is set to `true`. Access it in Node.js functions via `process.env.SST_DEV`.

**Example:**

```javascript
export async function main(event) {
  const body = process.env.SST_DEV ? "Hello, Live!" : "Hello, World!";
  return {
    body,
    statusCode: 200,
  };
}
```

**Local database connection example:**

```javascript
const dbHost = process.env.SST_DEV
  ? "localhost"
  : "amazon-string.rds.amazonaws.com";
```

## Cost

AWS AppSync Events is serverless with no charges when unused. Pricing is approximately $1.00 per million messages and $0.08 per million connection minutes.

## Privacy

All data remains between your local machine and AWS account -- no third-party services involved.

### Using a VPC

By default, local functions cannot connect to VPC resources. Solutions include VPN connections or tunnel creation.

#### Creating a Tunnel

**Steps:**

1. Enable `bastion` host in VPC:

```typescript
new sst.aws.Vpc("MyVpc", { bastion: true });
```

2. Install tunnel (requires sudo, one-time setup):

```bash
sudo sst tunnel install
```

3. Run `sst dev`:

```bash
sst dev
```

The Tunnel tab appears on the left; local environment can now access VPC resources.

#### Setting Up a VPN Connection

1. Set up AWS Client VPN with mutual authentication certificates
2. Create Client VPC Endpoint and associate with VPC
3. Install Tunnelblick locally
4. Establish VPN connection

AWS Client VPN is hourly-billed but inexpensive.

## Breakpoints

Live enables local debugging with IDE breakpoints.

**VS Code setup:**

1. Enable Auto Attach from Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Search "Debug: Toggle Auto Attach" and select "Always"
3. Start a new VS Code terminal
4. Run `sst dev`
5. Set breakpoints and invoke functions

## Changelog

| SST Version | Change |
|-------------|--------|
| v0.5.0 | Initial "Live Lambda" using API Gateway WebSocket and DynamoDB |
| v2.0.0 | Switched to AWS IoT (2-3x faster) |
| v3.3.1 | Switched to AWS AppSync Events (faster, better payload handling) |
