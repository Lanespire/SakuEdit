# Next.js on AWS with SST

> Source: https://sst.dev/docs/start/aws/nextjs/

## Overview

There are two deployment approaches for Next.js applications on AWS using SST:

1. **Serverless with OpenNext** - Uses the `Nextjs` component
2. **Containers with Docker** - Uses the `Cluster` component with AWS Fargate and Amazon ECS

---

## Serverless Deployment

### Prerequisites
- Configure AWS credentials (see IAM credentials documentation)
- Node.js installed

### 1. Create a Project

```bash
npx create-next-app@latest aws-nextjs
cd aws-nextjs
```

Select **TypeScript** and do not select **ESLint**.

#### Initialize SST

```bash
npx sst@latest init
```

Select defaults and choose **AWS**. This creates `sst.config.ts`.

#### Start Dev Mode

```bash
npx sst dev
```

Click on **MyWeb** in the sidebar to open your Next.js app in the browser.

### 2. Add an S3 Bucket

Update `sst.config.ts` to add a public S3 bucket:

```typescript
// sst.config.ts
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

Add this before the `Nextjs` component.

#### Link the Bucket

```typescript
// sst.config.ts
new sst.aws.Nextjs("MyWeb", {
  link: [bucket]
});
```

### 3. Create an Upload Form

Create `components/form.tsx`:

```typescript
// components/form.tsx
"use client";
import styles from "./form.module.css";

export default function Form({ url }: { url: string }) {
  return (
    <form
      className={styles.form}
      onSubmit={async (e) => {
        e.preventDefault();
        const file = (e.target as HTMLFormElement).file.files?.[0] ?? null;
        const image = await fetch(url, {
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
  );
}
```

Add styles to `components/form.module.css`:

```css
/* components/form.module.css */
.form {
  padding: 2rem;
  border-radius: 0.5rem;
  background-color: var(--gray-alpha-100);
}

.form input {
  margin-right: 1rem;
}

.form button {
  appearance: none;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  background-color: transparent;
  font-family: var(--font-geist-sans);
  border: 1px solid var(--gray-alpha-200);
}

.form button:active:enabled {
  background-color: var(--gray-alpha-200);
}
```

### 4. Generate a Pre-signed URL

Replace your `Home` component in `app/page.tsx`:

```typescript
// app/page.tsx
import { Resource } from "sst";
import Form from "@/components/form";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export default async function Home() {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });
  const url = await getSignedUrl(new S3Client({}), command);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Form url={url} />
      </main>
    </div>
  );
}
```

**Key Points:**
- The `force-dynamic` directive prevents caching of pre-signed URLs
- Direct bucket access via `Resource.MyBucket.name`

Install dependencies:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### Test Your App

Navigate to `http://localhost:3000` and test the image upload functionality.

### 5. Deploy Your App

```bash
npx sst deploy --stage production
```

---

## Container Deployment

### Prerequisites
- Configure AWS credentials
- Docker Desktop running
- Node.js installed

### 1. Create a Project

```bash
npx create-next-app@latest aws-nextjs-container
cd aws-nextjs-container
```

Select **TypeScript** and do not select **ESLint**.

#### Initialize SST

```bash
npx sst@latest init
```

Select defaults and choose **AWS**.

### 2. Add a Service

Replace the `run` function in `sst.config.ts`:

```typescript
// sst.config.ts
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

**Configuration Details:**
- Creates a VPC and ECS Cluster with Fargate service
- `dev.command` runs Next.js locally during development
- Service is not deployed in dev mode by default

#### Start Dev Mode

```bash
npx sst dev
```

Click on **MyService** in the sidebar to open your app.

### 3. Add an S3 Bucket

Add below the `Vpc` component in `sst.config.ts`:

```typescript
// sst.config.ts
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

#### Link the Bucket

```typescript
// sst.config.ts
new sst.aws.Service("MyService", {
  // ...
  link: [bucket],
});
```

### 4. Create an Upload Form

Create `components/form.tsx`:

```typescript
// components/form.tsx
"use client";
import styles from "./form.module.css";

export default function Form({ url }: { url: string }) {
  return (
    <form
      className={styles.form}
      onSubmit={async (e) => {
        e.preventDefault();
        const file = (e.target as HTMLFormElement).file.files?.[0] ?? null;
        const image = await fetch(url, {
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
  );
}
```

Add styles to `components/form.module.css`:

```css
/* components/form.module.css */
.form {
  padding: 2rem;
  border-radius: 0.5rem;
  background-color: var(--gray-alpha-100);
}

.form input {
  margin-right: 1rem;
}

.form button {
  appearance: none;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  background-color: transparent;
  font-family: var(--font-geist-sans);
  border: 1px solid var(--gray-alpha-200);
}

.form button:active:enabled {
  background-color: var(--gray-alpha-200);
}
```

### 5. Generate a Pre-signed URL

Replace your `Home` component in `app/page.tsx`:

```typescript
// app/page.tsx
import { Resource } from "sst";
import Form from "@/components/form";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export default async function Home() {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });
  const url = await getSignedUrl(new S3Client({}), command);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Form url={url} />
      </main>
    </div>
  );
}
```

Install dependencies:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### Test Your App

Navigate to `http://localhost:3000` and test image uploads.

### 6. Deploy Your App

Enable Next.js standalone output in `next.config.ts`:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone"
};

export default nextConfig;
```

Create a `Dockerfile`:

```dockerfile
# Dockerfile
FROM node:lts-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY sst-env.d.ts* ./
RUN npm ci

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# If static pages do not need linked resources
RUN npm run build

# If static pages need linked resources
# RUN --mount=type=secret,id=SST_RESOURCE_MyResource,env=SST_RESOURCE_MyResource \
#   npm run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**Docker Configuration Notes:**
- Multi-stage build process for optimization
- For static pages requiring linked resources, mount secrets
- Declare each linked resource in the build step

Create `.dockerignore`:

```
.git
.next
node_modules
```

Deploy:

```bash
npx sst deploy --stage production
```

---

## Additional Resources

### Examples Available
- Adding basic authentication to Next.js apps
- Enabling streaming in Next.js apps
- Adding additional routes to the Next.js CDN
- Hit counter with Redis and Next.js in containers

### Connect the Console

Set up the SST Console for:
- Git push to deploy functionality
- Log viewing capabilities
- Free account creation at `console.sst.dev`

---

## Key Differences: Serverless vs. Containers

| Aspect | Serverless | Containers |
|--------|-----------|-----------|
| Component | `Nextjs` | `Service` with `Cluster` |
| Infrastructure | CloudFront + Lambda | Fargate + ECS |
| Build Tool | OpenNext | Docker |
| Scalability | Automatic | Manual/Auto-scaling groups |
| Cost Model | Pay-per-request | Fixed hourly billing |
