# NestJS on AWS with SST

> Source: https://sst.dev/docs/start/aws/nestjs/

## Overview

Build an app with NestJS, add an S3 Bucket for file uploads, and deploy it to AWS in a container using SST.

## Prerequisites

- Node 22.12 or higher
- AWS credentials configured
- Docker Desktop (for deployment)
- Use `--experimental-require-module` flag if not on Node 22.12+

---

## Step 1: Create a Project

```bash
nest new aws-nestjs-container
cd aws-nestjs-container
```

Select npm as the package manager.

### Initialize SST

```bash
npx sst@latest init
npm install
```

This creates an `sst.config.ts` file. Update `tsconfig.json`:

```json
{
  "include": ["src/**/*", "test/**/*", "sst-env.d.ts"]
}
```

---

## Step 2: Add a Service

Update `sst.config.ts` to deploy with AWS Fargate:

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
      command: "npm run start:dev",
    },
  });
}
```

### Start Development Mode

```bash
npx sst dev
```

Access the app via the sidebar link to MyService.

---

## Step 3: Add an S3 Bucket

Add to `sst.config.ts`:

```typescript
const bucket = new sst.aws.Bucket("MyBucket");
```

### Link the Bucket

Update the Service configuration:

```typescript
new sst.aws.Service("MyService", {
  // ...
  link: [bucket],
});
```

---

## Step 4: Upload a File

Add to `src/app.controller.ts`:

```typescript
@Post()
@UseInterceptors(FileInterceptor('file'))
async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<string> {
  const params = {
    Bucket: Resource.MyBucket.name,
    ContentType: file.mimetype,
    Key: file.originalname,
    Body: file.buffer,
  };

  const upload = new Upload({
    params,
    client: s3,
  });

  await upload.done();

  return 'File uploaded successfully.';
}
```

Add imports:

```typescript
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { Resource } from 'sst';
import { Express } from 'express';
import { Upload } from '@aws-sdk/lib-storage';
import { FileInterceptor } from '@nestjs/platform-express';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Post, Redirect, UploadedFile, UseInterceptors } from '@nestjs/common';

const s3 = new S3Client({});
```

Install dependencies:

```bash
npm install -D @types/multer
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner
```

---

## Step 5: Download the File

Add to `src/app.controller.ts`:

```typescript
@Get('latest')
@Redirect('/', 302)
async getLatestFile() {
  const objects = await s3.send(
    new ListObjectsV2Command({
      Bucket: Resource.MyBucket.name,
    }),
  );

  const latestFile = objects.Contents.sort(
    (a, b) => b.LastModified.getTime() - a.LastModified.getTime(),
  )[0];

  const command = new GetObjectCommand({
    Key: latestFile.Key,
    Bucket: Resource.MyBucket.name,
  });
  const url = await getSignedUrl(s3, command);

  return { url };
}
```

### Test Your App

```bash
curl -F file=@package.json http://localhost:3000/
```

Visit `http://localhost:3000/latest` to download the uploaded file.

---

## Step 6: Deploy Your App

Create a `Dockerfile`:

```dockerfile
FROM node:22

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
```

Create `.dockerignore`:

```
dist
node_modules
```

Deploy:

```bash
npx sst deploy --stage production
```

This provides the Fargate service URL.

---

## Additional Notes

- Services do not deploy by default in dev mode
- Use `Resource.MyBucket.name` to access bucket configuration directly
- SST Console supports free accounts with AWS integration

## Related Examples

- Build a hit counter with NestJS and Redis

## Connect the Console

Set up SST Console for git push to deploy and monitoring at https://console.sst.dev.
