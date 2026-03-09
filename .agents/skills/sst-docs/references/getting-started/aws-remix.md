# Remix on AWS with SST

> Source: https://sst.dev/docs/start/aws/remix/

## Overview

This guide presents two deployment approaches for Remix applications on AWS using SST:
1. **Serverless** architecture
2. **Container-based** deployment

---

## Serverless Deployment

### Prerequisites
- Configured AWS credentials

### Step 1: Create a Project

Initialize a new Remix application:

```bash
npx create-remix@latest aws-remix
cd aws-remix
```

All default options should be selected during setup.

#### Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose AWS as your provider. This generates an `sst.config.ts` file.

#### Start Development Mode

```bash
npx sst dev
```

This launches SST and your Remix application. Navigate to the sidebar, select **MyWeb**, and access your app in the browser.

---

### Step 2: Add an S3 Bucket

Enable public access to an S3 Bucket for file uploads by modifying `sst.config.ts`:

```typescript
// sst.config.ts
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

#### Link the Bucket

Connect the bucket to your Remix application:

```typescript
// sst.config.ts
new sst.aws.Remix("MyWeb", {
  link: [bucket],
});
```

---

### Step 3: Create an Upload Form

Replace the `Index` component in `app/routes/_index.tsx`:

```typescript
// app/routes/_index.tsx
export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <h1 className="leading text-2xl font-bold text-gray-800 dark:text-gray-100">
          Welcome to Remix
        </h1>
        <form
          className="flex flex-row gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const file = (e.target as HTMLFormElement).file.files?.[0]!;
            const image = await fetch(data.url, {
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
          <input
            name="file"
            type="file"
            accept="image/png, image/jpeg"
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100" />
          <button className="bg-violet-500 hover:bg-violet-700 text-white text-sm
            font-semibold py-2 px-4 rounded-full">
            Upload
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### Step 4: Generate a Pre-signed URL

Add the loader function above the `Index` component in `app/routes/_index.tsx`:

```typescript
// app/routes/_index.tsx
export async function loader() {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });
  const url = await getSignedUrl(new S3Client({}), command);

  return { url };
}
```

**Note:** We are directly accessing our S3 bucket with `Resource.MyBucket.name`.

Add necessary imports:

```typescript
// app/routes/_index.tsx
import { Resource } from "sst";
import { useLoaderData } from "@remix-run/react";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
```

Install dependencies:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Test the upload form at `http://localhost:5173` by uploading an image.

---

### Step 5: Deploy Your App

```bash
npx sst deploy --stage production
```

---

## Container-Based Deployment

### Prerequisites
- Configured AWS credentials
- Docker Desktop installed and running

### Step 1: Create a Project

```bash
npx create-remix@latest aws-remix-container
cd aws-remix-container
```

Select all default options.

#### Initialize SST

```bash
npx sst@latest init
```

Choose defaults and select AWS.

---

### Step 2: Add a Service

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

This creates a VPC and ECS Cluster with a Fargate service.

**Note:** By default, your service is not deployed when running in dev. The `dev.command` tells SST to instead run the Remix app locally in dev mode.

#### Start Development Mode

```bash
npx sst dev
```

Click **MyService** in the sidebar to access your app.

---

### Step 3: Add an S3 Bucket

Update `sst.config.ts`:

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

---

### Step 4: Create an Upload Form

Replace the `Index` component in `app/routes/_index.tsx`:

```typescript
// app/routes/_index.tsx
export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <h1 className="leading text-2xl font-bold text-gray-800 dark:text-gray-100">
          Welcome to Remix
        </h1>
        <form
          className="flex flex-row gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const file = (e.target as HTMLFormElement).file.files?.[0]!;
            const image = await fetch(data.url, {
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
          <input
            name="file"
            type="file"
            accept="image/png, image/jpeg"
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100" />
          <button className="bg-violet-500 hover:bg-violet-700 text-white text-sm
            font-semibold py-2 px-4 rounded-full">
            Upload
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### Step 5: Generate a Pre-signed URL

Add the loader function to `app/routes/_index.tsx`:

```typescript
// app/routes/_index.tsx
export async function loader() {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });
  const url = await getSignedUrl(new S3Client({}), command);

  return { url };
}
```

Add imports:

```typescript
// app/routes/_index.tsx
import { Resource } from "sst";
import { useLoaderData } from "@remix-run/react";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
```

Install dependencies:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Test at `http://localhost:5173`.

---

### Step 6: Deploy Your App

Create a `Dockerfile`:

```dockerfile
# Dockerfile
FROM node:lts-alpine as base
ENV NODE_ENV production

# Stage 1: Install all node_modules, including dev dependencies
FROM base as deps
WORKDIR /myapp
ADD package.json ./
RUN npm install --include=dev

# Stage 2: Setup production node_modules
FROM base as production-deps
WORKDIR /myapp
COPY --from=deps /myapp/node_modules /myapp/node_modules
ADD package.json ./
RUN npm prune --omit=dev

# Stage 3: Build the app
FROM base as build
WORKDIR /myapp
COPY --from=deps /myapp/node_modules /myapp/node_modules
ADD . .
RUN npm run build

# Stage 4: Build the production image
FROM base
WORKDIR /myapp
COPY --from=production-deps /myapp/node_modules /myapp/node_modules
COPY --from=build /myapp/build /myapp/build
COPY --from=build /myapp/public /myapp/public
ADD . .

CMD ["npm", "start"]
```

Create a `.dockerignore` file:

```
# .dockerignore
node_modules
.cache
build
public/build
```

Deploy:

```bash
npx sst deploy --stage production
```

---

## Connect the Console

Set up the SST Console for automated deployments and logging. Create a free account at https://console.sst.dev and connect it to your AWS account.
