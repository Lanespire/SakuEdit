# SolidStart on AWS with SST

> Source: https://sst.dev/docs/start/aws/solid/

## Overview

There are two ways to deploy SolidStart apps to AWS with SST - serverless and container-based approaches.

## Serverless Deployment

### Prerequisites
- Configure AWS credentials before starting development.

### Step 1: Create a Project

Initialize a new SolidStart application:

```bash
npm init solid@latest aws-solid-start
cd aws-solid-start
```

Select SolidStart, basic template, and TypeScript options.

#### Initialize SST

```bash
npx sst@latest init
npm install
```

Choose AWS as the provider. Update `app.config.ts`:

```typescript
export default defineConfig({
  server: {
    preset: "aws-lambda",
    awsLambda: {
      streaming: true,
    },
  },
});
```

### Step 2: Start Development Mode

```bash
npx sst dev
```

Access the SolidStart app at `http://localhost:3000` through the MyWeb component in the sidebar.

### Step 3: Add an S3 Bucket

Update `sst.config.ts` to include:

```typescript
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});

new sst.aws.SolidStart("MyWeb", {
  link: [bucket],
});
```

### Step 4: Generate Pre-signed URLs

Add this code to `src/routes/index.tsx`:

```typescript
async function presignedUrl() {
  "use server";
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });
  return await getSignedUrl(new S3Client({}), command);
}

export const route = {
  load: () => presignedUrl(),
};
```

Required imports for `src/routes/index.tsx`:

```typescript
import { Resource } from "sst";
import { createAsync } from "@solidjs/router";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
```

Install dependencies:

```bash
npm install @solidjs/router @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 5: Create Upload Form

Replace the Home component in `src/routes/index.tsx`:

```typescript
export default function Home() {
  const url = createAsync(() => presignedUrl());

  return (
    <main>
      <h1>Hello world!</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          const file = (e.target as HTMLFormElement).file.files?.[0]!;
          const image = await fetch(url() as string, {
            body: file,
            method: "PUT",
            headers: {
              "Content-Type": file.type,
              "Content-Disposition": `attachment; filename="${file.name}"`,
            },
          });

          window.location.href = image.url.split("?")[0];
        }}
      >
        <input name="file" type="file" accept="image/png, image/jpeg" />
        <button type="submit">Upload</button>
      </form>
    </main>
  );
}
```

Test at `http://localhost:3000` with image uploads.

### Step 6: Deploy to Production

```bash
npx sst deploy --stage production
```

---

## Container-Based Deployment

### Prerequisites
- Configure AWS credentials
- Docker Desktop installed for deployment

### Step 1: Create a Project

```bash
npm init solid@latest aws-solid-container
cd aws-solid-container
```

Select SolidStart, basic template, and TypeScript.

#### Initialize SST

```bash
npx sst@latest init
npm install
```

Choose AWS as provider. Update `app.config.ts` to use the default Node preset:

```typescript
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({});
```

### Step 2: Configure ECS Cluster

Update the `run` function in `sst.config.ts`:

```typescript
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

Note: The service runs locally in dev mode rather than being deployed.

### Step 3: Add Redis

Add to `sst.config.ts` below the Vpc component:

```typescript
const redis = new sst.aws.Redis("MyRedis", { vpc });

new sst.aws.Service("MyService", {
  // ...
  link: [redis],
});
```

#### Install Network Tunnel

```bash
sudo npx sst tunnel install
```

This creates a network interface for local Redis access and requires sudo.

### Step 4: Start Development

```bash
npx sst dev
```

This deploys the app, starts a tunnel, and runs SolidStart locally.

### Step 5: Connect to Redis

Install required packages:

```bash
npm install ioredis @solidjs/router
```

Update `src/routes/index.tsx`:

```typescript
import { Resource } from "sst";
import { Cluster } from "ioredis";
import { createAsync, cache } from "@solidjs/router";

const getCounter = cache(async () => {
  "use server";
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

  return await redis.incr("counter");
}, "counter");

export const route = {
  load: () => getCounter(),
};

export default function Page() {
  const counter = createAsync(() => getCounter());

  return <h1>Hit counter: {counter()}</h1>;
}
```

Test at `http://localhost:3000` - counter increments with each page refresh.

### Step 6: Create Dockerfile

```dockerfile
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

### Step 7: Deploy Production

```bash
npx sst deploy --stage production
```

---

## Key Concepts

**Linking**: Resources are linked to applications using the `link` property, enabling direct resource access through the `Resource` object without manual configuration.

**Dev Mode**: Development mode runs applications locally while maintaining connections to cloud resources through tunnels when necessary.

**Pre-signed URLs**: AWS S3 pre-signed URLs enable secure temporary access for file uploads without exposing permanent credentials.

## Connect the Console

Set up the SST Console for git-push-to-deploy and monitoring capabilities. Create a free account at `console.sst.dev`.
