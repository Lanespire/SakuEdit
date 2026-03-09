# tRPC on AWS with SST

> Source: https://sst.dev/docs/start/aws/trpc/

## Overview

This guide demonstrates building a serverless tRPC API with a simple client and deploying it to AWS using SST.

## Prerequisites

- Configure AWS credentials before starting.

---

## Step 1: Create a Project

Initialize a new project:

```bash
mkdir my-trpc-app && cd my-trpc-app
npm init -y
```

### Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose **AWS**. This creates an `sst.config.ts` file in your project root.

---

## Step 2: Add the API

Create two Lambda functions -- one for the tRPC server and one for the client. Update `sst.config.ts`:

```typescript
// sst.config.ts
async run() {
  const trpc = new sst.aws.Function("Trpc", {
    url: true,
    handler: "index.handler",
  });

  const client = new sst.aws.Function("Client", {
    url: true,
    link: [trpc],
    handler: "client.handler",
  });

  return {
    api: trpc.url,
    client: client.url,
  };
}
```

**Note:** Linking the server to the client allows accessing the server URL within the client function.

### Start Dev Mode

```bash
npx sst dev
```

This runs functions in Live mode and outputs two URLs for testing.

---

## Step 3: Create the Server

Create `index.ts` with the tRPC server implementation:

```typescript
// index.ts
import { z } from "zod";
import {
  awsLambdaRequestHandler,
  CreateAWSLambdaContextOptions
} from "@trpc/server/adapters/aws-lambda";
import { initTRPC } from "@trpc/server";
import { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from "aws-lambda";

const t = initTRPC
  .context<CreateAWSLambdaContextOptions<APIGatewayProxyEvent | APIGatewayProxyEventV2>>()
  .create();

const router = t.router({
  greet: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return `Hello ${input.name}!`;
    }),
});

export type Router = typeof router;

export const handler = awsLambdaRequestHandler({
  router: router,
  createContext: (opts) => opts,
});
```

The example implements a simple `greet` method accepting a string input.

Install dependencies:

```bash
npm install zod @trpc/server@next
```

---

## Step 4: Add the Client

Create `client.ts` to connect to the server:

```typescript
// client.ts
import { Resource } from "sst";
import type { Router } from "./index";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

const client = createTRPCClient<Router>({
  links: [
    httpBatchLink({
      url: Resource.Trpc.url,
    }),
  ],
});

export async function handler() {
  return {
    statusCode: 200,
    body: await client.greet.query({ name: "Patrick Star" }),
  };
}
```

**Note:** Access the server using `Resource.Trpc.url`.

Install the client package:

```bash
npm install @trpc/client@next
```

### Test the Application

```bash
curl https://YOUR-CLIENT-LAMBDA-URL
```

Output: `Hello Patrick Star!`

---

## Step 5: Deploy Your App

Deploy to production:

```bash
npx sst deploy --stage production
```

Use any stage name, though creating a dedicated production stage is recommended.

---

## Connect the Console

Set up SST Console for git-push-to-deploy functionality and monitoring. Create a free account at console.sst.dev and connect it to your AWS account.
