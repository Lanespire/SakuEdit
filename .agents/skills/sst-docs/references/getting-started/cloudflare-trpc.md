# tRPC on Cloudflare with SST

> Source: https://sst.dev/docs/start/cloudflare/trpc/

## Overview

This guide demonstrates building a tRPC API with a simple client and deploying it to Cloudflare using SST.

## Prerequisites

- Create your Cloudflare API token before starting.

---

## Step 1: Create a Project

Initialize a new Node.js project:

```bash
mkdir my-trpc-app && cd my-trpc-app
npm init -y
```

### Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose **Cloudflare** as your platform. This generates `sst.config.ts`.

### Set Cloudflare Credentials

```bash
export CLOUDFLARE_API_TOKEN=aaaaaaaa_aaaaaaaaaaaa_aaaaaaaa
export CLOUDFLARE_DEFAULT_ACCOUNT_ID=aaaaaaaa_aaaaaaaaaaaa_aaaaaaaa
```

---

## Step 2: Add the API

Create two Workers - one for the tRPC server and one as a client. Update `sst.config.ts`:

```typescript
// sst.config.ts
async run() {
  const trpc = new sst.cloudflare.Worker("Trpc", {
    url: true,
    handler: "index.ts",
  });

  const client = new sst.cloudflare.Worker("Client", {
    url: true,
    link: [trpc],
    handler: "client.ts",
  });

  return {
    api: trpc.url,
    client: client.url,
  };
}
```

**Note:** Linking the server to the client enables accessing the server within the client.

---

## Step 3: Create the Server

Add tRPC server code to `index.ts`:

```typescript
// index.ts
import { z } from "zod";
import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const t = initTRPC.context().create();

const router = t.router({
  greet: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return `Hello ${input.name}!`;
    }),
});

export type Router = typeof router;

export default {
  async fetch(request: Request): Promise<Response> {
    return fetchRequestHandler({
      router,
      req: request,
      endpoint: "/",
      createContext: (opts) => opts,
    });
  },
};
```

This creates a `greet` method accepting a string input.

### Install Dependencies

```bash
npm install zod @trpc/server@next
```

---

## Step 4: Add the Client

Connect to the server in `client.ts`:

```typescript
// client.ts
import { Resource } from "sst";
import type { Router } from "./index";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

export default {
  async fetch() {
    const client = createTRPCClient<Router>({
      links: [
        httpBatchLink({
          url: "http://localhost/",
          fetch(req) {
            return Resource.Trpc.fetch(req);
          },
        }),
      ],
    });

    return new Response(
      await client.greet.query({
        name: "Patrick Star",
      }),
    );
  },
};
```

**Key Detail:** The server is accessed via `Resource.Trpc.fetch()`.

### Install Client Package

```bash
npm install @trpc/client@next
```

### Start Development Mode

```bash
npx sst dev
```

This provides two URLs for testing.

### Test the Application

```bash
curl https://my-trpc-app-jayair-clientscript.sst-15d.workers.dev
```

**Expected Output:** `Hello Patrick Star!`

---

## Step 5: Deploy Your App

Deploy to production:

```bash
npx sst deploy --stage production
```

You may use any stage name, though `production` is recommended for production deployments.
