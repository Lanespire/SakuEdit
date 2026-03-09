# Nuxt on AWS with SST

> Source: https://sst.dev/docs/start/aws/nuxt/

## Overview

Two deployment approaches for Nuxt applications on AWS using SST:

1. **Serverless** - Using the Nuxt component with S3 storage
2. **Containers** - Using ECS Fargate with Redis

---

## Serverless Approach

### Prerequisites
- AWS credentials configured for your account

### Step 1: Create a Project

```bash
npx nuxi@latest init aws-nuxt
cd aws-nuxt
```

Select **npm** as the package manager during initialization.

### Step 2: Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose **AWS** as your provider. This creates an `sst.config.ts` file.

Update your `nuxt.config.ts`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  nitro: {
    preset: 'aws-lambda'
  },
  devtools: { enabled: true }
})
```

### Step 3: Start Development Mode

```bash
npx sst dev
```

Once running, access your Nuxt app through the **MyWeb** link in the sidebar at `http://localhost:3000`.

### Step 4: Add an S3 Bucket

Update `sst.config.ts` to include a publicly accessible S3 bucket:

```typescript
// sst.config.ts
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});

new sst.aws.Nuxt("MyWeb", {
  link: [bucket],
});
```

### Step 5: Generate Pre-signed URLs

Create `server/api/presigned.ts` for uploading files:

```typescript
// server/api/presigned.ts
import { Resource } from "sst";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export default defineEventHandler(async () => {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });

  return await getSignedUrl(new S3Client({}), command);
})
```

**Note:** We are directly accessing our S3 bucket with `Resource.MyBucket.name`.

Install required dependencies:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 6: Create Upload Form

Replace `app.vue`:

```vue
<!-- app.vue -->
<script setup>
  const file = ref(null);
  const { data } = await useFetch('/api/presigned');

  async function onSubmit() {
    const upload = file.value.files[0];
    const image = await fetch(data.value, {
      body: upload,
      method: "PUT",
      headers: {
        "Content-Type": upload.type,
        "Content-Disposition": `attachment; filename="${upload.name}"`,
      },
    });

    window.location.href = image.url.split("?")[0];
  }
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <input type="file" ref="file" accept="image/png, image/jpeg" />
    <button type="submit">Upload</button>
  </form>
</template>
```

Test by uploading an image at `http://localhost:3000`.

### Step 7: Deploy Serverless App

```bash
npx sst deploy --stage production
```

---

## Container Approach

### Prerequisites
- AWS credentials configured
- Docker Desktop installed

### Step 1: Create Project

```bash
npx nuxi@latest init aws-nuxt-container
cd aws-nuxt-container
```

Select **npm** as the package manager.

### Step 2: Initialize SST

```bash
npx sst@latest init
npm install
```

Keep the default Node preset in `nuxt.config.ts`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
```

### Step 3: Configure Cluster

Replace the `run` function in `sst.config.ts`:

```typescript
// sst.config.ts
async run() {
  const vpc = new sst.aws.Vpc("MyVpc", { bastion: true });
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

**Note:** The `dev.command` tells SST to instead run our Nuxt app locally in dev mode.

### Step 4: Add Redis

Add to `sst.config.ts` after the Vpc component:

```typescript
// sst.config.ts
const redis = new sst.aws.Redis("MyRedis", { vpc });
```

Link Redis to the service:

```typescript
// sst.config.ts
new sst.aws.Service("MyService", {
  // ...
  link: [redis],
});
```

### Step 5: Install Tunnel

```bash
sudo npx sst tunnel install
```

This creates a network interface for local VPC access. Required only once per machine.

### Step 6: Start Development

```bash
npx sst dev
```

This deploys infrastructure, starts a tunnel, and runs your app locally.

### Step 7: Connect to Redis

Install the Redis client:

```bash
npm install ioredis
```

Create `server/api/counter.ts`:

```typescript
// server/api/counter.ts
import { Resource } from "sst";
import { Cluster } from "ioredis";

const redis = new Cluster(
  [{ host: Resource.MyRedis.host, port: Resource.MyRedis.port }],
  {
    dnsLookup: (address, callback) => callback(null, address),
    redisOptions: {
      tls: {},
      username: Resource.MyRedis.username,
      password: Resource.MyRedis.password,
    },
  }
);

export default defineEventHandler(async () => {
  return await redis.incr("counter");
})
```

**Note:** We are directly accessing our Redis cluster with `Resource.MyRedis.*`.

Update `app.vue`:

```vue
<!-- app.vue -->
<script setup lang="ts">
const { data: counter } = await useFetch("/api/counter")
</script>

<template>
  <p>Hit counter: {{ counter }}</p>
</template>
```

Test at `http://localhost:3000`. The counter increments on each page refresh.

### Step 8: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:lts AS base
WORKDIR /src

# Build
FROM base as build
COPY --link package.json package-lock.json ./
RUN npm install
COPY --link . .
RUN npm run build

# Run
FROM base
ENV PORT=3000
ENV NODE_ENV=production
COPY --from=build /src/.output /src/.output
CMD [ "node", ".output/server/index.mjs" ]
```

Create `.dockerignore`:

```
node_modules
```

### Step 9: Deploy Container App

```bash
npx sst deploy --stage production
```

---

## SST Console Integration

After deployment, connect the SST Console for monitoring and git-push-to-deploy functionality at https://console.sst.dev.
