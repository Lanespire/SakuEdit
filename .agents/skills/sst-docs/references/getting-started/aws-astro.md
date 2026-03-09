# Astro on AWS with SST

> Source: https://sst.dev/docs/start/aws/astro/

## Overview

This guide covers deploying Astro sites to AWS using SST with two approaches: serverless and containers. Both methods include step-by-step instructions for creating file upload functionality with S3 integration.

## Prerequisites

- AWS credentials configured properly
- Node.js and npm installed
- Docker Desktop (for container deployment only)

---

## Serverless Deployment

### 1. Create a Project

Initialize a new Astro project:

```bash
npm create astro@latest aws-astro
cd aws-astro
```

Select default options when prompted.

#### Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose **AWS**. This creates `sst.config.ts`.

Update your `astro.config.mjs` with:

```javascript
import aws from "astro-sst";
export default defineConfig({
  output: "server",
  adapter: aws()
});
```

#### Start Dev Mode

```bash
npx sst dev
```

Click **MyWeb** in the sidebar to access your Astro site.

### 2. Add an S3 Bucket

Update `sst.config.ts` to include a public bucket:

```typescript
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

Link the bucket to your Astro site:

```typescript
new sst.aws.Astro("MyWeb", {
  link: [bucket],
});
```

### 3. Create an Upload Form

Replace the `<Layout />` component in `src/pages/index.astro`:

```astro
<Layout title="Astro x SST">
  <main>
    <form action={url}>
      <input name="file" type="file" accept="image/png, image/jpeg" />
      <button type="submit">Upload</button>
    </form>
    <script>
      const form = document.querySelector("form");
      form!.addEventListener("submit", async (e) => {
        e.preventDefault();
        const file = form!.file.files?.[0]!;
        const image = await fetch(form!.action, {
          body: file,
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            "Content-Disposition": `attachment; filename="${file.name}"`,
          },
        });
        window.location.href = image.url.split("?")[0] || "/";
      });
    </script>
  </main>
</Layout>
```

Add styling:

```astro
<style>
  main {
    margin: auto;
    padding: 1.5rem;
    max-width: 60ch;
  }
  form {
    color: white;
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #23262d;
    background-image: none;
    background-size: 400%;
    border-radius: 0.6rem;
    background-position: 100%;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  }
  button {
    appearance: none;
    border: 0;
    font-weight: 500;
    border-radius: 5px;
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
    background-color: white;
    color: #111827;
  }
  button:active:enabled {
    background-color: #EEE;
  }
</style>
```

### 4. Generate a Pre-signed URL

Add to the header of `src/pages/index.astro`:

```astro
---
import { Resource } from "sst";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const command = new PutObjectCommand({
  Key: crypto.randomUUID(),
  Bucket: Resource.MyBucket.name,
});
const url = await getSignedUrl(new S3Client({}), command);
---
```

Install required packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Test locally at `http://localhost:4321`.

### 5. Deploy Your App

```bash
npx sst deploy --stage production
```

---

## Container Deployment

### 1. Create a Project

Initialize a new Astro project:

```bash
npm create astro@latest aws-astro-container
cd aws-astro-container
```

Select default options when prompted.

#### Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose **AWS**.

Install the Node.js adapter (instead of SST adapter):

```bash
npx astro add node
```

### 2. Add a Service

Update the `run` function in `sst.config.ts`:

```typescript
async run() {
  const vpc = new sst.aws.Vpc("MyVpc");
  const cluster = new sst.aws.Cluster("MyCluster", { vpc });

  new sst.aws.Service("MyService", {
    cluster,
    loadBalancer: {
      ports: [{ listen: "80/http", forward: "4321/http" }],
    },
    dev: {
      command: "npm run dev",
    },
  });
}
```

This creates a VPC and ECS Cluster with Fargate service. The `dev.command` runs Astro locally during development.

#### Start Dev Mode

```bash
npx sst dev
```

Click **MyService** to access your site.

### 3. Add an S3 Bucket

Add below the `Vpc` component:

```typescript
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

Link to the service:

```typescript
new sst.aws.Service("MyService", {
  // ...
  link: [bucket],
});
```

### 4. Create an Upload Form

Same as serverless section (Steps 3-4).

### 5. Deploy Your App

Create a `Dockerfile`:

```dockerfile
FROM node:lts AS base
WORKDIR /app

COPY package.json package-lock.json ./

FROM base AS prod-deps
RUN npm install --omit=dev

FROM base AS build-deps
RUN npm install

FROM build-deps AS build
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD node ./dist/server/entry.mjs
```

Create `.dockerignore`:

```
.DS_Store
node_modules
dist
```

Deploy:

```bash
npx sst deploy --stage production
```

---

## Connect the Console

Set up SST Console for git-push-to-deploy functionality and log viewing. Create a free account at https://console.sst.dev and connect it to your AWS account.
