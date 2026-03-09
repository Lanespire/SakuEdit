# Console

> Source: https://sst.dev/docs/console/

## Overview

The Console is a web-based dashboard available at console.sst.dev that manages SST applications. Teams can monitor apps, resources, updates, view logs, receive issue alerts, and deploy via git push. The Console is optional with a free tier available.

## Getting Started

### Account Setup Process

1. **Create Account**: Register with work email at console.sst.dev to invite team members later

2. **Create Workspace**: Establish workspace for personal projects or team use; multiple workspaces permitted

3. **Connect AWS Account**: Deploy CloudFormation stack in us-east-1 region to scan all regions for SST apps and enable subscriptions

**Important**: Stack must be created in us-east-1. If deployed incorrectly, remove and recreate.

**Concurrency Error Resolution**: New AWS accounts may encounter: "Resource handler returned message: 'Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value'"

Resolution steps:
- Request Lambda concurrency quota increase to default 1000
- Submit request, click Quota request history
- Access AWS Support Center Case
- Use Reply button to chat with representative for expedited processing

4. **Invite Team**: Use teammate emails; they join by logging with provided email

## How It Works

- Hosted service storing metadata about deployed resources
- Auto-displays all apps and stages after AWS account connection
- Open-source application built with SST (viewable on GitHub)
- Automatically deploys using itself

## Security

### IAM Role Configuration

Default: `AdministratorAccess` granted to CloudFormation-created IAM Role

Options for production environments:
- Customize permissions (details provided below)
- Request BAA signature available upon contact

Future support planned for self-hosted Console option.

### Read Permissions

| Purpose | AWS IAM Action |
|---------|----------------|
| Fetch stack outputs | `cloudformation:DescribeStacks` |
| Retrieve function runtime and size | `lambda:GetFunction` |
| Access stack metadata | `ec2:DescribeRegions`, `s3:GetObject`, `s3:ListBucket` |
| Display function logs | `logs:DescribeLogStreams`, `logs:FilterLogEvents`, `logs:GetLogEvents`, `logs:StartQuery` |
| Monitor invocation usage | `cloudwatch:GetMetricData` |

Recommendation: Attach `arn:aws:iam::aws:policy/ReadOnlyAccess` AWS managed policy for comprehensive read access.

### Write Permissions

| Purpose | AWS IAM Action |
|---------|----------------|
| Forward bootstrap bucket events to event bus | `s3:PutBucketNotification` |
| Send events to Console | `events:PutRule`, `events:PutTargets` |
| Grant event bus access | `iam:CreateRole`, `iam:DeleteRole`, `iam:DeleteRolePolicy`, `iam:PassRole`, `iam:PutRolePolicy` |
| Enable Issues to subscribe logs | `logs:CreateLogGroup`, `logs:PutSubscriptionFilter` |
| Invoke Lambda functions and replay invocations | `lambda:InvokeFunction` |

Periodic review and updates of policies recommended.

### Customize IAM Policy

Process:

1. Download `template.json` from CloudFormation create stack page
2. Edit template with necessary changes
3. Upload edited file to S3 bucket
4. Replace template URL in CloudFormation page

**Template Structure Example**:

```json
{
  "SSTRole": {
    "Type": "AWS::IAM::Role",
    "Properties": {
      "ManagedPolicyArns": [
        "arn:aws:iam::aws:policy/AdministratorAccess",
        "arn:aws:iam::aws:policy/ReadOnlyAccess"
      ],
      "Policies": [
        {
          "PolicyName": "SSTPolicy",
          "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
              {
                "Effect": "Allow",
                "Action": ["s3:PutBucketNotification"],
                "Resource": ["arn:aws:s3:::sstbootstrap-*"]
              },
              {
                "Effect": "Allow",
                "Action": ["events:PutRule", "events:PutTargets"],
                "Resource": {
                  "Fn::Sub": "arn:aws:events:*:${AWS::AccountId}:rule/SSTConsole*"
                }
              },
              {
                "Effect": "Allow",
                "Action": [
                  "iam:CreateRole",
                  "iam:DeleteRole",
                  "iam:DeleteRolePolicy",
                  "iam:PassRole",
                  "iam:PutRolePolicy"
                ],
                "Resource": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/SSTConsolePublisher*"
                }
              },
              {
                "Effect": "Allow",
                "Action": [
                  "logs:CreateLogGroup",
                  "logs:PutSubscriptionFilter"
                ],
                "Resource": {
                  "Fn::Sub": "arn:aws:logs:*:${AWS::AccountId}:log-group:*"
                }
              },
              {
                "Effect": "Allow",
                "Action": ["lambda:InvokeFunction"],
                "Resource": {
                  "Fn::Sub": "arn:aws:lambda:*:${AWS::AccountId}:function:*"
                }
              }
            ]
          }
        }
      ]
    }
  }
}
```

## Pricing

Effective February 1, 2025:

| Resource Count | Rate |
|---|---|
| First 2000 | $0.086 per resource |
| 2000+ | $0.032 per resource |

**Free Tier**: Workspaces with 350 active resources or fewer

Example: 351 active resources = 351 x $0.086 = $30.20/month

### Calculation Details

- Calculated monthly per workspace
- Resource: item created by SST in cloud provider
- Personal stage access maintained even if above free tier
- Active resource definition: from stage existing 2 weeks or more AND updated during month
- Volume pricing available via contact

### Active Resource Scenarios

- Stage created 5 months ago, deployed this month = **active**
- Stage created 5 months ago, NOT deployed this month = **inactive**
- Stage created 12 days ago = **inactive**
- Stage created 20 days ago, removed 10 days ago = **inactive**
- Stage created 5 months ago, deployed then removed same month = **active**
- Stage created 5 months ago, not deployed this month, removed this month = **inactive**

### Previous Pricing (Legacy)

| Invocations | Rate |
|---|---|
| First 1M | Free |
| 1M - 10M | $0.00002 per invocation |
| 10M+ | $0.000002 per invocation |

Notes:
- Monthly workspace calculation
- Personal stages permanently free
- Soft limit on Issues for all accounts
- Volume pricing available upon contact

## Features

### 1. Logs

View logs without CloudWatch access:

- Recent logs display
- Jump to specific time
- String-based search functionality

### 2. Issues

Real-time error alerts for Node.js Lambda functions and containers:

- No setup required
- Automatic source map support
- Zero performance impact (code not modified)

**Limitation**: Currently Node.js only; other languages on roadmap

#### Error Detection

For automatic error reporting, use:

```typescript
console.error(new Error("my-error"));
```

**Container Applications**:

```typescript
import "sst";
console.error(new Error("my-error"));
```

Import polyfills console object to prepend marker for error detection. If SDK already imported, no additional import needed.

**Lambda Functions**:

```typescript
console.error(new Error("my-error"));
```

Lambda runtime automatically applies polyfill; no SDK import necessary. Also reports Lambda function failures.

#### How Issues Works

1. During deploy or account sync, log subscriber added to CloudWatch Log groups
   - Includes Lambda function in AWS account
2. Subscriber filter matches error patterns
   - Lambda runtime auto-adds marker to logs
   - SST SDK polyfills console object for containers
3. Lambda function parses error; fetches source maps from state bucket for Lambda errors
4. Hits SST Console endpoint with error data
5. Console groups similar errors and displays them

#### Log Subscriber Components

1. **Lambda Function**:
   - Max concurrency: 10
   - Falls behind processing >10 minutes: discards logs
   - Prevents indefinite scaling during error bursts
   - Alerts may delay up to 10 minutes during high error volume

2. **IAM Role**: Accesses logs and state bucket for source maps

3. **Log Group**: 1-day retention

Deployed to **every region** with CloudWatch log groups from SST apps via CloudFormation stack.

**Failure Scenarios**:
- Insufficient permissions (update Console permissions)
- Hit subscriber limit (max 2 subscribers; remove existing to resolve)

View errors in Issues tab; click Retry after fixing.

#### Costs

AWS bills for Lambda function log subscriber in account (typically minimal cost).

Maximum cost during infinite error scenarios: $43 x 10 concurrency = **$430/month per region**

Disable Issues in workspace settings if using separate monitoring service.

### 3. Updates

Each update receives unique URL (permalink) printed by SST CLI:

```
->  Permalink  https://sst.dev/u/318d3879
```

**Update Details Displayed**:

1. All modified resources
2. Input and output changes
3. Docker and site build logs
4. CLI command triggering update
5. Git commit (if auto-deploy)

Use permalink for team sharing and deploy debugging.

**Technical Process**:
- CLI updates state with event log from each update
- Generates globally unique ID
- Console pulls state and event log if AWS account connected
- Permalink lookup redirects to correct app in workspace

### 4. Resources

Display complete resource state:

1. Each resource in app
2. Resource relationships
3. Resource outputs

### 5. Autodeploy

Auto-deploy apps on git push to GitHub repo. Uses AWS CodeBuild in account.

#### Advantages Over Alternatives

1. **Easy Start**:
   - Standard branch and PR workflow supported out-of-box
   - No config file required
   - No complicated AWS credential configuration

2. **Configurable**:
   - Configure via `sst.config.ts`
   - Typesafe with customizable callbacks

3. **Runs in Account**:
   - Builds run in user's AWS account
   - VPC configuration available for private resource access

4. **Console Integration**:
   - View updated resources in Console
   - Resource updates show related git commits

#### Setup Instructions

1. **Enable GitHub Integration**:
   - Workspace Settings > Integrations > Enable GitHub
   - Login to GitHub
   - Select GitHub organization/user

   **Note**: You can only associate your workspace with a single GitHub org.

   Create multiple workspaces for multiple GitHub organizations.

2. **Connect Repository**:
   - App Settings > Autodeploy
   - Select repo for app

3. **Configure Environment**:
   - Select stage for deployment
   - Choose AWS account
   - Optionally configure environment variables

   **Note**: Stage names by default are generated based on the branch or PR.

4. **Git Push**:
   - Push to configured environment
   - Monitor in app's Autodeploy tab

   **Note**: PR stages are removed when the PR is closed while branch stages are not.

5. **Setup Alerts**:
   - Workspace Settings > Alerts
   - Add alert for Autodeploys or errors only

#### Configuration

Configure via `sst.config.ts` `console.autodeploy`:

```typescript
export default $config({
  app(input) { },
  async run() { },
  console: {
    autodeploy: {
      target(event) {
        if (event.type === "branch" &&
            event.branch === "main" &&
            event.action === "pushed") {
          return { stage: "production" };
        }
      }
    }
  }
});
```

Return `undefined` to skip deploy. Custom `target` callback overrides defaults.

**Runner Configuration**:

```typescript
console: {
  autodeploy: {
    runner: { timeout: "2 hours" }
  }
}
```

**Stage-Specific Runner**:

```typescript
console: {
  autodeploy: {
    runner(stage) {
      if (stage === "production") return { timeout: "3 hours" };
    }
  }
}
```

**VPC Configuration**:

```typescript
console: {
  autodeploy: {
    runner: {
      vpc: {
        id: "vpc-0be8fa4de860618bb",
        securityGroups: ["sg-0399348378a4c256c"],
        subnets: ["subnet-0b6a2b73896dc8c4c", "subnet-021389ebee680c2f0"]
      }
    }
  }
}
```

**Cache Configuration**:

```typescript
console: {
  autodeploy: {
    runner: {
      cache: {
        paths: ["node_modules", "/path/to/cache"]
      }
    }
  }
}
```

#### Environments

Configure under App Settings > Autodeploy. Each environment requires:

1. **Stage**:
   - Name deployed
   - Default: sanitized branch name (letters/numbers/hyphens)
   - Examples:
     - Branch `production` -> stage `production`
     - PR#12 -> stage `pr-12`
   - Customizable via `sst.config.ts`

   **Pattern Matching**: If multiple stages share the same environment, you can use a glob pattern. For example, `pr-*` matches all stages that start with `pr-`.

2. **AWS Account**: Deployment target account

3. **Environment Variables**: Build process variables available as `process.env.*` in `sst.config.ts`

#### How Autodeploy Works

When git push occurs:

1. Generate stage name via `console.autodeploy.target` callback
   - No callback: sanitized branch/tag name
   - Callback returns undefined: skip deploy
2. Match stage against environments for AWS account and variables
3. Generate runner config via `console.autodeploy.runner` or use defaults
4. Run deploy based on config

**Note**: Only applies to git events. Console-triggered deploys skip step 1 and don't call `console.autodeploy.target`.

Both `target` and `runner` optional with defaults but customizable.

#### Costs

AWS bills for CodeBuild build minutes. See AWS CodeBuild pricing for details.

### 6. Local Logs

Real-time logs from local `sst dev` terminal. Console checks on startup for local CLI and displays logs.

**Connection Details**: Local server allows access only from `localhost` and `console.sst.dev`.

Works in all browsers/environments but requires additional configuration for certain browsers.

#### Safari & Brave Configuration

These browsers require HTTPS for local connections.

Generate locally-trusted certificate once:

```bash
sst cert
```

Run once per machine.

#### Gitpod Configuration

Use Gitpod Local Companion app for Gitpod workspace connections:

1. Install Gitpod Local Companion app
2. Run Companion app
3. Navigate to Console in browser

Companion app creates tunnelled connection to Gitpod workspace.

## FAQ

**Q: Do I need the Console to use SST?**

You don't need the Console to use SST. It complements CLI with production management features. Free tier available without credit card.

**Q: Is there a free tier?**

Workspaces with 350 active resources or fewer monthly are free. Count resets monthly.

**Q: What happens exceeding free tier?**

Cannot access production/deployed stages without billing details in workspace settings. Personal stages remain accessible (requires local `sst dev` running). Console detects personal stage status locally.

**Q: What counts as a resource?**

Resources created by SST in cloud providers, including built-in components (Function, Nextjs, Bucket) and Terraform/Pulumi provider resources. Complex components create multiple resources.

View full resource list in Console app stage. Example: Console itself has ~320 resources.

**Q: Do PR stages count?**

Stages must exist 2 weeks or more before resources count. PR stages removed within 2 weeks don't count. Removing then recreating stage doesn't reset 2-week period.

### Old Pricing FAQ

**Q: Must I switch to new pricing?**

Current old plan users aren't automatically switched. Check workspace settings for comparison. Cancel current plan to subscribe to new plan. Old plan removal timeline unspecified.

**Q: Which Lambda functions count in invocations?**

Only Lambda functions in SST apps count; other account functions excluded.

**Q: Do personal stage functions count?**

Locally invoked functions not included.

**Q: Available options for high invocation volumes?**

Feel free to contact hello@sst.dev and we can figure out a pricing plan that works for you.
