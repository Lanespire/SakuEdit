# Cloudflare Workers with SST

> Source: https://sst.dev/docs/start/cloudflare/worker/

## Overview

This guide demonstrates building an API using a Cloudflare Worker with an R2 bucket for file uploads, deployed via SST.

## Prerequisites

- Create your Cloudflare API token before starting.

---

## Step 1: Create a Project

Initialize a new Node.js project:

```bash
mkdir my-worker && cd my-worker
npm init -y
```

### Initialize SST

Set up SST in your application:

```bash
npx sst@latest init
npm install
```

Select default options and choose **Cloudflare** as your provider. This creates an `sst.config.ts` file.

### Set Cloudflare API Token

Configure authentication credentials:

```bash
export CLOUDFLARE_API_TOKEN=aaaaaaaa_aaaaaaaaaaaa_aaaaaaaa
export CLOUDFLARE_DEFAULT_ACCOUNT_ID=aaaaaaaa_aaaaaaaaaaaa_aaaaaaaa
```

---

## Step 2: Add a Worker

Update `sst.config.ts` to include a Worker component:

```typescript
// sst.config.ts
async run() {
  const worker = new sst.cloudflare.Worker("MyWorker", {
    handler: "./index.ts",
    url: true,
  });

  return {
    api: worker.url,
  };
}
```

The `url: true` configuration enables the Worker URL for API access.

---

## Step 3: Add an R2 Bucket

Create an R2 bucket for file storage by adding to `sst.config.ts`:

```typescript
const bucket = new sst.cloudflare.Bucket("MyBucket");
```

Place this before the Worker component definition.

### Link the Bucket to Worker

Connect the bucket to your Worker:

```typescript
const worker = new sst.cloudflare.Worker("MyWorker", {
  handler: "./index.ts",
  link: [bucket],
  url: true,
});
```

---

## Step 4: Upload a File

Create `index.ts` with file upload functionality:

```typescript
// index.ts
import { Resource } from "sst";

export default {
  async fetch(req: Request) {
    if (req.method == "PUT") {
      const key = crypto.randomUUID();
      await Resource.MyBucket.put(key, req.body, {
        httpMetadata: {
          contentType: req.headers.get("content-type"),
        },
      });
      return new Response(`Object created with key: ${key}`);
    }
  },
};
```

**Note:** File uploads to R2 use the SDK method `Resource.MyBucket.put()`.

---

## Step 5: Download a File

Add download functionality to your `fetch` function in `index.ts`:

```typescript
if (req.method == "GET") {
  const first = await Resource.MyBucket.list().then(
    (res) =>
      res.objects.toSorted(
        (a, b) => a.uploaded.getTime() - b.uploaded.getTime(),
      )[0],
  );
  const result = await Resource.MyBucket.get(first.key);
  return new Response(result.body, {
    headers: {
      "content-type": result.httpMetadata.contentType,
    },
  });
}
```

**Methods used:**
- `Resource.MyBucket.list()` - retrieves files from the bucket
- `Resource.MyBucket.get()` - retrieves a specific file by key

### Start Development Mode

Launch your application:

```bash
npx sst dev
```

This outputs your API URL:

```
+  Complete   api: https://start-cloudflare-jayair-myworkerscript.sst-15d.workers.dev
```

### Test Your Application

Upload a file using curl:

```bash
curl --upload-file package.json https://start-cloudflare-jayair-myworkerscript.sst-15d.workers.dev
```

Access your API URL in a browser to download the recently uploaded file.

---

## Step 6: Deploy Your App

Deploy to production:

```bash
npx sst deploy --stage production
```

Use any stage name desired, though creating a dedicated production stage is recommended.
