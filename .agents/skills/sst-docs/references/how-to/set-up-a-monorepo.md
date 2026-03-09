# Set Up a Monorepo

> Source: https://sst.dev/docs/set-up-a-monorepo/

## Overview

SST recommends using a monorepo structure for projects with multiple packages, rather than relying on drop-in mode for simple applications. A template is available at the SST monorepo repository to streamline setup.

## Getting Started

### Setup Steps

1. Navigate to the SST monorepo template repository on GitHub
2. Select "Use this template" to create a new repository
3. Clone your newly created repository locally
4. From the root directory, execute the renaming command with your application name
5. Install all dependencies using npm

After completing these steps, run `npx sst dev` from the project root.

## Directory Architecture

The monorepo follows this structure:

```
my-sst-app
├── sst.config.ts
├── package.json
├── packages
│   ├── functions
│   ├── scripts
│   └── core
└── infra
```

The root `package.json` defines workspaces pointing to `packages/*`.

## Packages Directory

### Core Package

The `core/` directory contains reusable code organized as modules. Modules follow a pattern:

```typescript
export module Example {
  export function hello() {
    return "Hello, world!";
  }
}
```

Module exports are configured in `package.json` to enable clean imports like `"@monorepo-template/core/example"`. This structure encourages Domain Driven Design principles.

The package includes Vitest testing, runnable via `npm test`.

### Functions Package

Contains Lambda function implementations that depend on the core package as a local dependency.

### Scripts Package

Houses utility scripts executable through the SST shell CLI using `tsx`. Run scripts from `packages/scripts/` with:

```bash
npm run shell src/example.ts
```

## Infrastructure Directory

The `infra/` directory organizes infrastructure code into logical files. Individual files export resources:

```typescript
export const bucket = new sst.aws.Bucket("MyBucket");
```

The `sst.config.ts` dynamically imports these infrastructure modules and aggregates their outputs for the application.

### Example sst.config.ts

```typescript
export default $config({
  app(input) {
    return {
      name: "my-sst-app",
      home: "aws"
    };
  },
  async run() {
    const storage = await import("./infra/storage");
    const api = await import("./infra/api");
    const web = await import("./infra/web");

    return {
      api: api.myApi.url,
      web: web.myWeb.url
    };
  }
});
```
