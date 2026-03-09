# Express on AWS with SST

> Source: https://sst.dev/docs/start/aws/express/

## Overview

Build an application using Express, incorporate an S3 Bucket for file uploads, and deploy it to AWS in a container using SST.

## Prerequisites

- Configure AWS credentials before starting
- Docker Desktop required for deployment

## Related Examples

- Build a hit counter with Express and Redis
- Use service discovery to connect to your Express app

---

## Step 1: Create a Project

Initialize the Express application:

```bash
mkdir aws-express && cd aws-express
npm init -y
npm install express
```

Create `index.mjs`:

```javascript
import express from "express";
const PORT = 80;
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!")
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

### Initialize SST

```bash
npx sst@latest init
npm install
```

This creates an `sst.config.ts` file in your project root.

---

## Step 2: Add a Service

Deploy the Express app using AWS Fargate with Amazon ECS. Update `sst.config.ts`:

```typescript
// sst.config.ts
async run() {
  const vpc = new sst.aws.Vpc("MyVpc");
  const cluster = new sst.aws.Cluster("MyCluster", { vpc });

  new sst.aws.Service("MyService", {
    cluster,
    loadBalancer: {
      ports: [{ listen: "80/http" }],
    },
    dev: {
      command: "node --watch index.mjs",
    },
  });
}
```

**Note:** The service does not deploy in dev mode; instead `dev.command` runs your Express app locally.

### Start Dev Mode

```bash
npx sst dev
```

After completion, click on **MyService** in the sidebar to access your Express app in the browser.

---

## Step 3: Add an S3 Bucket

Add this to `sst.config.ts` below the `Vpc` component:

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
```

### Link the Bucket

```typescript
new sst.aws.Service("MyService", {
  // ...
  link: [bucket],
});
```

This allows you to reference the bucket in your Express application.

---

## Step 4: Upload a File

Add a `POST` route for file uploads to `index.mjs`:

```javascript
app.post("/", upload.single("file"), async (req, res) => {
  const file = req.file;
  const params = {
    Bucket: Resource.MyBucket.name,
    ContentType: file.mimetype,
    Key: file.originalname,
    Body: file.buffer,
  };

  const uploadInstance = new Upload({
    params,
    client: s3,
  });

  await uploadInstance.done();

  res.status(200).send("File uploaded successfully.");
});
```

Add required imports to `index.mjs`:

```javascript
import multer from "multer";
import { Resource } from "sst";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const upload = multer({ storage: multer.memoryStorage() });
```

Install required packages:

```bash
npm install multer @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner
```

---

## Step 5: Download the File

Add a `/latest` route to retrieve the most recent uploaded file:

```javascript
app.get("/latest", async (req, res) => {
  const objects = await s3.send(
    new ListObjectsV2Command({
      Bucket: Resource.MyBucket.name,
    }),
  );

  const latestFile = objects.Contents.sort(
    (a, b) => b.LastModified - a.LastModified,
  )[0];

  const command = new GetObjectCommand({
    Key: latestFile.Key,
    Bucket: Resource.MyBucket.name,
  });

  const url = await getSignedUrl(s3, command);

  res.redirect(url);
});
```

### Test the Application

```bash
curl -F file=@package.json http://localhost:80/
```

Visit `http://localhost:80/latest` in your browser to download the uploaded file.

---

## Step 6: Deploy Your App

Create `Dockerfile`:

```dockerfile
FROM node:lts-alpine
WORKDIR /app/
COPY package.json /app
RUN npm install
COPY index.mjs /app
ENTRYPOINT ["node", "index.mjs"]
```

Create `.dockerignore`:

```
node_modules
```

Deploy to production:

```bash
npx sst deploy --stage production
```

Expected output shows your deployed service URL:

```
+  Complete   MyService: http://jayair-MyServiceLoadBala-592628062.us-east-1.elb.amazonaws.com
```

---

## Connect the Console

Set up the SST Console for automated git-push deployments and monitoring. Create a free account and connect it to your AWS account for enhanced deployment capabilities.
