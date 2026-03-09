# Deno on AWS with SST

> Source: https://sst.dev/docs/start/aws/deno/

## Overview

This guide demonstrates building an application with Deno, incorporating an S3 Bucket for file uploads, and deploying it to AWS in a container using SST.

## Prerequisites

- Configure AWS credentials before starting
- Docker Desktop required for deployment

---

## Step 1: Create a Project

### Initialize Deno

```bash
deno init aws-deno
```

### Initialize Deno Serve

Replace `main.ts` with:

```typescript
// main.ts
Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/" && req.method === "GET") {
    return new Response("Hello World!");
  }
  return new Response("404!");
});
```

This starts an HTTP server on port 8000 by default.

### Initialize SST

Ensure SST is installed globally, then run:

```bash
sst init
```

This creates an `sst.config.ts` file in your project root.

---

## Step 2: Add a Service

Update `sst.config.ts` to deploy via AWS Fargate with Amazon ECS:

```typescript
// sst.config.ts
async run() {
  const vpc = new sst.aws.Vpc("MyVpc");
  const cluster = new sst.aws.Cluster("MyCluster", { vpc });

  new sst.aws.Service("MyService", {
    cluster,
    loadBalancer: {
      ports: [{ listen: "80/http", forward: "8000/http" }],
    },
    dev: {
      command: "deno task dev",
    },
  });
}
```

This creates a VPC with an ECS Cluster and adds a Fargate service.

**Note:** By default, your service is not deployed when running in dev. The `dev.command` runs your Deno app locally instead.

### Start Dev Mode

```bash
sst dev
```

Once complete, click **MyService** in the sidebar to view your Deno app in a browser.

---

## Step 3: Add an S3 Bucket

Add to `sst.config.ts` below the `Vpc` component:

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
```

### Link the Bucket

Update the Service to include:

```typescript
new sst.aws.Service("MyService", {
  // ...
  link: [bucket],
});
```

This enables bucket reference in your Deno app.

---

## Step 4: Upload a File

Add a POST route to `main.ts` to upload files to S3:

```typescript
// main.ts
if (url.pathname === "/" && req.method === "POST") {
  const formData: FormData = await req.formData();
  const file: File | null = formData?.get("file") as File;

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

**Note:** We are directly accessing our S3 bucket with `Resource.MyBucket.name`.

### Add Imports

```typescript
// main.ts
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
deno install npm:sst npm:@aws-sdk/client-s3 npm:@aws-sdk/lib-storage npm:@aws-sdk/s3-request-presigner
```

---

## Step 5: Download the File

Add a `/latest` route to `main.ts`:

```typescript
// main.ts
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

### Test Your App

Upload a file from your project root:

```bash
curl -F file=@deno.json http://localhost:8000/
```

Visit `http://localhost:8000/latest` in your browser to download the uploaded file.

---

## Step 6: Deploy Your App

### Create a Dockerfile

```dockerfile
# Dockerfile
FROM denoland/deno
EXPOSE 8000
USER deno
WORKDIR /app
ADD . /app
RUN deno install --entrypoint main.ts
CMD ["run", "--allow-all",  "main.ts"]
```

**Note:** You need to be running Docker Desktop to deploy your app.

### Deploy

```bash
sst deploy --stage production
```

This outputs your Deno app's URL:

```
+  Complete   MyService: http://prod-MyServiceLoadBalanc-491430065.us-east-1.elb.amazonaws.com
```

---

## Related Examples

- Build a hit counter with Deno and Redis

## Connect the Console

Setup the SST Console for git push-to-deploy functionality and log viewing. Create a free account at https://console.sst.dev and connect it to your AWS account.
