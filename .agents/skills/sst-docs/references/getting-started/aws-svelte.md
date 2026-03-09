# SvelteKit on AWS with SST

> Source: https://sst.dev/docs/start/aws/svelte/

## Overview

There are two deployment approaches for SvelteKit applications on AWS using SST:
1. **Serverless**
2. **Containers**

---

## Serverless Deployment

### Prerequisites
- Configure AWS credentials before starting

### 1. Create a Project

Initialize a new SvelteKit application:

```bash
npx sv create aws-svelte-kit
cd aws-svelte-kit
```

Select **SvelteKit minimal** and **Yes, using TypeScript syntax** options.

#### Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose **AWS**. This creates `sst.config.ts`.

Update `svelte.config.mjs`:

```javascript
import adapter from "svelte-kit-sst";
```

#### Start Development Mode

```bash
npx sst dev
```

Click **MyWeb** in the sidebar to access your SvelteKit app at `http://localhost:5173`.

### 2. Add an S3 Bucket

Update `sst.config.ts` to include a publicly accessible bucket:

```typescript
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

#### Link the Bucket

```typescript
new sst.aws.SvelteKit("MyWeb", {
  link: [bucket]
});
```

### 3. Create an Upload Form

Replace `src/routes/+page.svelte`:

```svelte
<script>
  /** @type {import('./$types').PageData} */
  export let data;

  const handleSubmit = async (e) => {
    const formData = new FormData(e.target);
    const file = formData.get("file");

    const image = await fetch(data.url, {
      body: file,
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "Content-Disposition": `attachment; filename="${file.name}"`,
      },
    });

    window.location.href = image.url.split("?")[0];
  };
</script>

<section>
  <form on:submit|preventDefault={handleSubmit}>
    <input name="file" type="file" accept="image/png, image/jpeg" />
    <button type="submit">Upload</button>
  </form>
</section>

<style>
  section {
    flex: 0.6;
    display: flex;
    padding-top: 4rem;
    align-items: center;
    flex-direction: column;
    justify-content: center;
  }
</style>
```

### 4. Generate a Pre-signed URL

Create `src/routes/+page.server.ts`:

```typescript
import { Resource } from "sst";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });
  const url = await getSignedUrl(new S3Client({}), command);

  return { url };
}
```

**Note:** Directly access the S3 bucket using `Resource.MyBucket.name`.

Install required packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Test the upload at `http://localhost:5173` by uploading an image.

### 5. Deploy Your App

```bash
npx sst deploy --stage production
```

---

## Container Deployment

### Prerequisites
- Configure AWS credentials before starting
- Docker Desktop must be running

### 1. Create a Project

```bash
npx sv create aws-svelte-container
cd aws-svelte-container
```

Select **SvelteKit minimal** and **Yes, using TypeScript syntax** options.

#### Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose **AWS**. This creates `sst.config.ts`.

#### Configure Node.js Adapter

```bash
npm i -D @sveltejs/adapter-node
```

Update `svelte.config.mjs`:

```javascript
import adapter from '@sveltejs/adapter-node';
```

### 2. Add a Service

Replace the `run` function in `sst.config.ts`:

```typescript
async run() {
  const vpc = new sst.aws.Vpc("MyVpc");
  const cluster = new sst.aws.Cluster("MyCluster", { vpc });

  new sst.aws.Service("MyService", {
    cluster,
    loadBalancer: {
      ports: [{ listen: "80/http", forward: "3000/http" }],
    },
    dev: {
      command: "npm run dev",
    },
  });
}
```

This creates a VPC and ECS Cluster with Fargate service.

**Note:** By default, your service is not deployed when running in dev. The `dev.command` runs SvelteKit locally instead.

#### Start Development Mode

```bash
npx sst dev
```

Click **MyService** in the sidebar to access your app.

### 3. Add an S3 Bucket

Update `sst.config.ts` below the `Vpc` component:

```typescript
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

#### Link the Bucket

```typescript
new sst.aws.Service("MyService", {
  // ...
  link: [bucket],
});
```

### 4. Create an Upload Form

Replace `src/routes/+page.svelte` (identical to serverless approach):

```svelte
<script>
  /** @type {import('./$types').PageData} */
  export let data;

  const handleSubmit = async (e) => {
    const formData = new FormData(e.target);
    const file = formData.get("file");

    const image = await fetch(data.url, {
      body: file,
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "Content-Disposition": `attachment; filename="${file.name}"`,
      },
    });

    window.location.href = image.url.split("?")[0];
  };
</script>

<section>
  <form on:submit|preventDefault={handleSubmit}>
    <input name="file" type="file" accept="image/png, image/jpeg" />
    <button type="submit">Upload</button>
  </form>
</section>

<style>
  section {
    flex: 0.6;
    display: flex;
    padding-top: 4rem;
    align-items: center;
    flex-direction: column;
    justify-content: center;
  }
</style>
```

### 5. Generate a Pre-signed URL

Create `src/routes/+page.server.ts`:

```typescript
import { Resource } from "sst";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });
  const url = await getSignedUrl(new S3Client({}), command);

  return { url };
}
```

Install packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 6. Deploy Your App

Create `Dockerfile`:

```dockerfile
FROM node:18.18.0-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --prod

FROM builder AS deployer
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]
```

Create `.dockerignore`:

```
.DS_Store
node_modules
```

Deploy:

```bash
npx sst deploy --stage production
```

---

## Connect the Console

Set up SST Console for git-push deployment capabilities. Create a free account at https://console.sst.dev and connect your AWS account.
