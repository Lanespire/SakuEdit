# Set Up AWS Accounts

> Source: https://sst.dev/docs/aws-accounts/

## Overview

This guide describes an ideal multi-account AWS setup using AWS Organization and IAM Identity Center, allowing team members to authenticate via SSO rather than managing long-lived IAM credentials.

## Management Account Setup

### Creating the Account

- Use a work email alias (e.g., `aws@acme.com`)
- Set company name as the account name
- Complete billing info and identity verification
- Select basic support tier

### AWS Organization

Create an organization to manage multiple AWS accounts, enabling separation between dev and production environments.

### IAM Identity Center

Enable IAM Identity Center to provide organization-wide user management:

- Note the region where it's created (cannot be changed)
- Bookmark the auto-generated login URL (customizable)

## Root User Configuration

### Creating and Access Setup

1. Create a user in IAM Identity Center using work email
2. Assign the user to the management account
3. Create a permission set with `AdministratorAccess`
4. Configure session duration to 12 hours

### Login Process

- Accept the SSO invite via email
- Create and secure a password
- Access the AWS Console through the SSO portal

## Dev and Production Accounts

Create separate accounts by:

- Using AWS Organization to add new accounts
- Naming them with environment suffixes (e.g., `-dev`, `-production`)
- Using email aliases to receive account notifications
- Assigning users `AdministratorAccess` to both accounts

## AWS CLI Configuration

Set up `~/.aws/config` with:

```ini
[sso-session acme]
sso_start_url = https://acme.awsapps.com/start
sso_region = us-east-1

[profile acme-dev]
sso_session = acme
sso_account_id = <account-id>
sso_role_name = AdministratorAccess
region = us-east-1

[profile acme-production]
sso_session = acme
sso_account_id = <account-id>
sso_role_name = AdministratorAccess
region = us-east-1
```

Login command:

```bash
aws sso login --sso-session=acme
```

## SST Configuration

In `sst.config.ts`, set the AWS profile based on deployment stage:

```typescript
export default $config({
  app(input) {
    return {
      name: "my-sst-app",
      home: "aws",
      providers: {
        aws: {
          profile: input.stage === "production" ? "acme-production" : "acme-dev"
        }
      }
    };
  },
  async run() {
    // Your resources
  }
});
```

Deploy to production with:

```bash
sst deploy --stage production
```

## Key Benefits

- No long-lived credentials stored locally
- Centralized user management through IAM Identity Center
- Clear environment isolation
- Team-friendly SSO authentication
- 12-hour session duration reduces re-authentication friction
