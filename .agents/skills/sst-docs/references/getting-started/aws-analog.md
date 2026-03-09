# Analog on AWS with SST

> Source: https://sst.dev/docs/start/aws/analog/

## Overview

This guide demonstrates how to create an Analog application, integrate an S3 Bucket for file uploads, and deploy it to AWS using SST.

## Prerequisites

- Configure AWS credentials before starting.

---

## Step 1: Create a Project

Initialize a new Analog application:

```bash
npm create analog@latest
cd aws-analog
```

Select the "Full-stack Application" option without Tailwind CSS.

### Initialize SST

Add SST to your project:

```bash
npx sst@latest init
npm install
```

Choose AWS as your provider. This creates a `sst.config.ts` file.

Update your `vite.config.ts` with the Nitro preset:

```typescript
plugins: [analog({
  nitro: {
    preset: "aws-lambda",
  }
})],
```

### Start Development Mode

```bash
npx sst dev
```

Access your Analog app at `http://localhost:5173` by clicking "MyWeb" in the sidebar.

---

## Step 2: Add an S3 Bucket

Configure an S3 bucket for public file uploads in `sst.config.ts`:

```typescript
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

Link the bucket to your Analog application:

```typescript
new sst.aws.Analog("MyWeb", {
  link: [bucket],
});
```

---

## Step 3: Generate a Pre-Signed URL

Create `src/pages/index.server.ts` to generate server-side pre-signed URLs:

```typescript
import { Resource } from 'sst';
import { PageServerLoad } from '@analogjs/router';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const load = async ({ }: PageServerLoad) => {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    // @ts-ignore: Generated on deploy
    Bucket: Resource.MyBucket.name,
  });

  const url = await getSignedUrl(new S3Client({}), command);

  return {
    url
  };
};
```

Install required AWS SDK packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Note:** The bucket name is accessed directly via `Resource.MyBucket.name`.

---

## Step 4: Create an Upload Form

Replace `src/pages/index.page.ts` with this upload component:

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { injectLoad } from '@analogjs/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { load } from './index.server';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form (ngSubmit)="onSubmit($event)">
      <input type="file" name="file">
      <button type="submit">Upload</button>
    </form>
  `,
})
export default class HomeComponent {
  data = toSignal(injectLoad<typeof load>(), { requireSync: true });

  async onSubmit(event: Event): Promise<void> {
    const file = (event.target as HTMLFormElement)['file'].files?.[0]!;

    const image = await fetch(this.data().url, {
      body: file,
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Content-Disposition': `attachment; filename="${file.name}"`,
      },
    });

    window.location.href = image.url.split('?')[0];
  }
}
```

Test the upload functionality in your browser at `http://localhost:5173`.

---

## Step 5: Deploy Your App

Deploy to AWS:

```bash
npx sst deploy --stage production
```

You can use any stage name; production is recommended for live environments.

---

## Connect the Console

Set up the SST Console for automatic deployments and monitoring:

1. Create a free account at https://console.sst.dev
2. Connect it to your AWS account
3. Enable git push-to-deploy functionality
