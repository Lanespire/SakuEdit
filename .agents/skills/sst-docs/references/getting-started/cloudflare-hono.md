# Hono on Cloudflare with SST

> Source: https://sst.dev/docs/start/cloudflare/hono/

## Overview

This guide demonstrates building an API using Hono, integrating an R2 bucket for file uploads, and deploying via Cloudflare with SST.

## Prerequisites

- Create your Cloudflare API token before starting.

---

## Step 1: Create a Project

Initialize a new Node.js project:

```bash
mkdir my-hono-api && cd my-hono-api
npm init -y
```

### Initialize SST

Set up SST in your application:

```bash
npx sst@latest init
npm install
```

Select defaults and choose **Cloudflare** as your provider. This creates an `sst.config.ts` file.

### Set Cloudflare API Token

Configure your credentials:

```bash
export CLOUDFLARE_API_TOKEN=aaaaaaaa_aaaaaaaaaaaa_aaaaaaaa
export CLOUDFLARE_DEFAULT_ACCOUNT_ID=aaaaaaaa_aaaaaaaaaaaa_aaaaaaaa
```

---

## Step 2: Add a Worker

Update `sst.config.ts` to include a Cloudflare Worker:

```typescript
async run() {
  const hono = new sst.cloudflare.Worker("Hono", {
    url: true,
    handler: "index.ts",
  });

  return {
    api: hono.url,
  };
}
```

Enabling the Worker URL allows you to use it as your API endpoint.

---

## Step 3: Add an R2 Bucket

Add file storage capabilities by creating an R2 bucket. Update `sst.config.ts`:

```typescript
const bucket = new sst.cloudflare.Bucket("MyBucket");
```

### Link the Bucket to Worker

Connect the bucket to your Worker:

```typescript
const hono = new sst.cloudflare.Worker("Hono", {
  url: true,
  link: [bucket],
  handler: "index.ts",
});
```

---

## Step 4: Upload a File

Create `index.ts` with file upload functionality:

```typescript
import { Hono } from "hono";
import { Resource } from "sst";

const app = new Hono()
  .put("/*", async (c) => {
    const key = crypto.randomUUID();
    await Resource.MyBucket.put(key, c.req.raw.body, {
      httpMetadata: {
        contentType: c.req.header("content-type"),
      },
    });
    return c.text(`Object created with key: ${key}`);
  });

export default app;
```

**Note:** Uses the SDK method `Resource.MyBucket.put()` to upload to R2.

Install dependencies:

```bash
npm install hono
```

---

## Step 5: Download a File

Add a GET route to retrieve the most recently uploaded file:

```typescript
const app = new Hono()
  // ...
  .get("/", async (c) => {
    const first = await Resource.MyBucket.list().then(
      (res) =>
        res.objects.sort(
          (a, b) => a.uploaded.getTime() - b.uploaded.getTime(),
        )[0],
    );
    const result = await Resource.MyBucket.get(first.key);
    c.header("content-type", result.httpMetadata.contentType);
    return c.body(result.body);
  });
```

Methods used: `Resource.MyBucket.list()` retrieves files; `Resource.MyBucket.get()` fetches specific files.

### Start Development Mode

Launch the development server:

```bash
npx sst dev
```

This outputs your API URL, e.g., `https://my-hono-api-jayair-honoscript.sst-15d.workers.dev`

### Test the Application

Upload a file:

```bash
curl -X PUT --upload-file package.json https://my-hono-api-jayair-honoscript.sst-15d.workers.dev
```

Access the URL in your browser to download the uploaded file.

---

## Step 6: Deploy Your App

Deploy to production:

```bash
npx sst deploy --stage production
```

You can specify any stage name; using "production" distinguishes it from development environments.
