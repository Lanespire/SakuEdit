# SST Docs Skill — Navigation Guide

## Structure

```
sst-docs/
  SKILL.md           # Main skill file — read first for overview + best practices
  AGENTS.md          # This navigation guide
  references/        # Detailed reference files (read on-demand)
    getting-started/ # Framework-specific setup guides
    concepts/        # Core concepts (Live, State, Linking, etc.)
    how-to/          # Configuration & setup guides
    components/
      aws/           # AWS component API docs (40+ components)
      cloudflare/    # Cloudflare component API docs (4 components)
    providers/       # External provider docs (150+ providers)
      _index.md      # Master provider list with packages and links
      cloud/         # AWS, Azure, GCP, DigitalOcean, etc.
      database/      # Postgres, MySQL, MongoDB, Redis, etc.
      monitoring/    # Datadog, NewRelic, Grafana, etc.
      identity/      # Auth0, Okta, Keycloak, etc.
      ci-cd/         # GitHub, GitLab, Buildkite, etc.
      container/     # Docker, Kubernetes, etc.
      cdn-dns/       # Cloudflare, Fastly, DNSimple, etc.
      other/         # All other providers
    reference/       # CLI, SDK, Global, Config docs
    examples/        # Example projects index
```

## Usage

1. Read `SKILL.md` for SST overview, best practices, and component selection guide
2. Browse `references/` for detailed documentation on specific topics
3. Reference files are loaded on-demand — read only what you need

## When to Apply

Reference these docs when:
- Building or configuring SST applications
- Choosing and configuring SST components
- Adding or configuring providers
- Setting up custom domains, monorepos, or CI/CD
- Debugging deployment or configuration issues
- Looking up component API details (props, methods, events)

## Quick Lookup Patterns

### Need a component API?
→ `references/components/aws/<component-name>.md`

### Need provider setup?
→ `references/providers/<category>/<provider-name>.md`

### Need framework setup?
→ `references/getting-started/aws-<framework>.md`

### Need configuration help?
→ `references/how-to/<topic>.md`
