# Hono on AWS with SST

> Source: https://sst.dev/docs/start/aws/hono/

## Overview

There are two deployment approaches for Hono applications on AWS using SST:
1. **Serverless** (Lambda-based)
2. **Containers** (Fargate-based)

Additional examples available include streaming capabilities and Redis integration with containers.

## Prerequisites
- AWS credentials configured for deployment
- Node.js environment set up
- Docker Desktop (required for container deployments)

---

## Serverless Deployment

### Step 1: Create a Project

```bash
npm create hono@latest aws-hono
cd aws-hono
```

Select the **aws-lambda** template when prompted.

#### Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose **AWS** as the provider. This generates `sst.config.ts`.

### Step 2: Add an API

**File: `sst.config.ts`**
```typescript
async run() {
  new sst.aws.Function("Hono", {
    url: true,
    handler: "src/index.handler",
  });
}
```

This creates a Lambda function with a function URL enabled.

#### Start Development Mode

```bash
npx sst dev
```

This runs functions in Live mode and outputs the API URL.

### Step 3: Add an S3 Bucket

**File: `sst.config.ts`**
```typescript
const bucket = new sst.aws.Bucket("MyBucket");
```

Link the bucket to the API:
```typescript
new sst.aws.Function("Hono", {
  url: true,
  link: [bucket],
  handler: "src/index.handler",
});
```

### Step 4: Upload a File

**File: `src/index.ts`**
```typescript
app.get('/', async (c) => {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });
  return c.text(await getSignedUrl(s3, command));
});
```

**Required Imports:**
```typescript
import { Resource } from 'sst'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'

const s3 = new S3Client();
```

**Install Dependencies:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 5: Download a File

**File: `src/index.ts`**
```typescript
app.get('/latest', async (c) => {
  const objects = await s3.send(
    new ListObjectsV2Command({
      Bucket: Resource.MyBucket.name,
    }),
  );

  const latestFile = objects.Contents!.sort(
    (a, b) =>
      (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0),
  )[0];

  const command = new GetObjectCommand({
    Key: latestFile.Key,
    Bucket: Resource.MyBucket.name,
  });

  return c.redirect(await getSignedUrl(s3, command));
});
```

**Test Upload:**
```bash
curl --upload-file package.json "$(curl https://YOUR-API-URL)"
```

Visit `https://YOUR-API-URL/latest` to download the uploaded file.

### Step 6: Deploy Your App

```bash
npx sst deploy --stage production
```

---

## Container Deployment

### Step 1: Create a Project

```bash
npm create hono@latest aws-hono-container
cd aws-hono-container
```

Select the **nodejs** template.

#### Initialize SST

```bash
npx sst@latest init
npm install
```

### Step 2: Add a Service

**File: `sst.config.ts`**
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

This creates a VPC, ECS cluster, and Fargate service. The `dev.command` specifies local execution during development.

#### Start Development Mode

```bash
npx sst dev
```

Click **MyService** in the sidebar to access your app in the browser.

### Step 3: Add an S3 Bucket

**File: `sst.config.ts`**
```typescript
const bucket = new sst.aws.Bucket("MyBucket");
```

Link to the service:
```typescript
new sst.aws.Service("MyService", {
  // ...
  link: [bucket],
});
```

### Step 4: Upload a File

**File: `src/index.ts`**
```typescript
app.post('/', async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'] as File;

  const params = {
    Bucket: Resource.MyBucket.name,
    ContentType: file.type,
    Key: file.name,
    Body: file,
  };
  const upload = new Upload({
    params,
    client: s3,
  });
  await upload.done();

  return c.text('File uploaded successfully.');
});
```

**Required Imports:**
```typescript
import { Resource } from 'sst'
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client();
```

**Install Dependencies:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner
```

### Step 5: Download the File

**File: `src/index.ts`**
```typescript
app.get('/latest', async (c) => {
  const objects = await s3.send(
    new ListObjectsV2Command({
      Bucket: Resource.MyBucket.name,
    }),
  );
  const latestFile = objects.Contents!.sort(
    (a, b) =>
      (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0),
  )[0];
  const command = new GetObjectCommand({
    Key: latestFile.Key,
    Bucket: Resource.MyBucket.name,
  });
  return c.redirect(await getSignedUrl(s3, command));
});
```

**Test Upload:**
```bash
curl -F file=@package.json http://localhost:3000/
```

Visit `http://localhost:3000/latest` to download the file.

### Step 6: Deploy Your App

**File: `Dockerfile`**
```dockerfile
FROM node:lts-alpine AS base

FROM base AS builder
RUN apk add --no-cache gcompat
WORKDIR /app
COPY package*json tsconfig.json src ./
COPY sst-env.d.ts* ./
RUN npm ci && \
  npm run build && \
  npm prune --production

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono
COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono
EXPOSE 3000
CMD ["node", "/app/dist/index.js"]
```

**File: `.dockerignore`**
```
node_modules
.git
```

**File: `tsconfig.json`**
```json
{
  "compilerOptions": {
    "outDir": "./dist"
  },
  "exclude": ["node_modules"]
}
```

**Install TypeScript:**
```bash
npm install typescript --save-dev
```

**File: `package.json` (scripts section)**
```json
"scripts": {
  "build": "tsc"
}
```

**Deploy:**
```bash
npx sst deploy --stage production
```

Output includes the Fargate service URL.

---

## Connect the Console

Set up the SST Console for git-push-to-deploy functionality and log viewing. Visit [console.sst.dev](https://console.sst.dev) to create a free account and connect to your AWS infrastructure.
