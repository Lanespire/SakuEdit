# Bun on AWS with SST

> Source: https://sst.dev/docs/start/aws/bun/

## Overview

This guide walks through building an application using Bun, adding S3 bucket functionality for file uploads, and deploying it to AWS in a container using SST.

## Prerequisites

- Configure AWS credentials before starting
- Docker Desktop required for deployment

## Related Examples

- Deploy Bun with Elysia in a container
- Build a hit counter with Bun and Redis

---

## Step 1: Create a Project

Initialize a new Bun application:

```bash
mkdir aws-bun && cd aws-bun
bun init -y
```

### Initialize Bun Server

Replace `index.ts` with:

```typescript
// index.ts
const server = Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/" && req.method === "GET") {
      return new Response("Hello World!");
    }
    return new Response("404!");
  },
});

console.log(`Listening on ${server.url}`);
```

This starts an HTTP server on port 3000.

### Add Development Scripts

Update `package.json`:

```json
"scripts": {
  "dev": "bun run --watch index.ts"
}
```

### Initialize SST

```bash
bunx sst init
bun install
```

This creates an `sst.config.ts` file and installs SST dependencies.

---

## Step 2: Add a Service

Deploy the Bun app using AWS Fargate with ECS. Update `sst.config.ts`:

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
      command: "bun dev",
    },
  });
}
```

**Key Points:**
- Services do not deploy by default in dev mode
- The `dev.command` runs your Bun app locally instead

### Start Development Mode

```bash
bun sst dev
```

Once running, click **MyService** in the sidebar to access your app in the browser.

---

## Step 3: Add an S3 Bucket

Add bucket configuration to `sst.config.ts`:

```typescript
// sst.config.ts
const bucket = new sst.aws.Bucket("MyBucket");
```

### Link the Bucket to Service

Update the Service configuration:

```typescript
new sst.aws.Service("MyService", {
  // ... existing config
  link: [bucket],
});
```

This enables referencing the bucket within your Bun application.

---

## Step 4: Upload a File

Add a POST route to upload files to S3. Add this to `index.ts`:

```typescript
if (url.pathname === "/" && req.method === "POST") {
  const formData = await req.formData();
  const file = formData.get("file")! as File;

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
  return new Response("File uploaded successfully.");
}
```

**Note:** Access bucket name directly via `Resource.MyBucket.name`.

### Add Required Imports

```typescript
// index.ts
import { Resource } from "sst";
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client();
```

### Install Dependencies

```bash
bun install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner
```

---

## Step 5: Download the File

Add a `/latest` route to download the most recent upload:

```typescript
if (url.pathname === "/latest" && req.method === "GET") {
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

  return Response.redirect(await getSignedUrl(s3, command));
}
```

### Test the Upload/Download

Upload a file:

```bash
curl -F file=@package.json http://localhost:3000/
```

Visit `http://localhost:3000/latest` in your browser to download the uploaded file.

---

## Step 6: Deploy Your App

### Create Dockerfile

```dockerfile
FROM oven/bun

COPY bun.lock .
COPY package.json .

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "index.ts"]
```

**Requirement:** Docker Desktop must be running to build and deploy.

### Add .dockerignore

```
node_modules
.git
.gitignore
README.md
Dockerfile*
```

### Deploy to Production

```bash
bun sst deploy --stage production
```

Output example:
```
+  Complete   MyService: http://prod-MyServiceLoadBalanc-491430065.us-east-1.elb.amazonaws.com
```

---

## Connect the Console

Set up SST Console for automated deployments and log viewing. Create a free account at https://console.sst.dev and connect your AWS account.
