# AWS IAM

> Source: https://www.pulumi.com/registry/packages/aws-iam
> Package: `aws-iam`
> SST Install: `sst add aws-iam`

## Overview

The Pulumi AWS IAM component enables creation of AWS Identity and Access Management (IAM) resources across all supported Pulumi programming languages. Heavily inspired by the Terraform AWS IAM Module, it delivers comparable functionality for infrastructure-as-code IAM management.

- **Current Version:** v0.0.3
- **Publisher:** Pulumi
- **Repository:** [pulumi/pulumi-aws-iam](https://github.com/pulumi/pulumi-aws-iam)

## Configuration

### Password Policy Options

- Minimum length specification
- Character type requirements (numbers, symbols, uppercase, lowercase)
- User change permissions
- Hard expiry settings

### Role Configuration

- Trust relationship definitions
- MFA requirement enforcement
- Attached policy ARN specification
- Custom naming and tagging

### EKS-Specific Features

- Namespace service account mapping
- VPC CNI policy options
- OIDC provider ARN configuration

## Key Resources

### Account Management

- **Account** - Configure account aliases and password policies

### User Management

- **User** - Create IAM users with optional PGP key encryption

### Roles

- **AssumableRole** - Basic role with trust relationships and MFA requirements
- **AssumableRoleWithOIDC** - Roles configured for OpenID Connect provider authentication
- **AssumableRoleWithSAML** - Roles supporting SAML provider authentication
- **AssumableRoles** - Multi-role setup (admin, poweruser, readonly)
- **EKSRole** - Specialized role for Kubernetes cluster service accounts

### Groups

- **GroupWithAssumableRolesPolicy** - Groups enabling cross-account role assumption
- **GroupWithPolicies** - Groups with attached policies and self-management options

### Policies

- **Policy** - Custom IAM policies with JSON policy documents
- **ReadOnlyPolicy** - Pre-configured read-only access for specified AWS services

### EKS Integration

- **RoleForServiceAccountsEks** - IRSA (IAM Roles for Service Accounts) with OIDC provider configuration

## Example

```typescript
import * as iam from "@pulumi/aws-iam";

const account = new iam.Account("account", {
  accountAlias: "cool-alias",
  passwordPolicy: {
    minimumLength: 37,
    requireNumbers: false,
    requireSymbols: true,
    requireLowercaseCharacters: true,
    requireUppercaseCharacters: true,
  },
});

const assumableRole = new iam.AssumableRole("assumable-role", {
  trustedRoleArns: ["arn:aws:iam::307990089504:root"],
  role: {
    name: "custom",
    requiresMfa: true,
  },
});

const policy = new iam.Policy("policy", {
  name: "example",
  path: "/",
  description: "My example policy",
  policyDocument: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: ["ec2:Describe*"],
        Effect: "Allow",
        Resource: "*",
      },
    ],
  }),
});
```

```yaml
resources:
  eksRole:
    type: "aws-iam:index:EKSRole"
    properties:
      role:
        name: "eks-role"
        policyArns:
          - "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
      tags:
        Name: "eks-role"
```
