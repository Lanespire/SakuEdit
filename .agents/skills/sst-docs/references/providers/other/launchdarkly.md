# LaunchDarkly

> Source: https://www.pulumi.com/registry/packages/launchdarkly
> Package: `@lbrlabs/pulumi-lauchdarkly`
> SST Install: `sst add @lbrlabs/pulumi-lauchdarkly`

## Overview

The LaunchDarkly provider enables provisioning of LaunchDarkly feature flag management resources through Pulumi. LaunchDarkly is a feature management platform that allows teams to safely deploy and control feature flags across applications.

## Configuration

Configuration details are available in the LaunchDarkly provider installation and configuration section. The provider requires a LaunchDarkly API access token.

**Pulumi.yaml:**
```yaml
config:
  launchdarkly:accessToken:
    value: YOUR_ACCESS_TOKEN
```

**Environment Variable:**
```bash
export LAUNCHDARKLY_ACCESS_TOKEN="api-your-token"
```

## Key Resources

- `launchdarkly.AccessToken` - Manage API access tokens
- `launchdarkly.Project` - Feature flag project management
- `launchdarkly.Environment` - Environment configuration
- `launchdarkly.FeatureFlag` - Feature flag definitions
- `launchdarkly.Segment` - User segment management

## Example

```typescript
import * as launchdarkly from "@lbrlabs/pulumi-lauchdarkly";

const sa = new launchdarkly.AccessToken("example", {
  role: "Reader",
});
```
